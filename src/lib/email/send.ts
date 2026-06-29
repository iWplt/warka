import { Resend } from "resend";
import { env } from "@/lib/env";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

export function isEmailEnabled(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendEmail(input: SendEmailInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const resend = new Resend(apiKey);
  const from = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

  await resend.emails.send({
    from,
    to: input.to,
    subject: input.subject,
    html: input.html,
  });
}

export async function sendOrderStatusEmail(
  to: string,
  orderNumber: string,
  statusLabel: string,
  link: string
): Promise<void> {
  if (!to) return;

  const appUrl = env.NEXT_PUBLIC_APP_URL;
  const href = `${appUrl}${link}`;

  await sendEmail({
    to,
    subject: `Order ${orderNumber} — ${statusLabel}`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:480px">
        <h2>Graduation Print Shop</h2>
        <p>Your order <strong>${orderNumber}</strong> status is now:</p>
        <p style="font-size:18px;font-weight:600">${statusLabel}</p>
        <p><a href="${href}">View order details</a></p>
      </div>
    `,
  });
}

export async function sendNewOrderAdminEmail(
  orderNumber: string,
  adminLink: string
): Promise<void> {
  if (!isEmailEnabled()) return;

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();
  if (!admin) return;

  const { data: admins } = await admin
    .from("profiles")
    .select("email")
    .eq("role", "admin")
    .eq("is_active", true);

  const appUrl = env.NEXT_PUBLIC_APP_URL;
  const href = `${appUrl}${adminLink}`;

  for (const row of admins ?? []) {
    if (!row.email) continue;
    await sendEmail({
      to: row.email,
      subject: `New order ${orderNumber}`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:480px">
          <h2>New order received</h2>
          <p>Order <strong>${orderNumber}</strong> was submitted.</p>
          <p><a href="${href}">Open in admin panel</a></p>
        </div>
      `,
    });
  }
}
