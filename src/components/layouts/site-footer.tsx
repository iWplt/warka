import { getTranslations, getLocale } from "next-intl/server";
import { Phone, Mail, MapPin } from "lucide-react";
import { Link } from "@/i18n/routing";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { WARKA_TAGLINE_AR, WARKA_TAGLINE_EN } from "@/lib/constants/brand";
import { SITE_CONTACT } from "@/lib/constants/site-contact";

export async function SiteFooter() {
  const t = await getTranslations("landing.footer");
  const tCommon = await getTranslations("common");
  const tRoles = await getTranslations("landing.roles");
  const locale = await getLocale();
  const tagline = locale === "ar" ? WARKA_TAGLINE_AR : WARKA_TAGLINE_EN;

  return (
    <footer className="site-footer bg-warka-footer text-warka-footer-text">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <BrandLockup variant="dark" layout="footer" tagline={tagline} />
            <p className="text-sm leading-relaxed opacity-75">{t("tagline")}</p>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-bold">{t("linksTitle")}</h4>
            <ul className="space-y-2">
              <li>
                <a href="#products" className="text-sm opacity-75 transition-opacity hover:opacity-100">
                  {t("products")}
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="text-sm opacity-75 transition-opacity hover:opacity-100">
                  {t("howItWorks")}
                </a>
              </li>
              <li>
                <Link href="/login" className="text-sm opacity-75 transition-opacity hover:opacity-100">
                  {t("login")}
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-sm opacity-75 transition-opacity hover:opacity-100">
                  {tCommon("register")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-bold">{t("contactTitle")}</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm opacity-75">
                <Phone className="h-4 w-4 text-warka-accent" />
                <a href={`tel:${SITE_CONTACT.phoneE164}`} dir="ltr" className="hover:opacity-100">
                  {SITE_CONTACT.phoneDisplay}
                </a>
              </li>
              <li className="flex items-center gap-2 text-sm opacity-75">
                <Mail className="h-4 w-4 text-warka-accent" />
                <a href={`mailto:${SITE_CONTACT.email}`} className="hover:opacity-100">
                  {SITE_CONTACT.email}
                </a>
              </li>
              <li className="flex items-start gap-2 text-sm opacity-75">
                <MapPin className="mt-0.5 h-4 w-4 text-warka-accent" />
                <span>{t("address")}</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-bold">{tRoles("title")}</h4>
            <ul className="space-y-2">
              <li className="text-sm opacity-75">{tRoles("student.title")}</li>
              <li className="text-sm opacity-75">{tRoles("representative.title")}</li>
              <li className="text-sm opacity-75">{tRoles("coordinator.title")}</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row">
          <p className="text-xs opacity-50">{t("copyright", { year: new Date().getFullYear() })}</p>
          <p className="text-xs opacity-50">{t("storeLabel")}</p>
        </div>
      </div>
    </footer>
  );
}
