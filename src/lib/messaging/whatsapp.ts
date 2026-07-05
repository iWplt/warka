import { normalizePhoneToE164 } from "@/lib/messaging/phone";

export type WhatsAppSendResult = {
  ok: boolean;
  provider?: "twilio" | "meta";
  messageId?: string;
  error?: string;
};

export type WhatsAppProvider = "twilio" | "meta" | "none";

export function detectWhatsAppProvider(): WhatsAppProvider {
  if (process.env.WHATSAPP_CLOUD_API_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID) {
    return "meta";
  }

  if (
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_WHATSAPP_FROM
  ) {
    return "twilio";
  }

  const explicit = process.env.WHATSAPP_PROVIDER;
  if (explicit === "meta" || explicit === "twilio") {
    return explicit;
  }

  return "none";
}

export function isWhatsAppConfigured(): boolean {
  return detectWhatsAppProvider() !== "none";
}

async function sendViaTwilio(to: string, body: string): Promise<WhatsAppSendResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;

  if (!accountSid || !authToken || !from) {
    return { ok: false, error: "Twilio credentials not configured" };
  }

  const normalized = normalizePhoneToE164(to);
  if (!normalized) {
    return { ok: false, error: "Invalid phone number" };
  }

  const toWhatsApp = normalized.startsWith("whatsapp:") ? normalized : `whatsapp:${normalized}`;
  const fromWhatsApp = from.startsWith("whatsapp:") ? from : `whatsapp:${from}`;

  const params = new URLSearchParams({
    To: toWhatsApp,
    From: fromWhatsApp,
    Body: body,
  });

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    }
  );

  const payload = (await response.json()) as { sid?: string; message?: string };

  if (!response.ok) {
    return { ok: false, provider: "twilio", error: payload.message ?? "Twilio send failed" };
  }

  return { ok: true, provider: "twilio", messageId: payload.sid };
}

async function sendViaMeta(to: string, body: string): Promise<WhatsAppSendResult> {
  const token = process.env.WHATSAPP_CLOUD_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    return { ok: false, error: "Meta Cloud API credentials not configured" };
  }

  const normalized = normalizePhoneToE164(to);
  if (!normalized) {
    return { ok: false, error: "Invalid phone number" };
  }

  const response = await fetch(
    `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: normalized.replace("+", ""),
        type: "text",
        text: { body },
      }),
    }
  );

  const payload = (await response.json()) as {
    messages?: { id: string }[];
    error?: { message?: string };
  };

  if (!response.ok) {
    return {
      ok: false,
      provider: "meta",
      error: payload.error?.message ?? "Meta Cloud API send failed",
    };
  }

  return {
    ok: true,
    provider: "meta",
    messageId: payload.messages?.[0]?.id,
  };
}

export async function sendWhatsAppMessage(
  to: string,
  body: string
): Promise<WhatsAppSendResult> {
  const provider = detectWhatsAppProvider();

  if (provider === "twilio") {
    return sendViaTwilio(to, body);
  }

  if (provider === "meta") {
    return sendViaMeta(to, body);
  }

  return { ok: false, error: "WhatsApp provider not configured" };
}
