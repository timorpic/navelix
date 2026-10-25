import { db } from "./db.ts";
import { getLicenseStatus } from "./license.ts";
import { assertSeatCapacity, licenseSeatLimit } from "./license-seats.ts";

export function enabledAccountCount(): number {
  return (db.prepare("SELECT COUNT(*) AS count FROM users WHERE disabled = 0").get() as { count: number }).count;
}

/** Caller must hold a write transaction across this check and the account write. */
export function assertAccountSeatAvailable(): void {
  const status = getLicenseStatus();
  if (status.isPro && status.payload) {
    assertSeatCapacity(enabledAccountCount(), licenseSeatLimit(status.payload));
  }
}
