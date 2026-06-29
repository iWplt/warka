import { listRepInviteCodes } from "@/server/actions/invites";
import { RepInvitesManager } from "@/components/features/admin/rep-invites-manager";

export default async function AdminInvitesPage() {
  const invites = await listRepInviteCodes();
  return <RepInvitesManager invites={invites} />;
}
