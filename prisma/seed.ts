import {
  DesignTemplateType,
  OrderStatus,
  OrderType,
  PaymentStatus,
  PrismaClient,
  Role,
} from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();
const SALT_ROUNDS = 12;

const SASH_TEMPLATE_ZONES = {
  nameZone: { x: 150, y: 200, maxWidth: 300, fontSize: 24 },
  departmentZone: { x: 150, y: 240, maxWidth: 300, fontSize: 16 },
  yearZone: { x: 150, y: 270, maxWidth: 200, fontSize: 14 },
  logoZone: { x: 50, y: 50, width: 80, height: 80 },
};

async function hashPassword(plain: string): Promise<string> {
  return hash(plain, SALT_ROUNDS);
}

async function seedUsers() {
  const adminPassword = await hashPassword("Admin@123");
  const repPassword = await hashPassword("Rep@123");
  const studentPassword = await hashPassword("Student@123");

  const admin = await prisma.user.upsert({
    where: { email: "admin@printshop.com" },
    update: {},
    create: {
      name: "مدير المكتبة",
      email: "admin@printshop.com",
      password: adminPassword,
      role: Role.ADMIN,
      phone: "07700000001",
      isActive: true,
    },
  });

  const repUser = await prisma.user.upsert({
    where: { email: "rep@printshop.com" },
    update: {},
    create: {
      name: "ممثل الشعبة",
      email: "rep@printshop.com",
      password: repPassword,
      role: Role.REPRESENTATIVE,
      phone: "07700000002",
      isActive: true,
      representative: {
        create: {
          college: "كلية الهندسة",
          department: "هندسة الحاسوب",
          graduationYear: 2024,
        },
      },
    },
    include: { representative: true },
  });

  const representativeId = repUser.representative!.id;

  const studentData = [
    { name: "أحمد علي", email: "ahmed@student.com" },
    { name: "سارة محمد", email: "sara@student.com" },
    { name: "علي حسن", email: "ali@student.com" },
    { name: "نور إبراهيم", email: "noor@student.com" },
    { name: "يوسف كريم", email: "yousef@student.com" },
  ];

  const students = [];
  for (let i = 0; i < studentData.length; i++) {
    const s = studentData[i];
    const user = await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: {
        name: s.name,
        email: s.email,
        password: studentPassword,
        role: Role.STUDENT,
        phone: "0771000000" + String(i),
        isActive: true,
        student: {
          create: {
            college: "كلية الهندسة",
            department: "هندسة الحاسوب",
            stage: "الرابع",
            className: "أ",
            graduationYear: 2024,
            size: "L",
            sashColor: "ذهبي",
            capType: "كلاسيكي",
            representativeId,
          },
        },
      },
      include: { student: true },
    });
    students.push(user);
  }

  return { admin, repUser, students };
}

async function seedPrices() {
  const prices = [
    { productType: DesignTemplateType.SASH, basePrice: 5000, description: "وشاح تخرج" },
    { productType: DesignTemplateType.CAP, basePrice: 3000, description: "قبعة تخرج" },
    { productType: DesignTemplateType.GOWN, basePrice: 8000, description: "رداء تخرج" },
    { productType: DesignTemplateType.CUSTOM, basePrice: 2000, description: "تصميم مخصص" },
  ];

  for (const price of prices) {
    await prisma.price.upsert({
      where: { productType: price.productType },
      update: { basePrice: price.basePrice, description: price.description },
      create: price,
    });
  }
}

async function seedTemplates() {
  const templates = [
    { name: "وشاح كلاسيكي", type: DesignTemplateType.SASH },
    { name: "وشاح عصري", type: DesignTemplateType.SASH },
    { name: "وشاح فاخر", type: DesignTemplateType.SASH },
    { name: "قبعة أساسية", type: DesignTemplateType.CAP },
    { name: "قبعة مميزة", type: DesignTemplateType.CAP },
  ];

  for (const tpl of templates) {
    const existing = await prisma.designTemplate.findFirst({
      where: { name: tpl.name },
    });
    if (!existing) {
      await prisma.designTemplate.create({
        data: {
          name: tpl.name,
          type: tpl.type,
          templateData: { zones: SASH_TEMPLATE_ZONES },
          isActive: true,
        },
      });
    }
  }
}

async function seedOrders(students: { student: { id: string } | null }[]) {
  const statuses: OrderStatus[] = [
    OrderStatus.NEW_ORDER,
    OrderStatus.WAITING_REVIEW,
    OrderStatus.DESIGNING,
    OrderStatus.READY_FOR_PRINTING,
    OrderStatus.DELIVERED,
  ];

  let seq = 1;
  const year = new Date().getFullYear();

  for (let i = 0; i < students.length; i++) {
    const studentId = students[i].student?.id;
    if (!studentId) continue;

    const orderNumber = `ORD-${year}-${String(seq).padStart(4, "0")}`;
    seq += 1;

    const existing = await prisma.order.findUnique({ where: { orderNumber } });
    if (existing) continue;

    await prisma.order.create({
      data: {
        orderNumber,
        studentId,
        type: OrderType.SASH,
        status: statuses[i % statuses.length],
        paymentStatus: i % 2 === 0 ? PaymentStatus.UNPAID : PaymentStatus.PAID,
        totalPrice: 5000,
        paidAmount: i % 2 === 0 ? 0 : 5000,
        items: {
          create: {
            productType: OrderType.SASH,
            quantity: 1,
            size: "L",
            color: "ذهبي",
            customText: "تخرج 2024",
            price: 5000,
          },
        },
        statusHistory: {
          create: {
            fromStatus: null,
            toStatus: statuses[i % statuses.length],
            note: "Seed order",
          },
        },
      },
    });
  }
}

async function main() {
  console.log("Seeding database...");
  const { students } = await seedUsers();
  await seedPrices();
  await seedTemplates();
  await seedOrders(students);
  console.log("Seed completed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
