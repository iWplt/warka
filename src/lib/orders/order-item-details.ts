import type { OrderItem, OrderType } from "@/types/database";
import type { CustomizationPayload, ZoneSelection } from "@/types/customization";
import { FIELD_LABELS } from "@/lib/orders/product-field-permissions";

export type OrderItemDetailRow = {
  key: string;
  labelAr: string;
  labelEn: string;
  value: string;
  kind?: "text" | "font" | "image" | "color";
  imageUrl?: string | null;
  colorHex?: string | null;
};

export type OrderItemMedia = {
  logoUrl: string | null;
  embroideryUrl: string | null;
  capSideUrl: string | null;
  capTopUrl: string | null;
  /** Catalog product primary image (signed or public URL) */
  productImageUrl?: string | null;
  /** Zone / customization images keyed by zone_key or zone_id */
  zoneImages?: Record<string, string | null>;
};

export type OrderItemDetailSection = {
  id: string;
  titleAr: string;
  titleEn: string;
  rows: OrderItemDetailRow[];
};

function row(
  key: string,
  labelAr: string,
  labelEn: string,
  value: string | null | undefined,
  extra?: Partial<Pick<OrderItemDetailRow, "kind" | "imageUrl" | "colorHex">>
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
    colorHex: extra?.colorHex,
  };
}

function parseSpecialNotes(notes: string | null | undefined): {
  quantity: string | null;
  fabricLabel: string | null;
  remaining: string | null;
} {
  if (!notes?.trim()) return { quantity: null, fabricLabel: null, remaining: null };
  const parts = notes.split("|").map((p) => p.trim()).filter(Boolean);
  let quantity: string | null = null;
  let fabricLabel: string | null = null;
  const rest: string[] = [];
  for (const part of parts) {
    const qtyMatch = part.match(/^(?:Qty|Quantity)\s*:\s*(.+)$/i);
    const fabricMatch = part.match(/^Fabric\s*:\s*(.+)$/i);
    const capSideMatch = part.match(/^Cap side\s*:\s*(.+)$/i);
    const capTopMatch = part.match(/^Cap top\s*:\s*(.+)$/i);
    if (qtyMatch) quantity = qtyMatch[1].trim();
    else if (fabricMatch) fabricLabel = fabricMatch[1].trim();
    else if (capSideMatch || capTopMatch) continue; // shown via dedicated fields
    else rest.push(part);
  }
  return {
    quantity,
    fabricLabel,
    remaining: rest.length > 0 ? rest.join(" | ") : null,
  };
}

function normalizePayload(
  raw: OrderItem["customization_payload"] | unknown
): CustomizationPayload | null {
  if (!raw) return null;
  if (Array.isArray(raw)) {
    // Legacy / empty default from migration
    if (raw.length === 0) return null;
    return null;
  }
  if (typeof raw !== "object") return null;
  const obj = raw as CustomizationPayload;
  if (!obj.zones && !obj.style_id && !obj.style_name_ar) return null;
  return {
    style_id: obj.style_id ?? null,
    style_key: obj.style_key,
    style_name_ar: obj.style_name_ar,
    zones: Array.isArray(obj.zones) ? obj.zones : [],
    gown_additions: obj.gown_additions,
  };
}

function contentTypeLabel(type: string | undefined): { ar: string; en: string } {
  switch (type) {
    case "name_major":
      return { ar: "اسم / تخصص", en: "Name / major" };
    case "university_info":
      return { ar: "معلومات الجامعة", en: "University info" };
    case "text_library":
      return { ar: "مكتبة النصوص", en: "Text library" };
    case "pattern_icon":
      return { ar: "نمط / أيقونة", en: "Pattern / icon" };
    case "custom_image":
      return { ar: "صورة مخصصة", en: "Custom image" };
    default:
      return { ar: type || "محتوى", en: type || "Content" };
  }
}

function zoneHasContent(zone: ZoneSelection): boolean {
  return Boolean(
    zone.text_value?.trim() ||
      zone.image_data_url ||
      zone.option_id ||
      zone.text_library_id ||
      zone.color_hex ||
      zone.color_id ||
      zone.computed_size_mm
  );
}

function buildCustomizationRows(
  payload: CustomizationPayload,
  zoneImages?: Record<string, string | null>
): OrderItemDetailRow[] {
  const rows: OrderItemDetailRow[] = [];

  const styleName =
    payload.style_name_ar?.trim() ||
    payload.style_key?.trim() ||
    (payload.style_id ? payload.style_id.slice(0, 8) : null);
  const styleRow = row("cust_style", "نمط التخصيص", "Customization style", styleName);
  if (styleRow) rows.push(styleRow);

  if (payload.gown_additions && payload.gown_additions.length > 0) {
    rows.push({
      key: "gown_additions",
      labelAr: "إضافات الرداء",
      labelEn: "Gown additions",
      value: payload.gown_additions.join(" · "),
      kind: "text",
    });
  }

  payload.zones.filter(zoneHasContent).forEach((zone, index) => {
    const zoneTitle =
      zone.zone_label_ar?.trim() ||
      zone.zone_key ||
      `zone-${index + 1}`;
    const typeLabels = contentTypeLabel(zone.content_type);
    const prefix = `zone_${zone.zone_key || zone.zone_id || index}`;

    rows.push({
      key: `${prefix}_header`,
      labelAr: `منطقة: ${zoneTitle}`,
      labelEn: `Zone: ${zoneTitle}`,
      value: `${typeLabels.ar} / ${typeLabels.en}`,
      kind: "text",
    });

    if (zone.text_value?.trim()) {
      rows.push({
        key: `${prefix}_text`,
        labelAr: `نص التطريز — ${zoneTitle}`,
        labelEn: `Embroidery text — ${zoneTitle}`,
        value: zone.text_value.trim(),
        kind: "text",
      });
    }

    if (zone.computed_size_mm != null) {
      rows.push({
        key: `${prefix}_size`,
        labelAr: `حجم التطريز (مم) — ${zoneTitle}`,
        labelEn: `Embroidery size (mm) — ${zoneTitle}`,
        value: `${zone.computed_size_mm} mm`,
        kind: "text",
      });
    }

    if (zone.color_hex || zone.color_id) {
      rows.push({
        key: `${prefix}_color`,
        labelAr: `لون التطريز — ${zoneTitle}`,
        labelEn: `Thread / zone color — ${zoneTitle}`,
        value: zone.color_hex || zone.color_id || "",
        kind: "color",
        colorHex: zone.color_hex ?? null,
      });
    }

    if (zone.color_source) {
      rows.push({
        key: `${prefix}_color_src`,
        labelAr: `مصدر اللون — ${zoneTitle}`,
        labelEn: `Color source — ${zoneTitle}`,
        value: zone.color_source,
        kind: "text",
      });
    }

    if (zone.option_type) {
      rows.push({
        key: `${prefix}_opt_type`,
        labelAr: `نوع الخيار — ${zoneTitle}`,
        labelEn: `Option type — ${zoneTitle}`,
        value: zone.option_type,
        kind: "text",
      });
    }

    if (zone.option_id) {
      rows.push({
        key: `${prefix}_opt_id`,
        labelAr: `معرّف الخيار — ${zoneTitle}`,
        labelEn: `Option ID — ${zoneTitle}`,
        value: zone.option_id,
        kind: "text",
      });
    }

    if (zone.text_library_id) {
      rows.push({
        key: `${prefix}_lib`,
        labelAr: `مكتبة النصوص — ${zoneTitle}`,
        labelEn: `Text library ID — ${zoneTitle}`,
        value: zone.text_library_id,
        kind: "text",
      });
    }

    const zoneImage =
      zoneImages?.[zone.zone_key] ||
      zoneImages?.[zone.zone_id] ||
      zone.image_data_url ||
      null;
    if (zoneImage) {
      rows.push({
        key: `${prefix}_img`,
        labelAr: `صورة المنطقة — ${zoneTitle}`,
        labelEn: `Zone image — ${zoneTitle}`,
        value: zoneImage,
        kind: "image",
        imageUrl: zoneImage,
      });
    }
  });

  return rows;
}

export function buildOrderItemDetailRows(
  item: OrderItem,
  orderType: OrderType,
  media?: OrderItemMedia
): {
  studentName: string | null;
  productTitle: string | null;
  sections: OrderItemDetailSection[];
} {
  const isGroup = orderType === "group";
  const studentName =
    isGroup && item.special_notes && !item.special_notes.includes("|")
      ? item.special_notes.trim()
      : null;

  const parsedNotes = parseSpecialNotes(item.special_notes);
  const productTitle = item.product_label?.trim() || null;

  const identityRows = [
    row("product_label", "اسم المنتج", "Product name", productTitle),
    row("catalog_id", "معرّف الكتالوج", "Catalog product ID", item.catalog_product_id),
    row("quantity", "الكمية", "Quantity", parsedNotes.quantity),
    row("unit_price", "سعر الوحدة / السطر", "Line unit price", String(item.unit_price)),
  ].filter(Boolean) as OrderItemDetailRow[];

  if (media?.productImageUrl) {
    identityRows.unshift({
      key: "product_image",
      labelAr: "صورة المنتج",
      labelEn: "Product image",
      value: media.productImageUrl,
      kind: "image",
      imageUrl: media.productImageUrl,
    });
  }

  const productRows = [
    row("size", "المقاس", "Size", item.size),
    row(
      "custom_measurements",
      "قياسات مخصصة",
      "Custom measurements",
      ((item.student_fields ?? {}) as Record<string, string>).custom_measurements
    ),
    row("sash_color", "لون المنتج / الوشاح", "Product / sash color", item.sash_color, {
      kind: "color",
      colorHex: item.sash_color?.startsWith("#") ? item.sash_color : null,
    }),
    row("cap_type", "نوع القبعة", "Cap type", item.cap_type),
    row(
      "fabric",
      "نوع القماش",
      "Fabric",
      parsedNotes.fabricLabel || item.fabric_type
    ),
    row("fabric_key", "مفتاح القماش", "Fabric key", item.fabric_type),
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
    row("thread", "لون الخيط", "Thread color", item.thread_color, {
      kind: "color",
      colorHex: item.thread_color?.startsWith("#") ? item.thread_color : null,
    }),
    row("back", "شكل الظهر / النمط", "Back shape / style", item.back_shape),
    row("cap_side", "تطريز جانب القبعة", "Cap side embroidery", item.cap_side_notes),
    row("cap_top", "تطريز أعلى القبعة", "Cap top embroidery", item.cap_top_notes),
  ].filter(Boolean) as OrderItemDetailRow[];

  const payload = normalizePayload(item.customization_payload);
  const customizationRows = payload
    ? buildCustomizationRows(payload, media?.zoneImages)
    : [];

  const studentFieldRows = Object.entries(item.student_fields ?? {})
    .filter(([key]) => key !== "custom_measurements")
    .map(([key, value]) => {
      const labels = FIELD_LABELS[key] ?? { ar: key, en: key };
      return row(`sf_${key}`, labels.ar, labels.en, value);
    })
    .filter(Boolean) as OrderItemDetailRow[];

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
      labelAr: "الشعار المرفوع أثناء الطلب",
      labelEn: "Logo uploaded with order",
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

  // Also surface any zone images not already listed in customization section
  if (media?.zoneImages) {
    for (const [zoneKey, url] of Object.entries(media.zoneImages)) {
      if (!url) continue;
      const already = customizationRows.some((r) => r.kind === "image" && r.imageUrl === url);
      if (already) continue;
      attachmentRows.push({
        key: `zone_attach_${zoneKey}`,
        labelAr: `صورة منطقة التخصيص (${zoneKey})`,
        labelEn: `Customization zone image (${zoneKey})`,
        value: url,
        kind: "image",
        imageUrl: url,
      });
    }
  }

  const noteRows: OrderItemDetailRow[] = [];
  if (parsedNotes.remaining && (!isGroup || item.special_notes?.includes("|"))) {
    const notesRow = row("notes", "ملاحظات إضافية", "Additional notes", parsedNotes.remaining);
    if (notesRow) noteRows.push(notesRow);
  }
  if (item.template_id) {
    const tpl = row("template", "معرّف القالب", "Template ID", item.template_id);
    if (tpl) noteRows.push(tpl);
  }

  const sections = [
    { id: "identity", titleAr: "هوية المنتج", titleEn: "Product identity", rows: identityRows },
    { id: "locked", titleAr: "إعدادات الدفعة (مقفولة)", titleEn: "Batch settings (locked)", rows: lockedRows },
    { id: "product", titleAr: "المواصفات (لون · قماش · مقاس)", titleEn: "Specifications (color · fabric · size)", rows: productRows },
    { id: "embroidery", titleAr: "التطريز والخط والزخرفة", titleEn: "Embroidery, font & decoration", rows: embroideryRows },
    {
      id: "customization",
      titleAr: "محرك التخصيص (تفاصيل كاملة)",
      titleEn: "Customization engine (full details)",
      rows: customizationRows,
    },
    {
      id: "student_fields",
      titleAr: "حقول الطالب الإضافية",
      titleEn: "Extra student fields",
      rows: studentFieldRows,
    },
    {
      id: "attachments",
      titleAr: "الصور والمرفقات المرفوعة أثناء الطلب",
      titleEn: "Images & uploads from the order",
      rows: attachmentRows,
    },
    { id: "notes", titleAr: "ملاحظات", titleEn: "Notes", rows: noteRows },
  ].filter((section) => section.rows.length > 0);

  return { studentName, productTitle, sections };
}

export function hasItemCustomization(item: OrderItem): boolean {
  const payload = normalizePayload(item.customization_payload);
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
      item.embroidery_image_path ||
      item.product_label ||
      (payload && (payload.zones.length > 0 || payload.style_id || payload.style_name_ar))
  );
}

export function summarizeOrderItemForList(
  item: OrderItem,
  locale: "ar" | "en"
): string[] {
  const bits: string[] = [];
  if (item.product_label) bits.push(item.product_label);
  if (item.sash_color) {
    bits.push(locale === "ar" ? `اللون: ${item.sash_color}` : `Color: ${item.sash_color}`);
  }
  if (item.size) {
    bits.push(locale === "ar" ? `المقاس: ${item.size}` : `Size: ${item.size}`);
  }
  if (item.fabric_type) {
    bits.push(locale === "ar" ? `القماش: ${item.fabric_type}` : `Fabric: ${item.fabric_type}`);
  }
  if (item.custom_text) {
    bits.push(locale === "ar" ? `النص: "${item.custom_text}"` : `Text: "${item.custom_text}"`);
  }
  if (item.font_family) {
    bits.push(locale === "ar" ? `الخط: ${item.font_family}` : `Font: ${item.font_family}`);
  }
  if (item.embroidery_position) {
    bits.push(
      locale === "ar"
        ? `موضع التطريز: ${item.embroidery_position}`
        : `Position: ${item.embroidery_position}`
    );
  }
  if (item.thread_color) {
    bits.push(
      locale === "ar" ? `لون الخيط: ${item.thread_color}` : `Thread: ${item.thread_color}`
    );
  }
  const payload = normalizePayload(item.customization_payload);
  if (payload?.style_name_ar) {
    bits.push(
      locale === "ar" ? `النمط: ${payload.style_name_ar}` : `Style: ${payload.style_name_ar}`
    );
  }
  const zoneCount = payload?.zones.filter(zoneHasContent).length ?? 0;
  if (zoneCount > 0) {
    bits.push(
      locale === "ar" ? `${zoneCount} مناطق تخصيص` : `${zoneCount} customization zones`
    );
  }
  const hasUploads = Boolean(
    item.logo_url ||
      item.embroidery_image_path ||
      item.cap_side_embroidery_path ||
      item.cap_top_embroidery_path
  );
  if (hasUploads) {
    bits.push(locale === "ar" ? "يحتوي مرفقات صور" : "Has image uploads");
  }
  return bits;
}
