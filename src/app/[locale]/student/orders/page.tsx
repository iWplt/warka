import { getOrders } from "@/server/actions/orders";
import { StudentOrdersView } from "@/components/features/student/student-orders-view";

export default async function StudentOrdersPage() {
  const orders = await getOrders();
  return <StudentOrdersView orders={orders} />;
}
