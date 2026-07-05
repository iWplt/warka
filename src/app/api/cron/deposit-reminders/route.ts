import { NextResponse } from "next/server";
import { runDepositPaymentReminders } from "@/lib/messaging/deposit-reminders";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (cronSecret) {
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await runDepositPaymentReminders();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[cron/deposit-reminders]", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
