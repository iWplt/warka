import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/errors/api-error";
import type { OrderStatus, Prisma } from "@prisma/client";
import type { CreateOrderInput } from "@/lib/validations/order.schema";

const ORDER_PREFIX = "ORD";

/**
 * Generates a unique order number: ORD-YYYY-XXXX.
 */
export async function generateOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `${ORDER_PREFIX}-${year}-`;

  const latest = await prisma.order.findFirst({
    where: { orderNumber: { startsWith: prefix } },
    orderBy: { orderNumber: "desc" },
    select: { orderNumber: true },
  });

  const nextSeq = latest
    ? Number.parseInt(latest.orderNumber.split("-").pop() ?? "0", 10) + 1
    : 1;

  return `${prefix}${String(nextSeq).padStart(4, "0")}`;
}

export type OrderWithItems = Prisma.OrderGetPayload<{
  include: { items: true; student: { include: { user: true } } };
}>;

/**
 * Creates an order with line items in a single transaction.
 */
export async function createOrder(
  input: CreateOrderInput
): Promise<OrderWithItems> {
  try {
    const totalPrice = input.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    return await prisma.$transaction(async (tx) => {
      const orderNumber = await generateOrderNumber();

      const order = await tx.order.create({
        data: {
          orderNumber,
          type: input.type,
          studentId: input.studentId,
          representativeId: input.representativeId,
          notes: input.notes,
          totalPrice,
          items: {
            create: input.items.map((item) => ({
              productType: item.productType,
              quantity: item.quantity,
              size: item.size,
              color: item.color,
              customText: item.customText,
              logoUrl: item.logoUrl,
              designTemplateId: item.designTemplateId,
              price: item.price,
            })),
          },
          statusHistory: {
            create: {
              fromStatus: null,
              toStatus: "NEW_ORDER",
              note: "Order created",
            },
          },
        },
        include: {
          items: true,
          student: { include: { user: true } },
        },
      });

      return order;
    });
  } catch {
    throw new ApiError("Failed to create order", 500, "ORDER_CREATE_FAILED");
  }
}

/**
 * Updates order status and appends history record.
 */
export async function updateOrderStatus(
  orderId: string,
  toStatus: OrderStatus,
  changedById: string,
  note?: string
) {
  try {
    return await prisma.$transaction(async (tx) => {
      const current = await tx.order.findUnique({ where: { id: orderId } });
      if (!current) {
        throw new ApiError("Order not found", 404, "ORDER_NOT_FOUND");
      }

      const updated = await tx.order.update({
        where: { id: orderId },
        data: { status: toStatus },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          fromStatus: current.status,
          toStatus,
          changedBy: changedById,
          note,
        },
      });

      return updated;
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      "Failed to update order status",
      500,
      "ORDER_STATUS_FAILED"
    );
  }
}
