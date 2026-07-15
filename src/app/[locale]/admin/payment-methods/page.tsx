import { getTranslations } from "next-intl/server";
import { getPaymentMethodSettings } from "@/server/actions/settings";
import { PaymentMethodsManager } from "@/components/features/admin/payment-methods-manager";
import { PageHeader } from "@/components/ui/page-header";

export default async function AdminPaymentMethodsPage() {
  const t = await getTranslations("adminPaymentMethods");
  const settings = await getPaymentMethodSettings();

  return (
    <div className="stack-page">
      <PageHeader title={t("title")} description={t("subtitle")} />
      <PaymentMethodsManager settings={settings} />
    </div>
  );
}
