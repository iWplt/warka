/**
 * Formats an amount as Iraqi Dinar (IQD).
 */
export function formatIqd(amount: number, locale: string): string {
  const intlLocale = locale === "ar" ? "ar-IQ" : "en-IQ";
  const formatted = new Intl.NumberFormat(intlLocale, {
    maximumFractionDigits: 0,
  }).format(amount);

  return locale === "ar" ? `${formatted} د.ع` : `${formatted} IQD`;
}
