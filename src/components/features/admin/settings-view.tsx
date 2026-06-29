"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { updatePriceCatalog } from "@/server/actions/payments";
import type { PriceCatalogItem } from "@/types/database";

type SettingsViewProps = {
  prices: PriceCatalogItem[];
};

export function SettingsView({ prices }: SettingsViewProps) {
  const t = useTranslations("productType");
  const router = useRouter();

  const handleUpdate = async (id: string, base_price: number) => {
    try {
      await updatePriceCatalog(id, { base_price });
      toast.success("Updated");
      router.refresh();
    } catch {
      toast.error("Error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl glass p-6">
        <h2 className="mb-4 font-semibold">Price Catalog</h2>
        <div className="space-y-4">
          {prices.map((item) => (
            <PriceRow key={item.id} item={item} label={t(item.product_type)} onSave={handleUpdate} />
          ))}
        </div>
      </div>

      <div className="rounded-2xl glass p-6">
        <h2 className="mb-2 font-semibold">Backup</h2>
        <p className="text-sm text-muted-foreground">
          Enable scheduled backups in your Supabase project dashboard under Settings → Database → Backups.
        </p>
      </div>
    </div>
  );
}

function PriceRow({
  item,
  label,
  onSave,
}: {
  item: PriceCatalogItem;
  label: string;
  onSave: (id: string, price: number) => void;
}) {
  const [price, setPrice] = useState(String(item.base_price));

  return (
    <div className="flex items-center gap-4">
      <span className="w-40 font-medium">{label}</span>
      <input
        type="number"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        className="flex-1 rounded-xl border border-glass-border bg-white/5 px-4 py-2"
      />
      <span className="text-sm text-muted-foreground">IQD</span>
      <Button size="sm" onClick={() => onSave(item.id, parseFloat(price))}>Save</Button>
    </div>
  );
}
