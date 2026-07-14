"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Bell, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/server/actions/notifications";
import type { Notification, NotificationType, OrderStatus } from "@/types/database";
import { Link } from "@/i18n/routing";

const POLL_INTERVAL_MS = 30_000;

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

const ORDER_STATUSES: OrderStatus[] = [
  "new",
  "pending_review",
  "designing",
  "awaiting_approval",
  "needs_modification",
  "ready_for_printing",
  "printing",
  "printed",
  "ready_for_delivery",
  "delivered",
  "cancelled",
];

type NotificationBellProps = {
  userId: string;
};

export function NotificationBell({ userId }: NotificationBellProps) {
  const t = useTranslations("notifications");
  const statusT = useTranslations("orderStatus");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [now, setNow] = useState(() => Date.now());

  const loadNotifications = useCallback(async () => {
    try {
      const data = await getNotifications(userId);
      setNotifications(data);
    } catch {
      setNotifications([]);
    }
  }, [userId]);

  useEffect(() => {
    const startPoll = () => {
      void loadNotifications();
    };
    const timeout = window.setTimeout(startPoll, 0);
    const interval = window.setInterval(startPoll, POLL_INTERVAL_MS);
    const clock = window.setInterval(() => setNow(Date.now()), 60_000);

    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
      window.clearInterval(clock);
    };
  }, [loadNotifications]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const toggleOpen = () => {
    setOpen((prev) => {
      const next = !prev;
      if (next) void loadNotifications();
      return next;
    });
  };

  const unread = notifications.filter((n) => !n.read).length;

  const handleRead = async (id: string) => {
    await markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAll = async () => {
    await markAllNotificationsRead(userId);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

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

  const bodyFor = (notification: Notification) => {
    if (!notification.body) return null;
    if (ORDER_STATUSES.includes(notification.body as OrderStatus)) {
      return statusT(notification.body as OrderStatus);
    }
    return notification.body;
  };

  return (
    <div className="relative">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={toggleOpen}
        aria-label={t("title")}
        aria-expanded={open}
      >
        <Bell className="size-5" />
        {unread > 0 && (
          <span className="absolute -end-1 -top-1 flex size-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </Button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/20 sm:bg-transparent"
            onClick={() => setOpen(false)}
            aria-label={t("close")}
          />
          <div
            className={
              "fixed inset-x-3 top-[4.5rem] z-50 max-h-[min(70dvh,28rem)] overflow-hidden rounded-2xl border border-border bg-card shadow-tint-lg sm:absolute sm:inset-x-auto sm:end-0 sm:top-full sm:mt-2 sm:w-80 sm:max-h-80"
            }
          >
            <div className="flex items-center justify-between gap-2 border-b border-border p-3">
              <span className="font-semibold">{t("title")}</span>
              {unread > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAll}
                  className="shrink-0 text-xs text-primary hover:underline"
                >
                  {t("markAllRead")}
                </button>
              )}
            </div>
            <div className="max-h-[min(calc(70dvh-3.5rem),24rem)] overflow-y-auto sm:max-h-[calc(20rem-3.25rem)]">
              {notifications.length === 0 ? (
                <p className="p-4 text-center text-sm text-muted-foreground">
                  {t("noNotifications")}
                </p>
              ) : (
                notifications.map((notification) => {
                  const body = bodyFor(notification);
                  return (
                    <div
                      key={notification.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        if (!notification.read) void handleRead(notification.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !notification.read) {
                          void handleRead(notification.id);
                        }
                      }}
                      className={`border-b border-glass-border p-3 text-sm last:border-0 ${
                        !notification.read ? "bg-primary/5" : ""
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <Package className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{labelFor(notification)}</p>
                          {body && (
                            <p className="mt-1 line-clamp-2 text-muted-foreground">{body}</p>
                          )}
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatTime(notification.created_at)}
                          </p>
                          {notification.link && (
                            <Link
                              href={notification.link}
                              onClick={() => handleRead(notification.id)}
                              className="mt-1 inline-block text-xs text-primary hover:underline"
                            >
                              {t("view")}
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
