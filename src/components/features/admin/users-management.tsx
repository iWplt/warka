"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Users } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { createUser } from "@/server/actions/users";
import type { Profile } from "@/types/database";

type UsersManagementProps = {
  students: Profile[];
  representatives: Profile[];
  localOnly?: boolean;
};

export function UsersManagement({
  students,
  representatives,
  localOnly = false,
}: UsersManagementProps) {
  const t = useTranslations();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [tab, setTab] = useState<"students" | "representatives">("students");
  const [showForm, setShowForm] = useState(false);

  const list = tab === "students" ? students : representatives;

  return (
    <div className="space-y-6">
      {localOnly && (
        <div className="rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-foreground">
          {t("common.localModeUsersHint")}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant={tab === "students" ? "default" : "outline"} onClick={() => setTab("students")}>
          {t("nav.students")} ({students.length})
        </Button>
        <Button type="button" variant={tab === "representatives" ? "default" : "outline"} onClick={() => setTab("representatives")}>
          {t("nav.representatives")} ({representatives.length})
        </Button>
        <Button
          type="button"
          variant="accent"
          onClick={() => setShowForm(!showForm)}
          className="ms-auto"
          disabled={localOnly}
        >
          {t("common.add")}
        </Button>
      </div>

      {showForm && !localOnly && (
        <CreateUserForm
          role={tab === "students" ? "student" : "representative"}
          onSuccess={() => {
            setShowForm(false);
            startTransition(() => {
              router.refresh();
            });
          }}
        />
      )}

      <div className="space-y-2">
        {isPending && (
          <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
        )}
        {!isPending && list.length === 0 && (
          <EmptyState
            icon={Users}
            title={t("users.emptyTitle")}
            description={t("users.emptyDescription")}
          />
        )}
        {list.map((user) => (
          <div key={user.id} className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
            <div>
              <p className="font-medium">{user.full_name}</p>
              <p className="text-sm text-muted-foreground">
                {user.phone} · {user.college} {user.department}
              </p>
            </div>
            <span className={`rounded-full px-2 py-1 text-xs ${user.is_active ? "bg-primary/20 text-primary" : "bg-accent/20 text-accent"}`}>
              {user.is_active ? t("common.active") : t("common.inactive")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CreateUserForm({
  role,
  onSuccess,
}: {
  role: "student" | "representative";
  onSuccess: () => void;
}) {
  const t = useTranslations("auth");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      await createUser({
        email: form.get("email") as string,
        password: form.get("password") as string,
        full_name: form.get("full_name") as string,
        phone: (form.get("phone") as string) || undefined,
        role,
        college: (form.get("college") as string) || undefined,
        department: (form.get("department") as string) || undefined,
      });
      toast.success(t("registerButton") + " ✓");
      onSuccess();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create user";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full rounded-xl border border-glass-border bg-white/5 px-4 py-2 text-sm";

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 rounded-2xl glass p-6 sm:grid-cols-2">
      <input name="full_name" placeholder={t("fullName")} required className={inputClass} />
      <input name="email" type="email" placeholder={t("email")} required className={inputClass} />
      <input name="phone" placeholder={t("phone")} className={inputClass} />
      <input name="password" type="password" placeholder={t("password")} required minLength={6} className={inputClass} />
      <input name="college" placeholder="College" className={inputClass} />
      <input name="department" placeholder="Department" className={inputClass} />
      <Button type="submit" disabled={loading} variant="accent" className="sm:col-span-2">
        {t("registerButton")}
      </Button>
    </form>
  );
}
