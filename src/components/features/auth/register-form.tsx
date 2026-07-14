"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { Check, GraduationCap, Users, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { signUp } from "@/server/actions/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LanguageSwitcher } from "@/components/layouts/language-switcher";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { WARKA_TAGLINE_AR, WARKA_TAGLINE_EN } from "@/lib/constants/brand";
import { cn } from "@/lib/utils";

const studentSchema = z.object({
  accountType: z.literal("student"),
  fullName: z.string().min(2),
  phone: z.string().min(8),
  studentIdNumber: z.string().optional(),
  college: z.string().min(2),
  department: z.string().optional(),
});

const repBaseSchema = z.object({
  accountType: z.literal("representative"),
  inviteCode: z.string().min(8),
  fullName: z.string().min(2),
  phone: z.string().min(8),
  email: z.string().email(),
  college: z.string().min(2),
  department: z.string().min(2),
  graduationYear: z.string().min(4),
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
});

const repSchema = repBaseSchema.refine((data) => data.password === data.confirmPassword, {
  message: "passwordMismatch",
  path: ["confirmPassword"],
});

const registerSchema = z.union([studentSchema, repSchema]);

type RegisterFormData = z.infer<typeof registerSchema>;

function RegisterAlerts() {
  const t = useTranslations("auth");
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  if (!error) return null;

  const message =
    error === "invalid-invite"
      ? t("invalidInvite")
      : error === "invalid"
        ? t("registerError")
        : error === "config"
          ? t("configError")
          : error === "profile"
            ? t("profileError")
            : t("registerError");

  return (
    <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm font-medium text-destructive">
      {message}
    </p>
  );
}

export function RegisterForm() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const tagline = locale === "ar" ? WARKA_TAGLINE_AR : WARKA_TAGLINE_EN;

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      accountType: "student",
      fullName: "",
      phone: "",
      studentIdNumber: "",
      college: "",
      department: "",
      inviteCode: "",
      email: "",
      graduationYear: String(new Date().getFullYear()),
      password: "",
      confirmPassword: "",
    } as RegisterFormData,
    mode: "onBlur",
  });

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const accountType = watch("accountType");
  const isStudent = accountType === "student";
  const studentSteps = ["accountType", "personal", "academic"] as const;
  const repSteps = ["accountType", "invite", "personal", "academic", "password"] as const;
  const steps = isStudent ? studentSteps : repSteps;
  const stepLabels = isStudent
    ? [t("stepAccount"), t("stepPersonal"), t("stepAcademic")]
    : [t("stepAccount"), t("stepInvite"), t("stepPersonal"), t("stepAcademic"), t("stepPassword")];

  const fieldsByStep: string[][] = isStudent
    ? [["accountType"], ["fullName", "phone", "studentIdNumber"], ["college", "department"]]
    : [
        ["accountType"],
        ["inviteCode"],
        ["fullName", "phone", "email"],
        ["college", "department", "graduationYear"],
        ["password", "confirmPassword"],
      ];

  const nextStep = async () => {
    const valid = await trigger(fieldsByStep[step] as (keyof RegisterFormData)[]);
    if (valid) setStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const onSubmit = async (data: RegisterFormData) => {
    setSubmitting(true);
    const formData = new FormData();
    formData.set("locale", locale);
    formData.set("accountType", data.accountType);
    formData.set("fullName", data.fullName);
    formData.set("phone", data.phone);
    formData.set("college", data.college);

    if (data.accountType === "student") {
      if (data.department) formData.set("department", data.department);
      if (data.studentIdNumber) formData.set("studentIdNumber", data.studentIdNumber);
    } else {
      formData.set("inviteCode", data.inviteCode);
      formData.set("email", data.email);
      formData.set("password", data.password);
      formData.set("department", data.department);
      formData.set("graduationYear", data.graduationYear);
    }

    try {
      await signUp(formData);
    } catch {
      toast.error(t("registerError"));
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-lg">
      <div className="mb-6 text-center">
        <Link href="/" className="inline-flex flex-col items-center gap-2">
          <BrandLockup layout="auth" tagline={tagline} priority />
        </Link>
      </div>

      <div className="rounded-[var(--radius-card)] border border-warka-border bg-card p-5 shadow-card sm:p-6">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div className="min-w-0 text-center sm:text-start">
            <h1 className="page-title text-xl sm:text-2xl">{t("registerTitle")}</h1>
            <p className="page-description mt-1">
              {t("registerStep", { step: step + 1, total: steps.length })}
            </p>
          </div>
          <LanguageSwitcher />
        </div>

        <RegisterAlerts />

        <div className="relative mb-8 flex items-center justify-between">
          <div className="absolute top-1/2 right-0 left-0 h-0.5 -translate-y-1/2 bg-warka-border" />
          {steps.map((key, index) => (
            <div key={key} className="relative z-10 flex flex-col items-center gap-1">
              <div
                className={cn(
                  "flex size-8 items-center justify-center rounded-full text-xs font-bold transition-colors",
                  index <= step
                    ? "bg-warka-primary text-white"
                    : "border-2 border-warka-border bg-card text-warka-text-muted"
                )}
              >
                {index < step ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              <span className="hidden max-w-[4rem] text-center text-[10px] font-medium text-warka-text-secondary sm:block">
                {stepLabels[index]}
              </span>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {step === 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {(["student", "representative"] as const).map((type) => {
                const Icon = type === "student" ? GraduationCap : Users;
                return (
                  <label
                    key={type}
                    className={cn(
                      "cursor-pointer rounded-xl border-2 p-4 text-center transition-all",
                      accountType === type
                        ? "border-warka-primary bg-warka-primary/5"
                        : "border-warka-border hover:border-warka-primary/40"
                    )}
                  >
                    <input
                      type="radio"
                      value={type}
                      className="sr-only"
                      {...register("accountType")}
                      onChange={() => {
                        setValue("accountType", type);
                        setStep(0);
                      }}
                    />
                    <Icon className="mx-auto mb-2 h-6 w-6 text-warka-primary" />
                    <span className="text-sm font-semibold text-warka-text">{t(`accountType.${type}`)}</span>
                    <p className="mt-1 text-xs text-warka-text-secondary">
                      {type === "student" ? t("studentRegisterHint") : t("repRegisterHint")}
                    </p>
                  </label>
                );
              })}
            </div>
          )}

          {!isStudent && step === 1 && (
            <>
              <p className="rounded-xl border-2 border-warka-border bg-warka-surface px-3 py-2 text-sm text-warka-text-secondary">
                {t("inviteCodeHint")}
              </p>
              <Field
                label={t("inviteCode")}
                error={"inviteCode" in errors ? errors.inviteCode?.message : undefined}
              >
                <Input
                  {...register("inviteCode")}
                  dir="ltr"
                  placeholder="REP-XXXX-XXXX"
                  className="warka-input font-mono uppercase"
                />
              </Field>
            </>
          )}

          {((isStudent && step === 1) || (!isStudent && step === 2)) && (
            <>
              <Field label={t("fullName")} error={errors.fullName?.message}>
                <Input {...register("fullName")} className="warka-input" />
              </Field>
              <Field label={t("phone")} error={errors.phone?.message}>
                <Input {...register("phone")} type="tel" dir="ltr" className="warka-input" />
              </Field>
              {isStudent ? (
                <Field
                  label={t("studentIdNumber")}
                  error={"studentIdNumber" in errors ? errors.studentIdNumber?.message : undefined}
                >
                  <Input
                    {...register("studentIdNumber")}
                    dir="ltr"
                    placeholder={t("studentIdOptional")}
                    className="warka-input"
                  />
                </Field>
              ) : (
                <Field label={t("email")} error={"email" in errors ? errors.email?.message : undefined}>
                  <Input {...register("email")} type="email" dir="ltr" className="warka-input" />
                </Field>
              )}
            </>
          )}

          {((isStudent && step === 2) || (!isStudent && step === 3)) && (
            <>
              <Field label={t("college")} error={errors.college?.message}>
                <Input {...register("college")} className="warka-input" />
              </Field>
              <Field
                label={isStudent ? t("departmentOptional") : t("department")}
                error={errors.department?.message}
              >
                <Input {...register("department")} className="warka-input" />
              </Field>
              {!isStudent && (
                <Field label={t("graduationYear")} error={"graduationYear" in errors ? errors.graduationYear?.message : undefined}>
                  <Input {...register("graduationYear")} type="number" dir="ltr" className="warka-input" />
                </Field>
              )}
            </>
          )}

          {!isStudent && step === 4 && (
            <>
              <Field label={t("password")} error={"password" in errors ? errors.password?.message : undefined}>
                <Input {...register("password")} type="password" autoComplete="new-password" className="warka-input" />
              </Field>
              <Field
                label={t("confirmPassword")}
                error={
                  "confirmPassword" in errors
                    ? errors.confirmPassword?.message === "passwordMismatch"
                      ? t("passwordMismatch")
                      : errors.confirmPassword?.message
                    : undefined
                }
              >
                <Input {...register("confirmPassword")} type="password" className="warka-input" />
              </Field>
            </>
          )}

          {isStudent && step === 2 && (
            <div className="rounded-xl border-2 border-warka-primary/30 bg-warka-primary/5 p-4">
              <div className="flex items-start gap-3">
                <KeyRound className="mt-0.5 size-5 shrink-0 text-warka-primary" />
                <p className="text-sm leading-relaxed text-warka-text-secondary">{t("accessCodeWillGenerate")}</p>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="rounded-xl border-2 border-warka-primary px-4 py-2.5 text-sm font-semibold text-warka-primary hover:bg-warka-primary/5"
              >
                {t("back")}
              </button>
            )}
            {step < steps.length - 1 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex-1 rounded-xl bg-warka-primary py-2.5 text-sm font-semibold text-white hover:bg-warka-primary-dark"
              >
                {t("next")}
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 rounded-xl bg-warka-primary py-2.5 text-sm font-semibold text-white hover:bg-warka-primary-dark disabled:opacity-60"
              >
                {isStudent ? t("createStudentAccount") : t("registerButton")}
              </button>
            )}
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-warka-text-secondary">
          {t("hasAccount")}{" "}
          <Link href="/login" className="font-medium text-warka-primary hover:underline">
            {t("login")}
          </Link>
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-semibold text-warka-text">{label}</Label>
      {children}
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
