"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { updateMessagingSettings } from "@/server/actions/message-templates";
import {
  EVENT_TYPE_LABELS,
  TEMPLATE_VARIABLE_HINTS,
  WHATSAPP_EVENT_TYPES,
  type WhatsAppEventType,
} from "@/lib/messaging/types";
import type { MessagingSettings } from "@/lib/messaging/settings";
import type { MessageTemplate } from "@/types/database";
import { updateMessageTemplate } from "@/server/actions/message-templates";

type MessagingSettingsPanelProps = {
  settings: MessagingSettings;
  providerConfigured: boolean;
  providerName: string;
};

export function MessagingSettingsPanel({
  settings,
  providerConfigured,
  providerName,
}: MessagingSettingsPanelProps) {
  const router = useRouter();
  const [draft, setDraft] = useState(settings);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateMessagingSettings(draft);
      toast.success("Messaging settings saved");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        className={`rounded-xl border px-4 py-3 text-sm ${
          providerConfigured
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
            : "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200"
        }`}
      >
        {providerConfigured ? (
          <p>
            WhatsApp provider: <strong>{providerName}</strong> — configured via environment
            variables.
          </p>
        ) : (
          <p>
            WhatsApp API is not configured. Add Twilio or Meta Cloud API credentials to{" "}
            <code className="text-xs">.env</code>. Messages will still be logged in{" "}
            <code className="text-xs">notifications_log</code>.
          </p>
        )}
      </div>

      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={draft.whatsapp_enabled}
          onChange={(e) => setDraft((d) => ({ ...d, whatsapp_enabled: e.target.checked }))}
          className="size-4 rounded border-glass-border"
        />
        <span>Enable automatic WhatsApp notifications</span>
      </label>

      <label className="block text-sm">
        <span className="mb-1 block text-muted-foreground">
          Deposit reminder after (days) — for orders in &quot;Waiting Deposit&quot;
        </span>
        <input
          type="number"
          min={1}
          max={30}
          className="w-full max-w-xs rounded-xl border border-glass-border bg-card px-4 py-2"
          value={draft.deposit_reminder_days}
          onChange={(e) =>
            setDraft((d) => ({ ...d, deposit_reminder_days: Number(e.target.value) }))
          }
        />
      </label>

      <Button onClick={() => void handleSave()} disabled={saving}>
        {saving ? "Saving…" : "Save messaging settings"}
      </Button>
    </div>
  );
}

type MessageTemplatesPanelProps = {
  templates: MessageTemplate[];
};

export function MessageTemplatesPanel({ templates }: MessageTemplatesPanelProps) {
  const router = useRouter();
  const byEvent = new Map(templates.map((t) => [t.event_type, t]));

  const handleSave = async (eventType: WhatsAppEventType, template_ar: string, is_active: boolean) => {
    try {
      await updateMessageTemplate({ event_type: eventType, template_ar, is_active });
      toast.success("Template saved");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Available variables: {TEMPLATE_VARIABLE_HINTS.join(", ")}
      </p>

      {WHATSAPP_EVENT_TYPES.map((eventType) => (
        <TemplateEditor
          key={eventType}
          eventType={eventType}
          initial={byEvent.get(eventType)}
          onSave={handleSave}
        />
      ))}
    </div>
  );
}

function TemplateEditor({
  eventType,
  initial,
  onSave,
}: {
  eventType: WhatsAppEventType;
  initial?: MessageTemplate;
  onSave: (eventType: WhatsAppEventType, body: string, active: boolean) => Promise<void>;
}) {
  const labels = EVENT_TYPE_LABELS[eventType];
  const [body, setBody] = useState(initial?.template_ar ?? "");
  const [active, setActive] = useState(initial?.is_active ?? true);
  const [saving, setSaving] = useState(false);

  return (
    <div className="rounded-xl border border-glass-border p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-medium">{labels.ar}</h3>
          <p className="text-xs text-muted-foreground">{labels.en}</p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="size-4 rounded border-glass-border"
          />
          Active
        </label>
      </div>

      <textarea
        className="min-h-[100px] w-full rounded-xl border border-glass-border bg-card px-4 py-3 text-sm"
        dir="rtl"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />

      <div className="mt-3">
        <Button
          size="sm"
          disabled={saving || !body.trim()}
          onClick={async () => {
            setSaving(true);
            try {
              await onSave(eventType, body.trim(), active);
            } finally {
              setSaving(false);
            }
          }}
        >
          {saving ? "Saving…" : "Save template"}
        </Button>
      </div>
    </div>
  );
}

type NotificationLogPanelProps = {
  logs: import("@/types/database").NotificationLog[];
};

export function NotificationLogPanel({ logs }: NotificationLogPanelProps) {
  if (logs.length === 0) {
    return <p className="text-sm text-muted-foreground">No outbound notifications yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-glass-border text-left text-muted-foreground">
            <th className="py-2 pr-4">Time</th>
            <th className="py-2 pr-4">Event</th>
            <th className="py-2 pr-4">Status</th>
            <th className="py-2">Preview</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} className="border-b border-glass-border/50">
              <td className="py-2 pr-4 whitespace-nowrap">
                {new Date(log.created_at).toLocaleString()}
              </td>
              <td className="py-2 pr-4">{log.event_type}</td>
              <td className="py-2 pr-4">
                <span
                  className={
                    log.status === "sent"
                      ? "text-emerald-600"
                      : log.status === "failed"
                        ? "text-red-600"
                        : "text-amber-600"
                  }
                >
                  {log.status}
                </span>
              </td>
              <td className="py-2 max-w-md truncate" dir="rtl">
                {log.message_body}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
