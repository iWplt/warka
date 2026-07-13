import { NextResponse } from "next/server";
import { runDepositPaymentReminders } from "@/lib/messaging/deposit-reminders";
import { logSecurityEvent } from "@/lib/security/audit-log";
import { timingSafeEqualString } from "@/lib/security/timing-safe";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!cronSecret || cronSecret.length < 16) {
    logSecurityEvent("cron.unauthorized", { reason: "missing_secret" });
    return NextResponse.json(
      { error: "Cron endpoint is not configured" },
      { status: 503 }
    );
  }

  const expected = `Bearer ${cronSecret}`;
  if (!authHeader || !timingSafeEqualString(authHeader, expected)) {
    logSecurityEvent("cron.unauthorized", { reason: "bad_token" });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runDepositPaymentReminders();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[cron/deposit-reminders]", error);
    return NextResponse.json(
      { ok: false, error: "Reminder job failed" },
      { status: 500 }
    );
  }
}
