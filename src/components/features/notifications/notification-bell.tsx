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
import type { Notification, NotificationType } from "@/types/database";
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

type NotificationBellProps = {
  userId: string;
};

export function NotificationBell({ userId }: NotificationBellProps) {
  const t = useTranslations("notifications");
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
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-label={t("close")}
          />
          <div className="absolute end-0 top-full z-50 mt-2 w-80 rounded-2xl border border-border bg-card shadow-tint-lg">
            <div className="flex items-center justify-between border-b border-border p-3">
              <span className="font-semibold">{t("title")}</span>
              {unread > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAll}
                  className="text-xs text-primary hover:underline"
                >
                  {t("markAllRead")}
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="p-4 text-center text-sm text-muted-foreground">
                  {t("noNotifications")}
                </p>
              ) : (
                notifications.map((notification) => (
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
                        {notification.body && (
                          <p className="mt-1 line-clamp-2 text-muted-foreground">
                            {notification.body}
                          </p>
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
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
