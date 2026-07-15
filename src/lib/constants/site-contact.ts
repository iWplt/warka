/**
 * Central, data-driven contact info. Values come ONLY from environment vars —
 * there are NO fake fallbacks, so the public UI never shows placeholder numbers
 * or emails. Consumers must render each field conditionally (see HAS_* flags).
 *
 * Set in the deployment environment when real details are available:
 *   NEXT_PUBLIC_CONTACT_PHONE          e.g. +9647XXXXXXXXX  (tel: / E.164)
 *   NEXT_PUBLIC_CONTACT_PHONE_DISPLAY  e.g. +964 7XX XXX XXXX (human readable)
 *   NEXT_PUBLIC_CONTACT_EMAIL          e.g. hello@yourdomain
 */
function clean(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

const phoneE164 = clean(process.env.NEXT_PUBLIC_CONTACT_PHONE);
const email = clean(process.env.NEXT_PUBLIC_CONTACT_EMAIL);

export const SITE_CONTACT = {
  phoneE164,
  phoneDisplay: clean(process.env.NEXT_PUBLIC_CONTACT_PHONE_DISPLAY) ?? phoneE164,
  email,
} as const;

export const HAS_SITE_PHONE = Boolean(SITE_CONTACT.phoneE164);
export const HAS_SITE_EMAIL = Boolean(SITE_CONTACT.email);
export const HAS_SITE_CONTACT = HAS_SITE_PHONE || HAS_SITE_EMAIL;
