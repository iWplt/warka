"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";

type CountdownTimerProps = {
  targetDate: Date | string | number;
  startDate?: Date | string | number;
  className?: string;
  onComplete?: () => void;
};

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
};

function toTimestamp(value: Date | string | number): number {
  return value instanceof Date ? value.getTime() : new Date(value).getTime();
}

function computeTimeLeft(targetMs: number): TimeLeft {
  const totalMs = Math.max(0, targetMs - Date.now());

  const days = Math.floor(totalMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((totalMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((totalMs % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, totalMs };
}

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

type TimeUnitProps = {
  value: number;
  label: string;
  urgent: boolean;
};

function TimeUnit({ value, label, urgent }: TimeUnitProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={cn(
          "flex aspect-square h-11 w-11 items-center justify-center rounded-xl font-mono text-lg font-bold text-white shadow-card sm:h-16 sm:w-16 sm:text-2xl",
          urgent ? "bg-red-600" : "bg-warka-primary"
        )}
      >
        <span suppressHydrationWarning className="text-lg sm:text-2xl">{pad(value)}</span>
      </div>
      <span className="text-[10px] font-medium uppercase tracking-wide text-warka-text-secondary sm:text-xs">
        {label}
      </span>
    </div>
  );
}

export function CountdownTimer({
  targetDate,
  startDate,
  className,
  onComplete,
}: CountdownTimerProps) {
  const locale = useLocale();
  const targetMs = useMemo(() => toTimestamp(targetDate), [targetDate]);
  const startMs = useMemo(() => {
    if (startDate) return toTimestamp(startDate);
    return targetMs - 30 * 24 * 60 * 60 * 1000;
  }, [startDate, targetMs]);
  const totalDurationMs = Math.max(1, targetMs - startMs);

  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalMs: 0,
  });
  const completedRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    completedRef.current = false;
  }, [targetMs]);

  useEffect(() => {
    if (!mounted) return;

    const tick = () => {
      const next = computeTimeLeft(targetMs);
      setTimeLeft(next);
      if (next.totalMs <= 0 && !completedRef.current) {
        completedRef.current = true;
        onComplete?.();
      }
    };

    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [mounted, targetMs, onComplete]);

  const urgent = mounted && timeLeft.totalMs > 0 && timeLeft.totalMs < 24 * 60 * 60 * 1000;
  const progress = mounted
    ? Math.min(100, Math.max(0, ((totalDurationMs - timeLeft.totalMs) / totalDurationMs) * 100))
    : 0;

  const labels =
    locale === "ar"
      ? { days: "يوم", hours: "ساعة", minutes: "دقيقة", seconds: "ثانية" }
      : { days: "Days", hours: "Hours", minutes: "Mins", seconds: "Secs" };

  return (
    <div className={cn("font-arabic", className)}>
      <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
        <TimeUnit value={timeLeft.days} label={labels.days} urgent={urgent} />
        <TimeUnit value={timeLeft.hours} label={labels.hours} urgent={urgent} />
        <TimeUnit value={timeLeft.minutes} label={labels.minutes} urgent={urgent} />
        <TimeUnit value={timeLeft.seconds} label={labels.seconds} urgent={urgent} />
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-warka-bg sm:mt-4 sm:h-2">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-1000 ease-out",
            urgent ? "bg-red-600" : "bg-warka-primary"
          )}
          style={{ width: `${Math.round(progress)}%` }}
          suppressHydrationWarning
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}
