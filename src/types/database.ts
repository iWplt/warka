export type UserRole = "admin" | "employee" | "representative" | "student" | "embroidery";

export type OrderType = "individual" | "group";

export type OrderStatus =
  | "new"
  | "pending_review"
  | "designing"
  | "awaiting_approval"
  | "needs_modification"
  | "ready_for_printing"
  | "printing"
  | "printed"
  | "ready_for_delivery"
  | "delivered"
  | "cancelled";

export type ProductType = "sash" | "cap" | "gown" | "suit" | "custom";

export type PaymentMethod = "cash" | "bank_transfer" | "zain_cash";

export type PaymentStatus = "unpaid" | "partial" | "paid";

export type DesignSubmissionStatus =
  | "pending"
  | "approved"
  | "needs_modification"
  | "rejected";

export type BatchStatus = "draft" | "confirmed" | "completed" | "archived";

export type NotificationType =
  | "new_order"
  | "new_group_order"
  | "design_uploaded"
  | "modification_requested"
  | "design_approved"
  | "ready_for_printing"
  | "printing_started"
  | "ready_for_delivery"
  | "payment_received"
  | "production_ready"
  | "general";

export type PermissionKey =
  | "orders:view"
  | "orders:edit"
  | "orders:status"
  | "orders:notes"
  | "design:view"
  | "design:upload"
  | "design:templates"
  | "design:previews"
  | "printing:view"
  | "printing:status"
  | "printing:mark_printed"
  | "delivery:view"
  | "delivery:confirm"
  | "payments:view"
  | "payments:record"
  | "reports:view"
  | "reports:export";

export const ALL_PERMISSIONS: PermissionKey[] = [
  "orders:view",
  "orders:edit",
  "orders:status",
  "orders:notes",
  "design:view",
  "design:upload",
  "design:templates",
  "design:previews",
  "printing:view",
  "printing:status",
  "printing:mark_printed",
  "delivery:view",
  "delivery:confirm",
  "payments:view",
  "payments:record",
  "reports:view",
  "reports:export",
];

export const PERMISSION_GROUPS: Record<string, PermissionKey[]> = {
  orders: ["orders:view", "orders:edit", "orders:status", "orders:notes"],
  design: [
    "design:view",
    "design:upload",
    "design:templates",
    "design:previews",
  ],
  printing: [
    "printing:view",
    "printing:status",
    "printing:mark_printed",
  ],
  delivery: ["delivery:view", "delivery:confirm"],
  payments: ["payments:view", "payments:record"],
  reports: ["reports:view", "reports:export"],
};

export type Profile = {
  id: string;
  role: UserRole;
  full_name: string;
  email: string | null;
  phone: string | null;
  college: string | null;
  department: string | null;
  stage: string | null;
  class_name: string | null;
  graduation_year: number | null;
  access_code: string | null;
  student_id_number: string | null;
  is_active: boolean;
  locale: string;
  created_at: string;
  updated_at: string;
};

export type RepresentativeInviteCode = {
  id: string;
  code: string;
  created_by: string;
  assigned_email: string | null;
  max_uses: number;
  used_count: number;
  used_by: string | null;
  expires_at: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Order = {
  id: string;
  order_number: string;
  type: OrderType;
  status: OrderStatus;
  student_id: string | null;
  representative_id: string | null;
  batch_id: string | null;
  assigned_employee_id: string | null;
  subtotal: number;
  discount: number;
  total: number;
  notes: string | null;
  shop_notes: string | null;
  archived: boolean;
  qr_code_path: string | null;
  design_id: string | null;
  deposit_required: number;
  deposit_paid_at: string | null;
  is_locked: boolean;
  student_modified_at?: string | null;
  student_modified_count?: number;
  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_type: ProductType;
  catalog_product_id: string | null;
  size: string | null;
  sash_color: string | null;
  fabric_type: string | null;
  cap_type: string | null;
  custom_text: string | null;
  special_notes: string | null;
  font_family: string | null;
  logo_url: string | null;
  embroidery_position: string | null;
  embroidery_style: string | null;
  thread_color: string | null;
  back_shape: string | null;
  cap_side_notes: string | null;
  cap_top_notes: string | null;
  embroidery_image_path: string | null;
  cap_side_embroidery_path: string | null;
  cap_top_embroidery_path: string | null;
  batch_locked_fields?: Record<string, string>;
  student_fields?: Record<string, string>;
  template_id: string | null;
  unit_price: number;
  created_at: string;
};

export type Batch = {
  id: string;
  name: string;
  college: string | null;
  department: string | null;
  graduation_year: number | null;
  representative_id: string | null;
  status: BatchStatus;
  notes: string | null;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type BatchStudent = {
  id: string;
  batch_id: string;
  full_name: string;
  phone: string | null;
  size: string | null;
  sash_color: string | null;
  cap_type: string | null;
  fabric_type: string | null;
  font_family: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  custom_text: string | null;
  notes: string | null;
  payment_status: PaymentStatus;
  order_id: string | null;
  student_id: string | null;
  confirmed: boolean;
  created_at: string;
};

export type DesignTemplate = {
  id: string;
  product_type: ProductType;
  name: string;
  preview_url: string | null;
  template_url: string | null;
  template_config: TemplateConfig;
  active: boolean;
  created_at: string;
};

export type TextSlot = {
  id: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  maxWidth: number;
  align: "left" | "center" | "right";
  field: string;
};

export type TemplateConfig = {
  width: number;
  height: number;
  backgroundColor?: string;
  textSlots: TextSlot[];
  logoSlot?: { x: number; y: number; width: number; height: number };
};

export type DesignSubmission = {
  id: string;
  order_id: string;
  template_id: string | null;
  customizations: Record<string, string>;
  preview_url: string | null;
  status: DesignSubmissionStatus;
  modification_notes: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Payment = {
  id: string;
  order_id: string;
  amount: number;
  method: PaymentMethod;
  payment_status: PaymentStatus;
  recorded_by: string | null;
  notes: string | null;
  created_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  read: boolean;
  link: string | null;
  entity_type: string | null;
  entity_id: string | null;
  created_at: string;
};

export type PriceCatalogItem = {
  id: string;
  product_type: ProductType;
  label: string;
  base_price: number;
  size_pricing: Record<string, number>;
  active: boolean;
  created_at: string;
};

export type ProductCategory = {
  id: string;
  slug: string;
  product_type: ProductType;
  name_ar: string;
  name_en: string;
  sort_order: number;
  active: boolean;
  created_at: string;
};

export type ProductColorVariant = {
  key: string;
  label_ar: string;
  label_en: string;
  hex: string;
  images: string[];
  fabric_images?: Record<string, string[]>;
};

export type ProductFabricOption = {
  key: string;
  label_ar: string;
  label_en: string;
  price_adjustment: number;
  description_ar?: string;
  description_en?: string;
  image?: string | null;
};

export type EmbroideryPosition = {
  key: string;
  label_ar: string;
  label_en: string;
  sort_order: number;
  is_active: boolean;
};

export type Product = {
  id: string;
  product_type: ProductType;
  category_id: string | null;
  slug: string | null;
  name_ar: string;
  name_en: string;
  description_ar: string | null;
  description_en: string | null;
  price: number;
  image: string | null;
  image_path: string | null;
  gallery: string[];
  colors: string[];
  color_variants: ProductColorVariant[];
  fabric_options: ProductFabricOption[];
  features: string[];
  embroidery_positions?: EmbroideryPosition[];
  sort_order: number;
  is_featured: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
  category?: ProductCategory | null;
};

export type ProductBundleItem = {
  id: string;
  bundle_id: string;
  product_id: string;
  quantity: number;
  sort_order: number;
  product?: Product | null;
};

export type ProductBundle = {
  id: string;
  slug: string;
  name_ar: string;
  name_en: string;
  description_ar: string | null;
  description_en: string | null;
  image: string | null;
  image_path: string | null;
  discount_percent: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  items?: ProductBundleItem[];
};

export type StudentAddress = {
  id: string;
  student_id: string;
  label: string;
  address_line: string;
  city: string | null;
  governorate: string | null;
  area: string | null;
  phone: string | null;
  college: string | null;
  latitude: number | null;
  longitude: number | null;
  location_url: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type SavedDesign = {
  id: string;
  student_id: string;
  product_id: string | null;
  product_type: ProductType;
  name: string | null;
  design_json: Record<string, unknown>;
  preview_image: string | null;
  preview_path: string | null;
  logo_path: string | null;
  created_at: string;
  updated_at: string;
};

export type CustomRole = {
  id: string;
  name: string;
  permissions: PermissionKey[];
  created_at: string;
};

export type EmployeePermission = {
  id: string;
  employee_id: string;
  permission_key: PermissionKey;
  granted: boolean;
  created_at: string;
};

export type ActivityLogEntry = {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type OrderStatusHistory = {
  id: string;
  order_id: string;
  from_status: OrderStatus | null;
  to_status: OrderStatus;
  changed_by: string | null;
  notes: string | null;
  created_at: string;
};

export type OrderProductionPhoto = {
  id: string;
  order_id: string;
  order_item_id: string | null;
  image_path: string;
  caption: string | null;
  uploaded_by: string | null;
  created_at: string;
};

export type MessageTemplate = {
  id: string;
  event_type: string;
  template_ar: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type NotificationLog = {
  id: string;
  order_id: string | null;
  student_id: string | null;
  channel: string;
  event_type: string;
  message_body: string;
  status: string;
  sent_at: string | null;
  created_at: string;
};
