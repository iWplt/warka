import Image from "next/image";
import { getTranslations, getLocale } from "next-intl/server";
import { Phone, Mail, MapPin } from "lucide-react";
import { Link } from "@/i18n/routing";
import { WARKA_LOGO_PATH, WARKA_TAGLINE_AR, WARKA_TAGLINE_EN } from "@/lib/constants/brand";
import { SITE_CONTACT } from "@/lib/constants/site-contact";

export async function SiteFooter() {
  const t = await getTranslations("landing.footer");
  const tCommon = await getTranslations("common");
  const tRoles = await getTranslations("landing.roles");
  const locale = await getLocale();
  const tagline = locale === "ar" ? WARKA_TAGLINE_AR : WARKA_TAGLINE_EN;

  return (
    <footer className="bg-warka-text text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Image src={WARKA_LOGO_PATH} alt="WARKA" width={40} height={40} className="h-10 w-10 invert" />
              <div className="flex flex-col">
                <span className="font-display text-xl font-bold tracking-wide">WARKA</span>
                <span className="-mt-1 text-[10px] text-white/60">{tagline}</span>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-white/70">{t("tagline")}</p>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-bold">{t("linksTitle")}</h4>
            <ul className="space-y-2">
              <li>
                <a href="#products" className="text-sm text-white/70 transition-colors hover:text-white">
                  {t("products")}
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="text-sm text-white/70 transition-colors hover:text-white">
                  {t("howItWorks")}
                </a>
              </li>
              <li>
                <Link href="/login" className="text-sm text-white/70 transition-colors hover:text-white">
                  {t("login")}
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-sm text-white/70 transition-colors hover:text-white">
                  {tCommon("register")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-bold">{t("contactTitle")}</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-white/70">
                <Phone className="h-4 w-4 text-warka-accent" />
                <a href={`tel:${SITE_CONTACT.phoneE164}`} dir="ltr" className="hover:text-white">
                  {SITE_CONTACT.phoneDisplay}
                </a>
              </li>
              <li className="flex items-center gap-2 text-sm text-white/70">
                <Mail className="h-4 w-4 text-warka-accent" />
                <a href={`mailto:${SITE_CONTACT.email}`} className="hover:text-white">
                  {SITE_CONTACT.email}
                </a>
              </li>
              <li className="flex items-start gap-2 text-sm text-white/70">
                <MapPin className="mt-0.5 h-4 w-4 text-warka-accent" />
                <span>{t("address")}</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-bold">{tRoles("title")}</h4>
            <ul className="space-y-2">
              <li className="text-sm text-white/70">{tRoles("student.title")}</li>
              <li className="text-sm text-white/70">{tRoles("representative.title")}</li>
              <li className="text-sm text-white/70">{tRoles("coordinator.title")}</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row">
          <p className="text-xs text-white/50">{t("copyright", { year: new Date().getFullYear() })}</p>
          <p className="text-xs text-white/50">{t("storeLabel")}</p>
        </div>
      </div>
    </footer>
  );
}
