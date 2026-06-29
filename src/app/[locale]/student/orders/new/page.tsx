import { redirect } from "next/navigation";

type NewStudentOrderPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function NewStudentOrderPage({ params }: NewStudentOrderPageProps) {
  const { locale } = await params;
  redirect(`/${locale}/checkout`);
}
