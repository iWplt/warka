"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { KeyRound, Plus, Ban } from "lucide-react";
import { createRepInviteCode, revokeRepInviteCode } from "@/server/actions/invites";
import type { RepresentativeInviteCode } from "@/types/database";
import { WarkaCard, WarkaCardTitle } from "@/components/ui/warka-card";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

type RepInvitesManagerProps = {
  invites: RepresentativeInviteCode[];
};

export function RepInvitesManager({ invites }: RepInvitesManagerProps) {
  const t = useTranslations("adminInvites");
  const locale = useLocale();
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [email, setEmail] = useState("");
  const [expiresDays, setExpiresDays] = useState("30");
  const [notes, setNotes] = useState("");
  const [lastCode, setLastCode] = useState<string | null>(null);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const code = await createRepInviteCode({
        assigned_email: email.trim() || undefined,
        expires_days: Number(expiresDays) || 30,
        notes: notes.trim() || undefined,
      });
      setLastCode(code);
      setEmail("");
      setNotes("");
      toast.success(t("created"));
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("error"));
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm(t("confirmRevoke"))) return;
    try {
      await revokeRepInviteCode(id);
      toast.success(t("revoked"));
      router.refresh();
    } catch {
      toast.error(t("error"));
    }
  };

  const copyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    toast.success(t("copied"));
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("subtitle")} />

      <WarkaCard>
        <WarkaCardTitle className="mb-4">{t("generate")}</WarkaCardTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="warka-label">{t("assignedEmail")}</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              dir="ltr"
              placeholder={t("assignedEmailOptional")}
              className="warka-input"
            />
          </div>
          <div>
            <label className="warka-label">{t("expiresDays")}</label>
            <input
              type="number"
              min={1}
              max={365}
              value={expiresDays}
              onChange={(e) => setExpiresDays(e.target.value)}
              className="warka-input"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="warka-label">{t("notes")}</label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} className="warka-input" />
          </div>
        </div>
        <button
          type="button"
          onClick={() => void handleCreate()}
          disabled={creating}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-warka-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-warka-primary-dark disabled:opacity-60"
        >
          <Plus className="size-4" />
          {creating ? t("creating") : t("createInvite")}
        </button>

        {lastCode && (
          <div className="mt-4 rounded-xl border-2 border-warka-primary/30 bg-warka-primary/5 p-4">
            <p className="text-sm font-semibold text-warka-text">{t("newCode")}</p>
            <p className="mt-1 font-mono text-lg font-bold text-warka-primary" dir="ltr">
              {lastCode}
            </p>
            <button
              type="button"
              onClick={() => void copyCode(lastCode)}
              className="mt-2 text-sm font-medium text-warka-primary hover:underline"
            >
              {t("copy")}
            </button>
          </div>
        )}
      </WarkaCard>

      {invites.length === 0 ? (
        <EmptyState icon={KeyRound} title={t("empty")} description={t("emptyHint")} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-warka-border bg-card shadow-card">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-warka-border bg-warka-surface text-warka-text-secondary">
              <tr>
                <th className="px-4 py-3 text-start font-semibold">{t("code")}</th>
                <th className="px-4 py-3 text-start font-semibold">{t("email")}</th>
                <th className="px-4 py-3 text-start font-semibold">{t("status")}</th>
                <th className="px-4 py-3 text-start font-semibold">{t("expires")}</th>
                <th className="px-4 py-3 text-start font-semibold">{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {invites.map((invite) => {
                const expired =
                  invite.expires_at && new Date(invite.expires_at) < new Date();
                const used = invite.used_count >= invite.max_uses;
                const active = invite.is_active && !expired && !used;

                return (
                  <tr key={invite.id} className="border-b border-warka-border/60 last:border-0">
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => void copyCode(invite.code)}
                        className="font-mono font-semibold text-warka-primary hover:underline"
                        dir="ltr"
                      >
                        {invite.code}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-warka-text-secondary" dir="ltr">
                      {invite.assigned_email ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          active
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-warka-bg text-warka-text-muted"
                        )}
                      >
                        {used ? t("used") : expired ? t("expired") : active ? t("active") : t("revoked")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-warka-text-secondary">
                      {invite.expires_at
                        ? new Date(invite.expires_at).toLocaleDateString(locale)
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {active && (
                        <button
                          type="button"
                          onClick={() => void handleRevoke(invite.id)}
                          className="inline-flex items-center gap-1 text-destructive hover:underline"
                        >
                          <Ban className="size-3.5" />
                          {t("revoke")}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
