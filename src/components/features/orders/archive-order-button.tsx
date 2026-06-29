"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { Archive, ArchiveRestore } from "lucide-react";
import { Button } from "@/components/ui/button";
import { archiveOrder, unarchiveOrder } from "@/server/actions/orders";
import type { Order } from "@/types/database";

type ArchiveOrderButtonProps = {
  order: Order;
};

export function ArchiveOrderButton({ order }: ArchiveOrderButtonProps) {
  const t = useTranslations("orders");
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const canArchive =
    !order.archived &&
    (order.status === "delivered" || order.status === "cancelled");

  if (!canArchive && !order.archived) return null;

  const handleClick = async () => {
    setLoading(true);
    try {
      if (order.archived) {
        await unarchiveOrder(order.id);
        toast.success(t("unarchived"));
      } else {
        await archiveOrder(order.id);
        toast.success(t("archived"));
      }
      router.refresh();
      router.push("/admin/orders");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("archiveError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      disabled={loading}
      onClick={handleClick}
    >
      {order.archived ? (
        <>
          <ArchiveRestore className="me-2 size-4" aria-hidden />
          {t("unarchive")}
        </>
      ) : (
        <>
          <Archive className="me-2 size-4" aria-hidden />
          {t("archive")}
        </>
      )}
    </Button>
  );
}
