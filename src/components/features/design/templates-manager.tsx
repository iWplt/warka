"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {
  createTemplate,
  deleteTemplate,
  getDefaultTemplateConfig,
} from "@/server/actions/design";
import type { DesignTemplate } from "@/types/database";

const DEMO_NAME_KEYS = new Set([
  "classicGold",
  "royalBlue",
  "elegantBurgundy",
  "modernEmerald",
]);

type TemplatesManagerProps = {
  templates: DesignTemplate[];
};

export function TemplatesManager({ templates }: TemplatesManagerProps) {
  const t = useTranslations("design");
  const showcaseT = useTranslations("landing.designs");
  const productT = useTranslations("productType");
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const labelFor = (template: DesignTemplate) =>
    DEMO_NAME_KEYS.has(template.name)
      ? showcaseT(`templates.${template.name}` as "templates.classicGold")
      : template.name;

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const config = await getDefaultTemplateConfig();
    try {
      await createTemplate({
        product_type: form.get("product_type") as "sash" | "cap" | "gown" | "custom",
        name: form.get("name") as string,
        preview_url: (form.get("preview_url") as string) || undefined,
        template_config: config as unknown as Record<string, unknown>,
      });
      toast.success(t("templateCreated"));
      setShowForm(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("uploadFailed"));
    }
  };

  const handleDelete = async (templateId: string) => {
    if (!window.confirm(t("deleteConfirm"))) return;
    setDeletingId(templateId);
    try {
      await deleteTemplate(templateId);
      toast.success(t("templateDeleted"));
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("uploadFailed"));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">{t("templatesHint")}</p>
      <Button onClick={() => setShowForm(!showForm)} variant="accent">
        {t("uploadTemplate")}
      </Button>

      {showForm && (
        <form onSubmit={handleCreate} className="grid gap-4 rounded-2xl glass p-6 sm:grid-cols-2">
          <input
            name="name"
            placeholder={t("templateName")}
            required
            className="rounded-xl border border-glass-border bg-foreground/5 px-4 py-2"
          />
          <Select name="product_type" defaultValue="sash">
            <option value="sash">{productT("sash")}</option>
            <option value="cap">{productT("cap")}</option>
            <option value="gown">{productT("gown")}</option>
            <option value="custom">{productT("custom")}</option>
          </Select>
          <input
            name="preview_url"
            placeholder={t("previewUrl")}
            className="sm:col-span-2 rounded-xl border border-glass-border bg-foreground/5 px-4 py-2"
          />
          <Button type="submit" variant="accent" className="sm:col-span-2">
            {t("saveTemplate")}
          </Button>
        </form>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((tpl) => (
          <div key={tpl.id} className="overflow-hidden rounded-2xl border border-glass-border glass">
            <div
              className="aspect-video w-full"
              style={{
                backgroundColor:
                  (tpl.template_config as { backgroundColor?: string }).backgroundColor ??
                  "#1a1a2e",
              }}
            />
            <div className="flex items-start justify-between gap-2 p-4">
              <div>
                <p className="font-medium">{labelFor(tpl)}</p>
                <p className="text-sm text-muted-foreground">{productT(tpl.product_type)}</p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                disabled={deletingId === tpl.id}
                onClick={() => handleDelete(tpl.id)}
                aria-label={t("deleteTemplate")}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
