import type { Order, OrderItem, Payment, PaymentMethod, ProductType } from "@/types/database";
import { BRAND_PDF } from "@/lib/constants/brand-pdf";
import { COD_FEE_IQD, WHATSAPP_NUMBER } from "@/lib/constants/iraq-market";
import { getWarkaLogoDataUrl } from "@/lib/brand/logo-data-url";
import { env } from "@/lib/env";
import { parseOrderNotes } from "@/lib/orders/parse-order-notes";

export type OrderInvoiceInput = {
  order: Order;
  student: {
    full_name: string;
    phone: string | null;
    college: string | null;
    department: string | null;
  } | null;
  items: OrderItem[];
  payments: Payment[];
  productNames: Record<string, { name_ar: string; name_en: string }>;
  trackUrl: string;
};

const PRODUCT_LABELS: Record<ProductType, string> = {
  sash: "Graduation Sash",
  cap: "Graduation Cap",
  gown: "Graduation Gown",
  suit: "Graduation Suit",
  custom: "Custom Item",
};

function orderStatusLabel(order: Order): string {
  if (order.deposit_paid_at && order.status === "new") {
    return "Confirmed / Deposit paid";
  }
  return STATUS_LABELS[order.status] ?? order.status;
}

const STATUS_LABELS: Record<Order["status"], string> = {
  new: "New / Awaiting deposit",
  pending_review: "Pending review",
  designing: "In design",
  awaiting_approval: "Awaiting approval",
  needs_modification: "Needs modification",
  ready_for_printing: "Ready for printing",
  printing: "Printing",
  printed: "Printed",
  ready_for_delivery: "Ready for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Cash on delivery (COD)",
  bank_transfer: "Bank transfer",
  zain_cash: "Zain Cash",
};

function formatIqd(amount: number): string {
  return `${Math.round(amount).toLocaleString("en-US")} IQD`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function productLabel(item: OrderItem, productNames: OrderInvoiceInput["productNames"]): string {
  const catalog = item.catalog_product_id ? productNames[item.catalog_product_id] : null;
  const base = catalog?.name_en ?? PRODUCT_LABELS[item.product_type];
  const ar = catalog?.name_ar;
  return ar ? `${base} / ${ar}` : base;
}

function embroiderySummary(item: OrderItem): string {
  const parts = [
    item.custom_text ? `Text: ${item.custom_text}` : null,
    item.embroidery_position,
    item.embroidery_style,
    item.thread_color ? `Thread: ${item.thread_color}` : null,
    item.back_shape ? `Back: ${item.back_shape}` : null,
    item.cap_side_notes ? `Cap side: ${item.cap_side_notes}` : null,
    item.cap_top_notes ? `Cap top: ${item.cap_top_notes}` : null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "—";
}

function colorFabricSummary(item: OrderItem): string {
  const color = item.sash_color ?? item.cap_type ?? "—";
  const fabric = item.fabric_type ?? "—";
  return `${color} / ${fabric}`;
}

function paymentSummary(payments: Payment[]): string {
  if (payments.length === 0) return "Unpaid";
  const methods = [...new Set(payments.map((p) => PAYMENT_METHOD_LABELS[p.method]))];
  return methods.join(", ");
}

function paidTotal(payments: Payment[]): number {
  return payments.reduce((sum, p) => sum + Number(p.amount), 0);
}

function depositPaid(order: Order, payments: Payment[]): number {
  if (Number(order.deposit_required) > 0 && order.deposit_paid_at) {
    return Number(order.deposit_required);
  }
  const depositPayment = payments.find((p) => p.notes?.toLowerCase().includes("deposit"));
  if (depositPayment) return Number(depositPayment.amount);
  return paidTotal(payments);
}

export async function buildOrderInvoicePdf(input: OrderInvoiceInput): Promise<ArrayBuffer> {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const QRCode = (await import("qrcode")).default;

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  const { order, student, items, payments, productNames, trackUrl } = input;
  const delivery = parseOrderNotes(order.notes).delivery;
  const phone = delivery.phone ?? student?.phone ?? "—";
  const deliveryLine = [delivery.governorate, delivery.area].filter(Boolean).join(" — ") || "—";
  const subtotal = Number(order.subtotal ?? order.total);
  const total = Number(order.total);
  const paid = paidTotal(payments);
  const deposit = depositPaid(order, payments);
  const remaining = Math.max(0, total - paid);
  const hasCod = payments.some((p) => p.method === "cash");
  const deliveryFee = hasCod && remaining > 0 ? COD_FEE_IQD : 0;
  const grandTotal = total + deliveryFee;

  const qrDataUrl = await QRCode.toDataURL(trackUrl, {
    width: 140,
    margin: 1,
    color: { dark: "#2f3b27", light: "#ffffff" },
  });
  const logoDataUrl = getWarkaLogoDataUrl();

  doc.setFillColor(...BRAND_PDF.cream);
  doc.rect(0, 0, pageWidth, 38, "F");
  doc.addImage(logoDataUrl, "PNG", margin, 8, 42, 20);
  doc.setFillColor(...BRAND_PDF.olive);
  doc.rect(0, 38, pageWidth, 1.5, "F");

  doc.setTextColor(...BRAND_PDF.textDark);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Invoice / Fatoora", pageWidth - margin, 16, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...BRAND_PDF.darkOlive);
  doc.text("Graduation Printing Store — Iraq", pageWidth - margin, 22, { align: "right" });
  doc.setFont("courier", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...BRAND_PDF.textDark);
  doc.text(`#${order.order_number}`, pageWidth - margin, 30, { align: "right" });

  const infoTop = 46;
  const infoHeight = 36;
  doc.setFillColor(...BRAND_PDF.warmCream);
  doc.setDrawColor(...BRAND_PDF.sand);
  doc.roundedRect(margin, infoTop, contentWidth, infoHeight, 2, 2, "FD");

  const colW = contentWidth / 2;
  const infoRows: Array<[string, string]> = [
    ["Student", student?.full_name ?? "—"],
    ["Date (Gregorian)", formatDate(order.created_at)],
    ["Phone", phone],
    ["Delivery", deliveryLine],
    ["Status", orderStatusLabel(order)],
    ["Payment", paymentSummary(payments)],
  ];

  doc.setFontSize(7);
  infoRows.forEach(([label, value], index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = margin + 4 + col * colW;
    const y = infoTop + 7 + row * 11;
    doc.setTextColor(100, 100, 100);
    doc.text(label, x, y);
    doc.setTextColor(...BRAND_PDF.textDark);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    const lines = doc.splitTextToSize(value, colW - 8);
    doc.text(lines, x, y + 4);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
  });

  if (student?.college) {
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `College: ${student.college}${student.department ? ` — ${student.department}` : ""}`,
      margin + 4,
      infoTop + infoHeight - 3
    );
  }

  autoTable(doc, {
    startY: infoTop + infoHeight + 6,
    margin: { left: margin, right: margin },
    head: [["Product", "Size", "Color / Fabric", "Font", "Embroidery", "Price"]],
    body: items.map((item) => [
      productLabel(item, productNames),
      item.size ?? "—",
      colorFabricSummary(item),
      item.font_family ?? "—",
      embroiderySummary(item),
      formatIqd(Number(item.unit_price)),
    ]),
    headStyles: {
      fillColor: [...BRAND_PDF.darkOlive],
      textColor: [...BRAND_PDF.cream],
      fontStyle: "bold",
      fontSize: 8,
      halign: "left",
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [...BRAND_PDF.textDark],
      cellPadding: 2.5,
    },
    alternateRowStyles: { fillColor: [...BRAND_PDF.warmCream] },
    styles: {
      lineColor: [...BRAND_PDF.sand],
      lineWidth: 0.1,
      overflow: "linebreak",
    },
    columnStyles: {
      0: { cellWidth: 42 },
      1: { cellWidth: 16 },
      2: { cellWidth: 28 },
      3: { cellWidth: 22 },
      4: { cellWidth: 38 },
      5: { cellWidth: 24, halign: "right" },
    },
  });

  const tableEnd =
    (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 120;
  const totalsY = tableEnd + 8;
  const totalsX = pageWidth - margin;

  doc.setDrawColor(...BRAND_PDF.sand);
  doc.line(margin, totalsY - 4, pageWidth - margin, totalsY - 4);

  const totalRows: Array<[string, string, boolean]> = [
    ["Subtotal", formatIqd(subtotal), false],
    ["Deposit paid (Arabon)", order.deposit_paid_at ? formatIqd(deposit) : "Not paid yet", false],
    ["Amount paid to date", formatIqd(paid), false],
    ["Remaining balance", formatIqd(remaining), false],
  ];

  if (deliveryFee > 0) {
    totalRows.push(["COD delivery fee", formatIqd(deliveryFee), false]);
  }

  totalRows.push(["Total", formatIqd(grandTotal), true]);

  doc.setFontSize(9);
  totalRows.forEach(([label, value], index) => {
    const y = totalsY + index * 6;
    const isGrand = index === totalRows.length - 1;
    doc.setFont("helvetica", isGrand ? "bold" : "normal");
    doc.setFontSize(isGrand ? 12 : 9);
    if (isGrand) {
      doc.setTextColor(...BRAND_PDF.darkOlive);
    } else {
      doc.setTextColor(...BRAND_PDF.textDark);
    }
    doc.text(label, totalsX - 52, y, { align: "right" });
    doc.text(value, totalsX, y, { align: "right" });
  });

  const footerTop = totalsY + totalRows.length * 6 + 8;
  const qrSize = 32;
  doc.setDrawColor(...BRAND_PDF.sand);
  doc.setFillColor(...BRAND_PDF.white);
  doc.roundedRect(margin, footerTop, qrSize + 8, qrSize + 14, 2, 2, "FD");
  doc.addImage(qrDataUrl, "PNG", margin + 4, footerTop + 6, qrSize, qrSize);
  doc.setFontSize(7);
  doc.setTextColor(...BRAND_PDF.darkOlive);
  doc.text("Scan to track", margin + (qrSize + 8) / 2, footerTop + qrSize + 11, {
    align: "center",
  });

  const footerX = margin + qrSize + 16;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...BRAND_PDF.textDark);
  doc.text("Thank you for choosing WARKA", footerX, footerTop + 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text("Professional graduation printing — Iraq", footerX, footerTop + 12);
  if (order.deposit_paid_at) {
    doc.text(
      `Order confirmed on ${formatDate(order.deposit_paid_at)} after deposit payment.`,
      footerX,
      footerTop + 18
    );
  }
  if (WHATSAPP_NUMBER) {
    doc.text(`WhatsApp: +${WHATSAPP_NUMBER}`, footerX, footerTop + 24);
  }
  doc.text(env.NEXT_PUBLIC_APP_URL.replace(/^https?:\/\//, ""), footerX, footerTop + 30);

  doc.setFillColor(...BRAND_PDF.darkOlive);
  doc.rect(0, 287, pageWidth, 10, "F");
  doc.setFontSize(7);
  doc.setTextColor(...BRAND_PDF.cream);
  doc.text(
    "WARKA — Official order invoice. Keep this document for your records.",
    pageWidth / 2,
    292.5,
    { align: "center" }
  );

  if (order.notes?.includes("\n")) {
    const extraNotes = order.notes.split("\n").slice(1).join(" ").trim();
    if (extraNotes) {
      doc.setTextColor(80, 80, 80);
      doc.setFontSize(7);
      doc.text(`Notes: ${extraNotes}`, margin, footerTop + 42, { maxWidth: contentWidth });
    }
  }

  return doc.output("arraybuffer");
}
