"use client";

import { useTranslations } from "next-intl";
import { SizeGuideManager } from "@/components/features/admin/size-guide-manager";
import { SizePoliciesPanel } from "@/components/features/admin/size-policies-panel";
import type { SizeGuideEntry } from "@/lib/settings/types";
import type { ProductSizePolicy } from "@/lib/settings/size-policies";
import type { ProductType } from "@/types/database";

type SizesAdminViewProps = {
  sizeGuideEntries: SizeGuideEntry[];
  sizePolicies: Record<ProductType, ProductSizePolicy>;
};

export function SizesAdminView({ sizeGuideEntries, sizePolicies }: SizesAdminViewProps) {
  const t = useTranslations("adminSizes");

  return (
    <div className="space-y-6">
      <div className="rounded-2xl glass p-6">
        <h2 className="mb-2 font-semibold text-warka-text">{t("policiesTitle")}</h2>
        <p className="mb-4 text-sm text-muted-foreground">{t("policiesHint")}</p>
        <SizePoliciesPanel policies={sizePolicies} />
      </div>

      <div className="rounded-2xl glass p-6">
        <h2 className="mb-2 font-semibold text-warka-text">{t("guideTitle")}</h2>
        <p className="mb-4 text-sm text-muted-foreground">{t("guideHint")}</p>
        <SizeGuideManager entries={sizeGuideEntries} />
      </div>
    </div>
  );
}
