import {
  IRAQI_PAYMENT_METHODS,
  type IraqiPaymentMethodId,
} from "@/lib/payment/iraqi-methods";

export type PaymentMethodConfig = {
  id: IraqiPaymentMethodId;
  is_active: boolean;
  /** Wallet / transfer phone shown to students */
  phone: string;
  /** Bank / wallet account number */
  account_number: string;
  /** Card number when the method uses one */
  card_number: string;
  /** Extra transfer notes shown under the details */
  notes: string;
};

export type PaymentMethodSettings = {
  methods: PaymentMethodConfig[];
};

function emptyConfig(id: IraqiPaymentMethodId): PaymentMethodConfig {
  return {
    id,
    is_active: true,
    phone: "",
    account_number: "",
    card_number: "",
    notes: "",
  };
}

export const DEFAULT_PAYMENT_METHOD_SETTINGS: PaymentMethodSettings = {
  methods: IRAQI_PAYMENT_METHODS.map(emptyConfig),
};

function parseOne(raw: unknown, fallbackId: IraqiPaymentMethodId): PaymentMethodConfig {
  const base = emptyConfig(fallbackId);
  if (!raw || typeof raw !== "object") return base;
  const v = raw as Record<string, unknown>;
  const id =
    typeof v.id === "string" && IRAQI_PAYMENT_METHODS.includes(v.id as IraqiPaymentMethodId)
      ? (v.id as IraqiPaymentMethodId)
      : fallbackId;
  return {
    id,
    is_active: v.is_active === false ? false : true,
    phone: typeof v.phone === "string" ? v.phone.trim() : "",
    account_number: typeof v.account_number === "string" ? v.account_number.trim() : "",
    card_number: typeof v.card_number === "string" ? v.card_number.trim() : "",
    notes: typeof v.notes === "string" ? v.notes.trim() : "",
  };
}

export function parsePaymentMethodSettings(raw: unknown): PaymentMethodSettings {
  if (!raw || typeof raw !== "object") return DEFAULT_PAYMENT_METHOD_SETTINGS;
  const v = raw as Record<string, unknown>;

  const byId = new Map<IraqiPaymentMethodId, PaymentMethodConfig>();

  if (Array.isArray(v.methods)) {
    for (const item of v.methods) {
      if (!item || typeof item !== "object") continue;
      const id = (item as Record<string, unknown>).id;
      if (typeof id !== "string" || !IRAQI_PAYMENT_METHODS.includes(id as IraqiPaymentMethodId)) {
        continue;
      }
      byId.set(id as IraqiPaymentMethodId, parseOne(item, id as IraqiPaymentMethodId));
    }
  } else {
    for (const id of IRAQI_PAYMENT_METHODS) {
      if (id in v) byId.set(id, parseOne(v[id], id));
    }
  }

  return {
    methods: IRAQI_PAYMENT_METHODS.map((id) => byId.get(id) ?? emptyConfig(id)),
  };
}

export function getActivePaymentMethods(
  settings: PaymentMethodSettings
): PaymentMethodConfig[] {
  return settings.methods.filter((m) => m.is_active);
}

export function getPaymentMethodConfig(
  settings: PaymentMethodSettings,
  id: IraqiPaymentMethodId
): PaymentMethodConfig {
  return settings.methods.find((m) => m.id === id) ?? emptyConfig(id);
}

export function paymentMethodHasDetails(config: PaymentMethodConfig): boolean {
  return Boolean(
    config.phone || config.account_number || config.card_number || config.notes
  );
}
