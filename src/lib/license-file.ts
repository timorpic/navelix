/** AMS 的 navelix-v1 文件是纯文本 token；有效性仍由激活接口验签。 */
export const MAX_LICENSE_FILE_SIZE = 64 * 1024;

export type LicenseFileError = "extension" | "size" | "empty" | "read";

export async function readLicenseFile(
  file: { name: string; size: number; text: () => Promise<string> },
): Promise<{ ok: true; licenseKey: string } | { ok: false; error: LicenseFileError }> {
  if (!file.name.toLowerCase().endsWith(".swlicense")) {
    return { ok: false, error: "extension" };
  }
  if (file.size > MAX_LICENSE_FILE_SIZE) return { ok: false, error: "size" };
  try {
    const licenseKey = (await file.text()).trim();
    return licenseKey ? { ok: true, licenseKey } : { ok: false, error: "empty" };
  } catch {
    return { ok: false, error: "read" };
  }
}
