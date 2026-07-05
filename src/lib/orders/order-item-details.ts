import type { OrderItem, OrderType } from "@/types/database";
import { FIELD_LABELS } from "@/lib/orders/product-field-permissions";

export type OrderItemDetailRow = {
  key: string;
  labelAr: string;
  labelEn: string;
  value: string;
  kind?: "text" | "font" | "image";
  imageUrl?: string | null;
};

export type OrderItemMedia = {
  logoUrl: string | null;
  embroideryUrl: string | null;
  capSideUrl: string | null;
  capTopUrl: string | null;
};

function row(
  key: string,
  labelAr: string,
  labelEn: string,
  value: string | null | undefined,
  extra?: Partial<Pick<OrderItemDetailRow, "kind" | "imageUrl">>
): OrderItemDetailRow | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return {
    key,
    labelAr,
    labelEn,
    value: trimmed,
    kind: extra?.kind ?? "text",
    imageUrl: extra?.imageUrl,
  };
}

export function buildOrderItemDetailRows(
  item: OrderItem,
  orderType: OrderType,
  media?: OrderItemMedia
): {
  studentName: string | null;
  sections: { id: string; titleAr: string; titleEn: string; rows: OrderItemDetailRow[] }[];
} {
  const isGroup = orderType === "group";
  const studentName =
    isGroup && item.special_notes && !item.special_notes.includes("|")
      ? item.special_notes.trim()
      : null;

  const productRows = [
    row("size", "المقاس", "Size", item.size),
    row(
      "custom_measurements",
      "قياسات مخصصة",
      "Custom measurements",
      ((item.student_fields ?? {}) as Record<string, string>).custom_measurements
    ),
    row("sash_color", "لون الوشاح", "Sash color", item.sash_color),
    row("cap_type", "نوع القبعة", "Cap type", item.cap_type),
    row("fabric", "نوع القماش", "Fabric", item.fabric_type),
  ].filter(Boolean) as OrderItemDetailRow[];

  const lockedRows = Object.entries(item.batch_locked_fields ?? {})
    .map(([key, value]) => {
      const labels = FIELD_LABELS[key] ?? { ar: key, en: key };
      return row(`locked_${key}`, `🔒 ${labels.ar}`, `🔒 ${labels.en}`, value);
    })
    .filter(Boolean) as OrderItemDetailRow[];

  const embroideryRows = [
    row("custom_text", "الاسم / النص المطرّز", "Embroidered name / text", item.custom_text),
    row("font", "خط التطريز", "Embroidery font", item.font_family, { kind: "font" }),
    row("position", "موضع التطريز", "Embroidery position", item.embroidery_position),
    row("style", "نوع الزخرفة / التطريز", "Embroidery / decoration style", item.embroidery_style),
    row("thread", "لون الخيط", "Thread color", item.thread_color),
    row("back", "شكل الظهر", "Back shape", item.back_shape),
    row("cap_side", "تطريز جانب القبعة", "Cap side embroidery", item.cap_side_notes),
    row("cap_top", "تطريز أعلى القبعة", "Cap top embroidery", item.cap_top_notes),
  ].filter(Boolean) as OrderItemDetailRow[];

  const attachmentRows: OrderItemDetailRow[] = [];
  if (media?.embroideryUrl) {
    attachmentRows.push({
      key: "decoration_ref",
      labelAr: "صورة الزخرفة / المرجع",
      labelEn: "Decoration reference image",
      value: media.embroideryUrl,
      kind: "image",
      imageUrl: media.embroideryUrl,
    });
  }
  if (media?.logoUrl) {
    attachmentRows.push({
      key: "logo",
      labelAr: "الشعار المرفوع",
      labelEn: "Uploaded logo",
      value: media.logoUrl,
      kind: "image",
      imageUrl: media.logoUrl,
    });
  }
  if (media?.capSideUrl) {
    attachmentRows.push({
      key: "cap_side_img",
      labelAr: "صورة تطريز جانب القبعة",
      labelEn: "Cap side reference",
      value: media.capSideUrl,
      kind: "image",
      imageUrl: media.capSideUrl,
    });
  }
  if (media?.capTopUrl) {
    attachmentRows.push({
      key: "cap_top_img",
      labelAr: "صورة تطريز أعلى القبعة",
      labelEn: "Cap top reference",
      value: media.capTopUrl,
      kind: "image",
      imageUrl: media.capTopUrl,
    });
  }

  const noteRows: OrderItemDetailRow[] = [];
  if (item.special_notes && (!isGroup || item.special_notes.includes("|"))) {
    const notesRow = row("notes", "ملاحظات إضافية", "Additional notes", item.special_notes);
    if (notesRow) noteRows.push(notesRow);
  }

  const sections = [
    { id: "locked", titleAr: "إعدادات الدفعة (مقفولة)", titleEn: "Batch settings (locked)", rows: lockedRows },
    { id: "product", titleAr: "المواصفات", titleEn: "Specifications", rows: productRows },
    { id: "embroidery", titleAr: "التطريز والزخرفة", titleEn: "Embroidery & decoration", rows: embroideryRows },
    { id: "attachments", titleAr: "المرفقات", titleEn: "Attachments", rows: attachmentRows },
    { id: "notes", titleAr: "ملاحظات", titleEn: "Notes", rows: noteRows },
  ].filter((section) => section.rows.length > 0);

  return { studentName, sections };
}

export function hasItemCustomization(item: OrderItem): boolean {
  return Boolean(
    item.size ||
      item.sash_color ||
      item.fabric_type ||
      item.cap_type ||
      item.custom_text ||
      item.font_family ||
      item.embroidery_position ||
      item.embroidery_style ||
      item.thread_color ||
      item.back_shape ||
      item.cap_side_notes ||
      item.cap_top_notes ||
      item.special_notes ||
      item.logo_url ||
      item.embroidery_image_path
  );
}
