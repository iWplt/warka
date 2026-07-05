import { getLocale } from "next-intl/server";
import { MessageCircle } from "lucide-react";
import { SectionHeading } from "@/components/ui/scroll-reveal";
import { WarkaCard } from "@/components/ui/warka-card";
import { Link } from "@/i18n/routing";
import { buildWhatsAppUrl } from "@/lib/constants/iraq-market";
import { getProductsCatalog } from "@/server/actions/products";
import { BulkOrderForm } from "./bulk-order-form";

export default async function BulkOrderPage() {
  const locale = (await getLocale()) as "ar" | "en";
  const isAr = locale === "ar";
  const products = await getProductsCatalog();

  const whatsappMessage = isAr
    ? "مرحباً WARKA، أريد الاستفسار عن طلب جماعي لجامعتي."
    : "Hello WARKA, I would like to inquire about a bulk order for my university.";

  return (
    <div className="bg-warka-bg pb-24 md:pb-16">
      <div className="border-b border-warka-border bg-card">
        <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 lg:px-8">
          <nav className="text-xs text-warka-text-muted">
            <Link href="/" className="hover:text-warka-text">
              {isAr ? "الرئيسية" : "Home"}
            </Link>
            <span className="mx-2">/</span>
            <span className="text-warka-text-secondary">
              {isAr ? "الطلب الجماعي" : "Bulk order"}
            </span>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <SectionHeading
          title={isAr ? "طلب جماعي للجامعات" : "University bulk orders"}
          subtitle={
            isAr
              ? "اطلب لمجموعتك أو كليتك — أسعار خاصة، تنسيق موحّد، وتوصيل لجميع المحافظات العراقية."
              : "Order for your group or college — special pricing, unified branding, and delivery across Iraq."
          }
        />

        <div className="mb-8">
          <WarkaCard className="flex flex-col items-start justify-between gap-4 border-[#25D366]/30 bg-[#25D366]/5 sm:flex-row sm:items-center">
            <div>
              <p className="font-semibold text-warka-text">
                {isAr ? "تفضّل التواصل المباشر؟" : "Prefer to talk directly?"}
              </p>
              <p className="mt-1 text-sm text-warka-text-secondary">
                {isAr
                  ? "فريقنا جاهز على واتساب للرد على استفسارات الطلبات الجماعية."
                  : "Our team is on WhatsApp for bulk order inquiries."}
              </p>
            </div>
            <a
              href={buildWhatsAppUrl(whatsappMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-xl bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              <MessageCircle className="size-4" />
              {isAr ? "واتساب WARKA" : "WARKA WhatsApp"}
            </a>
          </WarkaCard>
        </div>

        <BulkOrderForm products={products} />
      </div>
    </div>
  );
}
