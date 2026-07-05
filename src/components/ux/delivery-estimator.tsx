"use client";

import { useMemo, useState } from "react";
import { CalendarDays, MapPin } from "lucide-react";
import { IRAQI_GOVERNORATES } from "@/lib/constants/iraq-market";
import { cn } from "@/lib/utils";

type DeliveryEstimatorProps = {
  locale: "ar" | "en";
  className?: string;
  onGovernorateChange?: (governorateEn: string) => void;
};

function addBusinessDays(start: Date, days: number): Date {
  const result = new Date(start);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const dow = result.getDay();
    if (dow !== 5 && dow !== 6) added += 1;
  }
  return result;
}

/** Always Gregorian — avoids Hijri on ar-IQ in some browsers */
function formatGregorianDate(date: Date, locale: "ar" | "en"): string {
  const intlLocale = locale === "ar" ? "ar-IQ-u-ca-gregory" : "en-GB";
  return new Intl.DateTimeFormat(intlLocale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    calendar: "gregory",
  }).format(date);
}

export function DeliveryEstimator({
  locale,
  className,
  onGovernorateChange,
}: DeliveryEstimatorProps) {
  const isAr = locale === "ar";
  const [selectedEn, setSelectedEn] = useState<string>(IRAQI_GOVERNORATES[0].en);

  const governorate = IRAQI_GOVERNORATES.find((g) => g.en === selectedEn) ?? IRAQI_GOVERNORATES[0];

  const estimate = useMemo(() => {
    const today = new Date();
    const earliest = addBusinessDays(today, governorate.daysMin);
    const latest = addBusinessDays(today, governorate.daysMax);
    return { earliest, latest };
  }, [governorate.daysMin, governorate.daysMax]);

  const handleChange = (value: string) => {
    setSelectedEn(value);
    onGovernorateChange?.(value);
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-warka-border bg-card p-4 shadow-card",
        className
      )}
    >
      <div className="mb-3 flex items-center gap-2">
        <MapPin className="size-4 text-warka-primary" />
        <h3 className="text-sm font-bold text-warka-text">
          {isAr ? "تقدير التوصيل" : "Delivery estimate"}
        </h3>
      </div>

      <label className="mb-3 block text-xs font-medium text-warka-text-secondary">
        {isAr ? "المحافظة" : "Governorate"}
      </label>
      <select
        value={selectedEn}
        onChange={(e) => handleChange(e.target.value)}
        className="mb-4 w-full rounded-lg border border-warka-border bg-card px-3 py-2.5 text-sm text-warka-text focus:outline-none focus:ring-2 focus:ring-warka-primary"
      >
        {IRAQI_GOVERNORATES.map((g) => (
          <option key={g.en} value={g.en}>
            {isAr ? g.ar : g.en}
          </option>
        ))}
      </select>

      <div className="flex items-start gap-3 rounded-xl border border-warka-primary/15 bg-warka-primary/5 p-3">
        <CalendarDays className="mt-0.5 size-4 shrink-0 text-warka-primary" />
        <div className="text-sm">
          <p className="font-medium text-warka-text">
            {isAr ? "التوصيل المتوقع (ميلادي)" : "Expected delivery (Gregorian)"}
          </p>
          <p className="mt-1 text-warka-text-secondary">
            {isAr
              ? `بين ${governorate.daysMin} و ${governorate.daysMax} أيام عمل`
              : `${governorate.daysMin}–${governorate.daysMax} business days`}
          </p>
          <p className="mt-2 font-semibold text-warka-primary" dir="ltr">
            {formatGregorianDate(estimate.earliest, locale)}
            {estimate.earliest.getTime() !== estimate.latest.getTime() && (
              <>
                {" "}
                — {formatGregorianDate(estimate.latest, locale)}
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
