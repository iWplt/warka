import { getMyAddresses } from "@/server/actions/addresses";
import { AddressesManager } from "@/components/features/student/addresses-manager";

export default async function StudentAddressesPage() {
  const addresses = await getMyAddresses();

  return <AddressesManager addresses={addresses} />;
}
