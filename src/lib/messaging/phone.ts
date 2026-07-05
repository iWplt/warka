/** Normalize Iraqi/local numbers to E.164 for WhatsApp providers. */
export function normalizePhoneToE164(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;

  if (digits.startsWith("964") && digits.length >= 12) {
    return `+${digits}`;
  }

  if (digits.startsWith("0") && digits.length >= 10) {
    return `+964${digits.slice(1)}`;
  }

  if (digits.length >= 10 && !digits.startsWith("964")) {
    return `+964${digits}`;
  }

  if (phone.startsWith("+") && digits.length >= 10) {
    return `+${digits}`;
  }

  return null;
}
