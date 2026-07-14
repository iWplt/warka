export type IraqiPaymentMethodId =
  | "zain_cash"
  | "super_qi"
  | "fib"
  | "asiapay"
  | "cash";

/** Maps UI method → DB `payment_method` enum. */
export function toDbPaymentMethod(
  id: IraqiPaymentMethodId
): "cash" | "bank_transfer" | "zain_cash" {
  if (id === "cash") return "cash";
  if (id === "zain_cash") return "zain_cash";
  return "bank_transfer";
}

export function iraqiPaymentLabel(id: IraqiPaymentMethodId, isAr: boolean): string {
  switch (id) {
    case "zain_cash":
      return isAr ? "زين كاش" : "Zain Cash";
    case "super_qi":
      return "SuperQi";
    case "fib":
      return isAr ? "FIB — المصرف العراقي الأول" : "FIB — First Iraqi Bank";
    case "asiapay":
      return isAr ? "آسيا بي / آسيا حوالة" : "AsiaPay";
    case "cash":
      return isAr ? "نقداً وجهاً لوجه" : "Cash (in person)";
  }
}

export const IRAQI_PAYMENT_METHODS: IraqiPaymentMethodId[] = [
  "zain_cash",
  "super_qi",
  "fib",
  "asiapay",
  "cash",
];
