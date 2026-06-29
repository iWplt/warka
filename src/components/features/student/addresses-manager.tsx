"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { MapPin, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WarkaCard, WarkaCardTitle } from "@/components/ui/warka-card";
import {
  createAddress,
  deleteAddress,
  setDefaultAddress,
} from "@/server/actions/addresses";
import type { StudentAddress } from "@/types/database";

type AddressesManagerProps = {
  addresses: StudentAddress[];
};

export function AddressesManager({ addresses: initialAddresses }: AddressesManagerProps) {
  const t = useTranslations("addresses");
  const commonT = useTranslations("common");
  const authT = useTranslations("auth");
  const router = useRouter();
  const [addresses, setAddresses] = useState(initialAddresses);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    label: "",
    address_line: "",
    city: "",
    phone: "",
    college: "",
    is_default: false,
  });

  const inputClass =
    "w-full rounded-xl border border-warka-border bg-warka-bg px-4 py-2.5 text-sm text-warka-text focus:border-warka-primary focus:outline-none";

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const row = await createAddress({
        label: form.label,
        address_line: form.address_line,
        city: form.city || undefined,
        phone: form.phone || undefined,
        college: form.college || undefined,
        is_default: form.is_default || addresses.length === 0,
      });
      setAddresses((prev) => {
        const next = form.is_default || prev.length === 0
          ? prev.map((a) => ({ ...a, is_default: false }))
          : prev;
        return [row, ...next];
      });
      setForm({
        label: "",
        address_line: "",
        city: "",
        phone: "",
        college: "",
        is_default: false,
      });
      setShowForm(false);
      toast.success(t("saved"));
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : commonT("error"));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t("deleteConfirm"))) return;
    setDeletingId(id);
    try {
      await deleteAddress(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      toast.success(t("deleted"));
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : commonT("error"));
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultAddress(id);
      setAddresses((prev) =>
        prev.map((a) => ({ ...a, is_default: a.id === id }))
      );
      toast.success(t("defaultUpdated"));
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : commonT("error"));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-warka-text">{t("title")}</h1>
          <p className="mt-1 text-sm text-warka-text-secondary">{t("subtitle")}</p>
        </div>
        <Button
          type="button"
          variant="accent"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-xl"
        >
          {showForm ? commonT("cancel") : t("addAddress")}
        </Button>
      </div>

      {showForm && (
        <WarkaCard>
          <WarkaCardTitle className="mb-4">{t("addAddress")}</WarkaCardTitle>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-warka-text">
                {t("label")}
              </label>
              <input
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                className={inputClass}
                placeholder={t("labelPlaceholder")}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-warka-text">
                {t("addressLine")}
              </label>
              <textarea
                value={form.address_line}
                onChange={(e) => setForm({ ...form, address_line: e.target.value })}
                className={`${inputClass} min-h-[88px] resize-y`}
                placeholder={t("addressPlaceholder")}
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-warka-text">
                  {t("city")}
                </label>
                <input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-warka-text">
                  {authT("phone")}
                </label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-warka-text">
                {authT("college")}
              </label>
              <input
                value={form.college}
                onChange={(e) => setForm({ ...form, college: e.target.value })}
                className={inputClass}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-warka-text">
              <input
                type="checkbox"
                checked={form.is_default}
                onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
                className="rounded border-warka-border"
              />
              {t("setAsDefault")}
            </label>
            <Button type="submit" variant="accent" disabled={loading} className="rounded-xl">
              {loading ? commonT("loading") : commonT("save")}
            </Button>
          </form>
        </WarkaCard>
      )}

      {addresses.length === 0 ? (
        <WarkaCard className="py-16 text-center">
          <MapPin className="mx-auto mb-3 size-10 text-warka-text-secondary" aria-hidden />
          <p className="font-medium text-warka-text">{t("emptyTitle")}</p>
          <p className="mt-1 text-sm text-warka-text-secondary">{t("emptyDescription")}</p>
        </WarkaCard>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <li key={address.id}>
              <WarkaCard className="flex h-full flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <WarkaCardTitle>{address.label}</WarkaCardTitle>
                      {address.is_default && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-warka-primary/10 px-2 py-0.5 text-xs font-medium text-warka-primary">
                          <Star className="size-3 fill-current" aria-hidden />
                          {t("defaultBadge")}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-warka-text-secondary">
                      {address.address_line}
                    </p>
                    {address.city && (
                      <p className="mt-1 text-sm text-warka-text-secondary">{address.city}</p>
                    )}
                  </div>
                </div>
                <dl className="mt-4 space-y-1 text-sm">
                  {address.phone && (
                    <div className="flex justify-between gap-2">
                      <dt className="text-warka-text-secondary">{authT("phone")}</dt>
                      <dd className="font-medium text-warka-text">{address.phone}</dd>
                    </div>
                  )}
                  {address.college && (
                    <div className="flex justify-between gap-2">
                      <dt className="text-warka-text-secondary">{authT("college")}</dt>
                      <dd className="font-medium text-warka-text">{address.college}</dd>
                    </div>
                  )}
                </dl>
                <div className="mt-auto flex flex-wrap gap-2 pt-4">
                  {!address.is_default && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetDefault(address.id)}
                      className="rounded-xl border-warka-border"
                    >
                      {t("makeDefault")}
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(address.id)}
                    disabled={deletingId === address.id}
                    className="rounded-xl text-destructive hover:text-destructive"
                  >
                    <Trash2 className="size-4" aria-hidden />
                    {commonT("delete")}
                  </Button>
                </div>
              </WarkaCard>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
