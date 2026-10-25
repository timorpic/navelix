/** Shared, dependency-free policy: safe for both UI and server use. */
export function licenseSeatLimit(payload: { plan: string; maxSeats?: number }): number {
  const { plan, maxSeats } = payload;
  if (plan === "pro_annual" || plan === "pro_lifetime") {
    // Older Pro licenses may carry a larger quota; personal editions never exceed two.
    if (maxSeats === undefined) return 2;
    if (!Number.isSafeInteger(maxSeats) || maxSeats < 1) throw new Error("许可证席位配置无效");
    return Math.min(maxSeats, 2);
  }
  if (plan === "team_enterprise" && (maxSeats === 20 || maxSeats === 50 || maxSeats === 100)) return maxSeats;
  throw new Error("许可证档位或席位配置无效，企业版仅支持 20、50、100 席位");
}

export class LicenseSeatError extends Error {
  readonly status = 409;
  constructor(message: string) { super(message); this.name = "LicenseSeatError"; }
}

export function assertSeatCapacity(used: number, limit: number, additional = 1): void {
  if (used + additional > limit) {
    throw new LicenseSeatError(`账号席位已满：当前授权最多同时启用 ${limit} 个账号，已启用 ${used} 个。请先禁用其他账号释放席位，或升级授权。`);
  }
}
