import type { DepositSettings } from "@/lib/settings/types";
import { DEFAULT_DEPOSIT_SETTINGS } from "@/lib/settings/types";

export function parseDepositSettings(raw: unknown): DepositSettings {
  if (!raw || typeof raw !== "object") return DEFAULT_DEPOSIT_SETTINGS;
  const v = raw as Record<string, unknown>;
  return {
    mode: v.mode === "fixed" ? "fixed" : "percentage",
    percentage: Number(v.percentage ?? DEFAULT_DEPOSIT_SETTINGS.percentage),
    fixed_amount: Number(v.fixed_amount ?? 0),
    min_deposit_iqd: Number(v.min_deposit_iqd ?? 0),
  };
}

export function calculateDeposit(totalIqd: number, settings: DepositSettings): number {
  if (totalIqd <= 0) return 0;

  let deposit =
    settings.mode === "fixed"
      ? settings.fixed_amount
      : Math.round((totalIqd * settings.percentage) / 100);

  if (settings.min_deposit_iqd > 0) {
    deposit = Math.max(deposit, settings.min_deposit_iqd);
  }

  return Math.min(deposit, totalIqd);
}

export function calculateRemaining(totalIqd: number, depositPaid: number): number {
  return Math.max(0, totalIqd - depositPaid);
}
