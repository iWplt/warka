"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { updateProfile } from "@/server/actions/profile";
import type { Profile } from "@/types/database";

type ProfileFormProps = {
  profile: Profile;
};

export function ProfileForm({ profile }: ProfileFormProps) {
  const t = useTranslations("profile");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: profile.full_name ?? "",
    phone: profile.phone ?? "",
    college: profile.college ?? "",
    department: profile.department ?? "",
    stage: profile.stage ?? "",
    class_name: profile.class_name ?? "",
    graduation_year: profile.graduation_year ? String(profile.graduation_year) : "",
  });

  const inputClass =
    "w-full rounded-xl border border-warka-border bg-white px-4 py-2.5 text-sm text-warka-text focus:border-warka-primary focus:outline-none focus:ring-2 focus:ring-warka-primary/20";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile({
        full_name: form.full_name,
        phone: form.phone || undefined,
        college: form.college || undefined,
        department: form.department || undefined,
        stage: form.stage || undefined,
        class_name: form.class_name || undefined,
        graduation_year: form.graduation_year
          ? Number.parseInt(form.graduation_year, 10)
          : undefined,
      });
      toast.success(t("saved"));
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("error"));
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    ["full_name", t("fullName")],
    ["phone", t("phone")],
    ["college", t("college")],
    ["department", t("department")],
    ["stage", t("stage")],
    ["class_name", t("className")],
    ["graduation_year", t("graduationYear")],
  ] as const;

  return (
    <div className="space-y-4">
      {profile.role === "student" && profile.access_code && (
        <div className="rounded-xl border-2 border-warka-primary/30 bg-warka-primary/5 p-4">
          <p className="text-sm font-semibold text-warka-text">{t("accessCode")}</p>
          <p className="mt-1 font-mono text-lg font-bold text-warka-primary" dir="ltr">
            {profile.access_code}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-warka-border bg-white p-6 shadow-card">
        {fields.map(([key, label]) => (
          <div key={key}>
            <label className="mb-1 block text-sm font-medium">{label}</label>
            <input
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              className={inputClass}
              required={key === "full_name"}
            />
          </div>
        ))}
        <Button type="submit" variant="accent" disabled={loading}>
          {loading ? t("saving") : t("save")}
        </Button>
      </form>
    </div>
  );
}
