import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { MAX_LICENSE_FILE_SIZE, readLicenseFile } from "../license-file.ts";
import { buildLicenseActivationPayload } from "../admin-pro.ts";

describe("readLicenseFile", () => {
  it("导入纯文本 token，兼容大写后缀、BOM 和末尾换行，复用激活请求", async () => {
    const result = await readLicenseFile({
      name: "navelix.SWLICENSE", size: 30,
      text: async () => "\uFEFF  payload.signature\r\n",
    });
    assert.deepEqual(result, { ok: true, licenseKey: "payload.signature" });
    if (result.ok) {
      assert.deepEqual(buildLicenseActivationPayload(result.licenseKey), {
        licenseKey: "payload.signature",
      });
    }
  });

  it("错误后缀和超限文件在读取前被拒绝", async () => {
    const text = async () => { assert.fail("不应读取被拒绝的文件"); };
    assert.deepEqual(await readLicenseFile({ name: "a.swlicense.txt", size: 1, text }), {
      ok: false, error: "extension",
    });
    assert.deepEqual(await readLicenseFile({
      name: "a.swlicense", size: MAX_LICENSE_FILE_SIZE + 1, text,
    }), { ok: false, error: "size" });
  });

  it("允许大小上限，空文件或纯空白不能覆盖已有密钥", async () => {
    assert.deepEqual(await readLicenseFile({
      name: "a.swlicense", size: MAX_LICENSE_FILE_SIZE, text: async () => "a.b",
    }), { ok: true, licenseKey: "a.b" });
    for (const content of ["", "\uFEFF \r\n\t"]) {
      assert.deepEqual(await readLicenseFile({
        name: "a.swlicense", size: content.length, text: async () => content,
      }), { ok: false, error: "empty" });
    }
  });

  it("文件读取失败返回可提示的错误", async () => {
    assert.deepEqual(await readLicenseFile({
      name: "a.swlicense", size: 1,
      text: async () => { throw new Error("read failed"); },
    }), { ok: false, error: "read" });
  });
});
