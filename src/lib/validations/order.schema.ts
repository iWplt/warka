import { z } from "zod";
import { OrderStatus, OrderType, PaymentMethod } from "@prisma/client";

export const createOrderItemSchema = z.object({
  productType: z.nativeEnum(OrderType),
  quantity: z.number().int().min(1).default(1),
  size: z.string().optional(),
  color: z.string().optional(),
  customText: z.string().optional(),
  logoUrl: z.string().url().optional(),
  designTemplateId: z.string().cuid().optional(),
  price: z.number().min(0),
});

export const createOrderSchema = z.object({
  type: z.nativeEnum(OrderType),
  studentId: z.string().cuid().optional(),
  representativeId: z.string().cuid().optional(),
  notes: z.string().optional(),
  items: z.array(createOrderItemSchema).min(1),
});

export const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  note: z.string().optional(),
});

export const recordPaymentSchema = z.object({
  orderId: z.string().cuid(),
  amount: z.number().positive(),
  method: z.nativeEnum(PaymentMethod),
  note: z.string().optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
