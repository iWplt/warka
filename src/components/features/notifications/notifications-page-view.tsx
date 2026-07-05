"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Link } from "@/i18n/routing";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { WarkaCard } from "@/components/ui/warka-card";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/server/actions/notifications";
import { NotificationIcon } from "@/components/features/notifications/notification-icon";
import type { Notification, NotificationType } from "@/types/database";

const NOTIFICATION_TYPES: NotificationType[] = [
  "new_order",
  "new_group_order",
  "design_uploaded",
  "modification_requested",
  "design_approved",
  "ready_for_printing",
  "printing_started",
  "ready_for_delivery",
  "payment_received",
  "production_ready",
  "general",
];

type NotificationsPageViewProps = {
  userId: string;
  initialNotifications: Notification[];
};

export function NotificationsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-warka-border bg-card p-5 shadow-card"
        >
          <div className="flex gap-3">
            <Skeleton className="size-10 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function NotificationsPageView({
  userId,
  initialNotifications,
}: NotificationsPageViewProps) {
  const t = useTranslations("notifications");
  const locale = useLocale();
  const router = useRouter();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [syncedInitial, setSyncedInitial] = useState(initialNotifications);
  const [now, setNow] = useState(() => Date.now());
  const [isRefreshing, startRefresh] = useTransition();
  const [isPending, startTransition] = useTransition();

  if (initialNotifications !== syncedInitial) {
    setSyncedInitial(initialNotifications);
    setNotifications(initialNotifications);
  }

  useEffect(() => {
    const clock = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(clock);
  }, []);

  const unread = notifications.filter((n) => !n.read).length;

  const refresh = useCallback(() => {
    startRefresh(async () => {
      try {
        const data = await getNotifications(userId);
        setNotifications(data);
      } catch {
        toast.error(t("error"));
      }
    });
  }, [userId, t]);

  const formatTime = (date: string) => {
    const diff = now - new Date(date).getTime();
    const minutes = Math.floor(diff / 60_000);
    if (minutes < 1) return t("justNow");
    if (minutes < 60) return t("minutesAgo", { count: minutes });
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return t("hoursAgo", { count: hours });
    return new Date(date).toLocaleDateString(locale);
  };

  const labelFor = (notification: Notification) => {
    if (NOTIFICATION_TYPES.includes(notification.type)) {
      return t(notification.type);
    }
    return notification.title;
  };

  const handleRead = (id: string) => {
    startTransition(async () => {
      try {
        await markNotificationRead(id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
      } catch {
        toast.error(t("error"));
      }
    });
  };

  const handleMarkAll = () => {
    startTransition(async () => {
      try {
        await markAllNotificationsRead(userId);
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        router.refresh();
      } catch {
        toast.error(t("error"));
      }
    });
  };

  if (isRefreshing && notifications.length === 0) {
    return <NotificationsSkeleton />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-warka-text">{t("title")}</h1>
          {unread > 0 && (
            <p className="mt-1 text-sm text-warka-text-secondary">
              {t("unreadCount", { count: unread })}
            </p>
          )}
        </div>
        {unread > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleMarkAll}
            disabled={isPending}
            className="rounded-xl border-warka-border"
          >
            {t("markAllRead")}
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <WarkaCard className="py-16 text-center">
          <p className="text-warka-text-secondary">{t("noNotifications")}</p>
        </WarkaCard>
      ) : (
        <ul className="space-y-3">
          {notifications.map((notification) => (
            <li key={notification.id}>
              <WarkaCard
                className={`transition-colors ${
                  !notification.read ? "border-warka-primary/30 bg-warka-primary/5" : ""
                }`}
              >
                <div className="flex gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-warka-bg">
                    <NotificationIcon type={notification.type} className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-warka-text">
                        {labelFor(notification)}
                      </p>
                      {!notification.read && (
                        <span className="size-2 shrink-0 rounded-full bg-warka-primary" />
                      )}
                    </div>
                    {notification.body && (
                      <p className="mt-1 text-sm text-warka-text-secondary">
                        {notification.body}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-warka-text-secondary">
                      {formatTime(notification.created_at)}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {notification.link && (
                        <Link
                          href={notification.link}
                          onClick={() => {
                            if (!notification.read) handleRead(notification.id);
                          }}
                          className="text-sm font-medium text-warka-primary hover:underline"
                        >
                          {t("view")}
                        </Link>
                      )}
                      {!notification.read && (
                        <button
                          type="button"
                          onClick={() => handleRead(notification.id)}
                          disabled={isPending}
                          className="text-sm text-warka-text-secondary hover:text-warka-text"
                        >
                          {t("markRead")}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </WarkaCard>
            </li>
          ))}
        </ul>
      )}

      <div className="flex justify-center pt-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={refresh}
          disabled={isRefreshing}
          className="text-warka-text-secondary"
        >
          {isRefreshing ? t("loading") : t("refresh")}
        </Button>
      </div>
    </div>
  );
}
