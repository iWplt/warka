"use client";

import { ExternalLink, MapPin, StickyNote, User } from "lucide-react";
import { useLocale } from "next-intl";
import { parseOrderNotes } from "@/lib/orders/parse-order-notes";
import type { OrderDetailStudent } from "@/lib/orders/parse-order-notes";
import type { Order } from "@/types/database";

type OrderCustomerSummaryProps = {
  order: Order;
  student: OrderDetailStudent | null;
  showShopNotes?: boolean;
};

function DetailRow({
  label,
  value,
  dir,
}: {
  label: string;
  value: string;
  dir?: "rtl" | "ltr";
}) {
  return (
    <div className="rounded-xl border border-glass-border bg-foreground/[0.03] px-3 py-2.5">
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold" dir={dir}>
        {value}
      </p>
    </div>
  );
}

export function OrderCustomerSummary({
  order,
  student,
  showShopNotes = false,
}: OrderCustomerSummaryProps) {
  const locale = useLocale() as "ar" | "en";
  const isAr = locale === "ar";
  const parsed = parseOrderNotes(order.notes);
  const { delivery, extraLines, referenceUrls, groupOrderLine } = parsed;

  const hasDelivery = Object.values(delivery).some(Boolean);
  const hasStudent = Boolean(student?.full_name);
  const hasExtras = extraLines.length > 0 || referenceUrls.length > 0 || groupOrderLine;
  const hasShopNotes = showShopNotes && Boolean(order.shop_notes?.trim());

  if (!hasStudent && !hasDelivery && !hasExtras && !hasShopNotes) return null;

  return (
    <div className="space-y-4 rounded-2xl glass p-6">
      <h2 className="font-semibold">
        {isAr ? "بيانات الطلب والتوصيل" : "Order & delivery details"}
      </h2>

      {groupOrderLine && (
        <p className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-sm font-medium text-primary">
          {groupOrderLine}
        </p>
      )}

      {hasStudent && student && (
        <section>
          <h3 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            <User className="size-3.5" />
            {isAr ? "الطالب / العميل" : "Student / customer"}
          </h3>
          <div className="grid gap-2 sm:grid-cols-2">
            <DetailRow label={isAr ? "الاسم" : "Name"} value={student.full_name} dir="rtl" />
            {student.phone && (
              <DetailRow label={isAr ? "الهاتف" : "Phone"} value={student.phone} dir="ltr" />
            )}
            {student.college && (
              <DetailRow label={isAr ? "الجامعة" : "University"} value={student.college} dir="rtl" />
            )}
            {student.department && (
              <DetailRow
                label={isAr ? "القسم" : "Department"}
                value={student.department}
                dir="rtl"
              />
            )}
            {student.stage && (
              <DetailRow label={isAr ? "المرحلة" : "Stage"} value={student.stage} dir="rtl" />
            )}
            {student.class_name && (
              <DetailRow label={isAr ? "الصف" : "Class"} value={student.class_name} dir="rtl" />
            )}
            {student.graduation_year != null && (
              <DetailRow
                label={isAr ? "سنة التخرج" : "Graduation year"}
                value={String(student.graduation_year)}
                dir="ltr"
              />
            )}
          </div>
        </section>
      )}

      {hasDelivery && (
        <section>
          <h3 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            <MapPin className="size-3.5" />
            {isAr ? "عنوان التوصيل" : "Delivery address"}
          </h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {delivery.governorate && (
              <DetailRow
                label={isAr ? "المحافظة" : "Governorate"}
                value={delivery.governorate}
                dir="rtl"
              />
            )}
            {delivery.area && (
              <DetailRow label={isAr ? "المنطقة" : "Area"} value={delivery.area} dir="rtl" />
            )}
            {delivery.address && (
              <div className="sm:col-span-2">
                <DetailRow
                  label={isAr ? "العنوان التفصيلي" : "Full address"}
                  value={delivery.address}
                  dir="rtl"
                />
              </div>
            )}
            {delivery.landmark && (
              <DetailRow
                label={isAr ? "علامة دالة" : "Landmark"}
                value={delivery.landmark}
                dir="rtl"
              />
            )}
            {delivery.phone && (
              <DetailRow
                label={isAr ? "هاتف التوصيل" : "Delivery phone"}
                value={delivery.phone}
                dir="ltr"
              />
            )}
            {delivery.preferredDate && (
              <DetailRow
                label={isAr ? "تاريخ التسليم المطلوب" : "Preferred delivery date"}
                value={delivery.preferredDate}
                dir="ltr"
              />
            )}
            {delivery.addressLabel && (
              <DetailRow
                label={isAr ? "تسمية العنوان" : "Address label"}
                value={delivery.addressLabel}
                dir="rtl"
              />
            )}
            {(delivery.gpsUrl || delivery.coordinates) && (
              <div className="sm:col-span-2">
                <div className="rounded-xl border border-glass-border bg-foreground/[0.03] px-3 py-2.5">
                  <p className="text-[11px] font-medium text-muted-foreground">
                    {isAr ? "موقع الخريطة" : "Map location"}
                  </p>
                  {delivery.coordinates && (
                    <p className="mt-1 text-sm font-semibold" dir="ltr">
                      {delivery.coordinates}
                    </p>
                  )}
                  {delivery.gpsUrl && (
                    <a
                      href={delivery.gpsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      {isAr ? "فتح على الخريطة" : "Open on map"}
                      <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {extraLines.length > 0 && (
        <section>
          <h3 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            <StickyNote className="size-3.5" />
            {isAr ? "ملاحظات العميل" : "Customer notes"}
          </h3>
          <div className="space-y-2">
            {extraLines.map((line) => (
              <p
                key={line}
                className="rounded-xl border border-glass-border bg-foreground/[0.03] px-3 py-2.5 text-sm leading-relaxed"
                dir="auto"
              >
                {line}
              </p>
            ))}
          </div>
        </section>
      )}

      {referenceUrls.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            {isAr ? "مرجع التصميم / الزخرفة" : "Design / decoration reference"}
          </h3>
          <div className="flex flex-wrap gap-2">
            {referenceUrls.map((url) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs font-semibold text-primary hover:underline"
              >
                {isAr ? "عرض المرجع" : "View reference"}
                <ExternalLink className="size-3" />
              </a>
            ))}
          </div>
        </section>
      )}

      {hasShopNotes && (
        <section>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            {isAr ? "ملاحظات الورشة (داخلية)" : "Shop notes (internal)"}
          </h3>
          <p className="rounded-xl border border-accent/20 bg-accent/5 px-3 py-2.5 text-sm leading-relaxed">
            {order.shop_notes}
          </p>
        </section>
      )}
    </div>
  );
}
