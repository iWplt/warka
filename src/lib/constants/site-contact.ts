export const SITE_CONTACT = {
  phoneE164: process.env.NEXT_PUBLIC_CONTACT_PHONE ?? "+9647700000000",
  phoneDisplay: process.env.NEXT_PUBLIC_CONTACT_PHONE_DISPLAY ?? "+964 770 000 0000",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "info@graduation-print.iq",
} as const;
