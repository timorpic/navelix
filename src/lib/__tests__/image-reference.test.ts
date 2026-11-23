import { it } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

it("constructs a candidate image from the Docker Hub owner without a repository job output", () => {
  const digest = `sha256:${"a".repeat(64)}`;
  const result = spawnSync(process.execPath, ["scripts/image-reference.mjs"], {
    encoding: "utf8", env: { ...process.env, DOCKERHUB_USERNAME: "exampleowner", IMAGE_DIGEST: digest },
  });
  assert.equal(result.status, 0);
  assert.equal(result.stdout, `docker.io/exampleowner/navelix@${digest}`);
});

it("rejects missing or malformed owner and digest before Docker can receive an invalid reference", () => {
  for (const [owner, digest] of [["", `sha256:${"a".repeat(64)}`], ["ExampleOwner", `sha256:${"a".repeat(64)}`], ["owner/repo", `sha256:${"a".repeat(64)}`], ["owner", ""], ["owner", "latest"]]) {
    const result = spawnSync(process.execPath, ["scripts/image-reference.mjs"], {
      encoding: "utf8", env: { ...process.env, DOCKERHUB_USERNAME: owner, IMAGE_DIGEST: digest },
    });
    assert.equal(result.status, 1);
    assert.equal(result.stdout, "");
  }
});
