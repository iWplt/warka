import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentProfile } from "@/lib/auth/guards";
import { ProfileForm } from "@/components/features/profile/profile-form";

export default async function StudentProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("profile");
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect(`/${locale}/login`);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-warka-text">{t("title")}</h1>
        <p className="text-warka-text-secondary">{t("editHint")}</p>
      </div>
      <ProfileForm profile={profile} />
    </div>
  );
}
