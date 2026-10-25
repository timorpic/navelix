import { afterEach, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { db } from "../db.ts";
import { registerEEDrivers } from "../ee-bridge/index.ts";
import { saveLicenseKey, getStoredLicenseKey, verifyLicenseKey, removeLicenseKey } from "../license.ts";
import { assertSeatCapacity, licenseSeatLimit, LicenseSeatError } from "../license-seats.ts";
import { assertAccountSeatAvailable, enabledAccountCount } from "../license-seat-store.ts";
import { updateUser } from "../admin-users.ts";

const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");
registerEEDrivers({ officialPublicKey: publicKey.export({ type: "spki", format: "pem" }).toString() });
function token(plan: string, maxSeats?: number) {
  const data = JSON.stringify({ licenseId: crypto.randomUUID(), customer: "Seat test", email: "test@example.com", plan, maxSeats, features: ["all"], issuedAt: Date.now(), expiresAt: 0 });
  return `${Buffer.from(data).toString("base64url")}.${crypto.sign(null, Buffer.from(data), privateKey).toString("base64url")}`;
}
const ids = ["seat-admin", "seat-member", "seat-disabled"];
let previous: { id: string; disabled: number }[];
beforeEach(() => {
  removeLicenseKey();
  previous = db.prepare("SELECT id, disabled FROM users").all() as typeof previous;
  db.prepare("UPDATE users SET disabled = 1").run();
  ids.forEach((id, index) => db.prepare("INSERT INTO users (id, username, password_hash, role, disabled, created_at) VALUES (?, ?, 'hash', ?, ?, ?)").run(id, id, index === 0 ? "admin" : "user", index === 2 ? 1 : 0, Date.now()));
});
afterEach(() => {
  removeLicenseKey();
  for (const id of ids) db.prepare("DELETE FROM users WHERE id = ?").run(id);
  for (const row of previous) db.prepare("UPDATE users SET disabled = ? WHERE id = ?").run(row.disabled, row.id);
  db.prepare("DELETE FROM audit_logs WHERE user_id = ?").run(ids[0]);
});

describe("licensed account seats", () => {
  it("supports both Pro plans with at most two seats and all three enterprise tiers", () => {
    for (const plan of ["pro_annual", "pro_lifetime"]) {
      assert.equal(licenseSeatLimit({ plan }), 2);
      assert.equal(licenseSeatLimit({ plan, maxSeats: 1 }), 1);
      assert.equal(licenseSeatLimit({ plan, maxSeats: 99 }), 2);
    }
    for (const maxSeats of [20, 50, 100]) {
      assert.equal(licenseSeatLimit({ plan: "team_enterprise", maxSeats }), maxSeats);
      assert.doesNotThrow(() => assertSeatCapacity(maxSeats - 1, maxSeats));
      assert.throws(() => assertSeatCapacity(maxSeats, maxSeats), LicenseSeatError);
    }
    for (const maxSeats of [undefined, 0, -1, 2, 21, 50.5, 101]) assert.equal(verifyLicenseKey(token("team_enterprise", maxSeats)).valid, false);
    assert.equal(verifyLicenseKey(token("unknown", 20)).valid, false);
  });
  it("counts administrators, excludes disabled accounts and rolls back a failed enable with other edits", () => {
    assert.equal(enabledAccountCount(), 2);
    assert.equal(saveLicenseKey(token("pro_annual")).valid, true);
    assert.throws(assertAccountSeatAvailable, LicenseSeatError);
    assert.throws(() => updateUser(ids[2], { disabled: false, displayName: "must rollback" }, { actorId: ids[0], targetRole: "user" }), LicenseSeatError);
    assert.equal(db.prepare("SELECT disabled FROM users WHERE id = ?").get(ids[2])?.disabled, 1);
    assert.notEqual(db.prepare("SELECT display_name FROM users WHERE id = ?").get(ids[2])?.display_name, "must rollback");
    updateUser(ids[1], { disabled: true }, { actorId: ids[0], targetRole: "user" });
    updateUser(ids[2], { disabled: false }, { actorId: ids[0], targetRole: "user" });
    assert.equal(enabledAccountCount(), 2);
    // Re-enabling an already enabled account is idempotent even at capacity.
    assert.doesNotThrow(() => updateUser(ids[2], { disabled: false }, { actorId: ids[0], targetRole: "user" }));
  });
  it("rejects a downgrade without replacing the stored license, then allows it after seats are released", () => {
    const enterprise = token("team_enterprise", 20);
    assert.equal(saveLicenseKey(enterprise).valid, true);
    updateUser(ids[2], { disabled: false }, { actorId: ids[0], targetRole: "user" });
    const pro = token("pro_lifetime", 2);
    const result = saveLicenseKey(pro);
    assert.equal(result.valid, false);
    assert.match(result.error!, /先禁用至少 1/);
    assert.equal(getStoredLicenseKey(), enterprise);
    updateUser(ids[2], { disabled: true }, { actorId: ids[0], targetRole: "user" });
    assert.equal(saveLicenseKey(pro).valid, true);
    assert.equal(getStoredLicenseKey(), pro);
  });
  it("keeps unlicensed community account creation unchanged", () => {
    assert.doesNotThrow(assertAccountSeatAvailable);
  });
});
