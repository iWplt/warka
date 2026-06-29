import { getNotifications } from "@/server/actions/notifications";
import { requireAuth } from "@/lib/auth/guards";
import { NotificationsPageView } from "@/components/features/notifications/notifications-page-view";

export default async function NotificationsPage() {
  const profile = await requireAuth();
  const notifications = await getNotifications(profile.id);

  return (
    <NotificationsPageView
      userId={profile.id}
      initialNotifications={notifications}
    />
  );
}
