import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  int,
  bigint,
  json,
  boolean,
  decimal,

} from "drizzle-orm/mysql-core";

// Users table - extended for local auth + OAuth
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).unique(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["admin", "employee", "representative", "student"]).default("student").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Student profiles
export const studentProfiles = mysqlTable("studentProfiles", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  college: varchar("college", { length: 255 }),
  department: varchar("department", { length: 255 }),
  graduationYear: int("graduationYear"),
  size: varchar("size", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

// Products
export const products = mysqlTable("products", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  nameAr: varchar("nameAr", { length: 255 }).notNull(),
  nameEn: varchar("nameEn", { length: 255 }).notNull(),
  descriptionAr: text("descriptionAr"),
  descriptionEn: text("descriptionEn"),
  image: text("image"),
  icon: varchar("icon", { length: 50 }),
  sortOrder: int("sortOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

// Price catalog
export const priceCatalog = mysqlTable("priceCatalog", {
  id: serial("id").primaryKey(),
  productId: bigint("productId", { mode: "number", unsigned: true }).notNull(),
  variantNameAr: varchar("variantNameAr", { length: 255 }),
  variantNameEn: varchar("variantNameEn", { length: 255 }),
  price: decimal("price", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).default("IQD").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

// Design templates
export const designTemplates = mysqlTable("designTemplates", {
  id: serial("id").primaryKey(),
  nameAr: varchar("nameAr", { length: 255 }).notNull(),
  nameEn: varchar("nameEn", { length: 255 }).notNull(),
  productId: bigint("productId", { mode: "number", unsigned: true }).notNull(),
  type: mysqlEnum("type", ["sash", "cap", "gown", "custom"]).notNull(),
  thumbnail: text("thumbnail"),
  config: json("config").$type<Record<string, unknown>>(),
  textAreas: json("textAreas").$type<Array<{ key: string; labelAr: string; labelEn: string; x: number; y: number; fontSize: number; color: string }>>(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

// Batches (for representatives)
export const batches = mysqlTable("batches", {
  id: serial("id").primaryKey(),
  representativeId: bigint("representativeId", { mode: "number", unsigned: true }).notNull(),
  nameAr: varchar("nameAr", { length: 255 }).notNull(),
  nameEn: varchar("nameEn", { length: 255 }),
  college: varchar("college", { length: 255 }),
  department: varchar("department", { length: 255 }),
  graduationYear: int("graduationYear"),
  status: mysqlEnum("status", ["draft", "confirmed", "completed", "archived"]).default("draft").notNull(),
  studentCount: int("studentCount").default(0).notNull(),
  confirmedCount: int("confirmedCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

// Batch students
export const batchStudents = mysqlTable("batchStudents", {
  id: serial("id").primaryKey(),
  batchId: bigint("batchId", { mode: "number", unsigned: true }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  studentId: varchar("studentId", { length: 100 }),
  size: varchar("size", { length: 50 }),
  isConfirmed: boolean("isConfirmed").default(false).notNull(),
  userId: bigint("userId", { mode: "number", unsigned: true }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

// Orders
export const orders = mysqlTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: varchar("orderNumber", { length: 50 }).notNull().unique(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  batchId: bigint("batchId", { mode: "number", unsigned: true }),
  representativeId: bigint("representativeId", { mode: "number", unsigned: true }),
  type: mysqlEnum("type", ["individual", "group"]).default("individual").notNull(),
  status: mysqlEnum("status", [
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
    "cancelled"
  ]).default("new").notNull(),
  simplifiedStatus: mysqlEnum("simplifiedStatus", [
    "pending",
    "design_review",
    "approved",
    "printing",
    "ready",
    "delivered"
  ]).default("pending").notNull(),
  paymentStatus: mysqlEnum("paymentStatus", ["unpaid", "partial", "paid"]).default("unpaid").notNull(),
  totalAmount: decimal("totalAmount", { precision: 12, scale: 2 }).notNull(),
  paidAmount: decimal("paidAmount", { precision: 12, scale: 2 }).default("0").notNull(),
  currency: varchar("currency", { length: 10 }).default("IQD").notNull(),
  notes: text("notes"),
  logoUrl: text("logoUrl"),
  assignedTo: bigint("assignedTo", { mode: "number", unsigned: true }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

// Order items
export const orderItems = mysqlTable("orderItems", {
  id: serial("id").primaryKey(),
  orderId: bigint("orderId", { mode: "number", unsigned: true }).notNull(),
  productId: bigint("productId", { mode: "number", unsigned: true }).notNull(),
  priceId: bigint("priceId", { mode: "number", unsigned: true }).notNull(),
  quantity: int("quantity").default(1).notNull(),
  unitPrice: decimal("unitPrice", { precision: 12, scale: 2 }).notNull(),
  totalPrice: decimal("totalPrice", { precision: 12, scale: 2 }).notNull(),
  variantDetails: json("variantDetails").$type<Record<string, string>>(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Order timeline / activity log
export const orderTimeline = mysqlTable("orderTimeline", {
  id: serial("id").primaryKey(),
  orderId: bigint("orderId", { mode: "number", unsigned: true }).notNull(),
  status: varchar("status", { length: 100 }).notNull(),
  statusLabelAr: varchar("statusLabelAr", { length: 255 }).notNull(),
  statusLabelEn: varchar("statusLabelEn", { length: 255 }),
  notes: text("notes"),
  createdBy: bigint("createdBy", { mode: "number", unsigned: true }),
  createdByName: varchar("createdByName", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Payments
export const payments = mysqlTable("payments", {
  id: serial("id").primaryKey(),
  orderId: bigint("orderId", { mode: "number", unsigned: true }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  method: mysqlEnum("method", ["cash", "bank_transfer", "zain_cash"]).notNull(),
  reference: varchar("reference", { length: 255 }),
  notes: text("notes"),
  recordedBy: bigint("recordedBy", { mode: "number", unsigned: true }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Notifications
export const notifications = mysqlTable("notifications", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  type: mysqlEnum("type", [
    "order_created",
    "order_updated",
    "design_uploaded",
    "design_approved",
    "design_modification",
    "ready_for_printing",
    "printing_started",
    "ready_for_delivery",
    "payment_received",
    "general"
  ]).notNull(),
  titleAr: varchar("titleAr", { length: 255 }).notNull(),
  titleEn: varchar("titleEn", { length: 255 }),
  messageAr: text("messageAr"),
  messageEn: text("messageEn"),
  link: varchar("link", { length: 500 }),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Employee permissions
export const employeePermissions = mysqlTable("employeePermissions", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  permissionKey: varchar("permissionKey", { length: 100 }).notNull(),
  canView: boolean("canView").default(false).notNull(),
  canEdit: boolean("canEdit").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

// Design approvals
export const designApprovals = mysqlTable("designApprovals", {
  id: serial("id").primaryKey(),
  orderId: bigint("orderId", { mode: "number", unsigned: true }).notNull(),
  previewUrl: text("previewUrl").notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected", "modified"]).default("pending").notNull(),
  feedback: text("feedback"),
  respondedBy: bigint("respondedBy", { mode: "number", unsigned: true }),
  respondedAt: timestamp("respondedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Site settings
export const siteSettings = mysqlTable("siteSettings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value"),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});
