# WARKA - Graduation Products E-Commerce Website

## Overview
Redesign my website to be a 100% pixel-perfect replica of the WARKA graduation products e-commerce store. WARKA (ورقة) is a Saudi Arabic RTL e-commerce platform for graduation items (sashes, gowns, caps) with custom printing. The design uses a dark olive/khaki green primary color with cream/off-white backgrounds. Every detail matters — spacing, colors, fonts, shadows, icons, and layout structure must match exactly.

---

## Brand Identity

| Element | Value |
|---------|-------|
| Brand Name | WARKA (ورقة) |
| Tagline | متجر طباعة التخرج (Graduation Printing Store) |
| Primary Color | Dark olive/khaki green: `#5B5B45` or `#6B6B50` (use exact: `#5C5C47`) |
| Primary Hover | Slightly darker: `#4A4A38` |
| Background Primary | Off-white/cream: `#F8F7F4` |
| Background Card | White: `#FFFFFF` |
| Text Primary | Dark charcoal: `#2C2C2C` |
| Text Secondary | Medium gray: `#6B6B6B` |
| Text Muted | Light gray: `#9E9E9E` |
| Border Color | Light beige/gray: `#E8E6E1` |
| Success Green | `#4CAF50` |
| Warning/Status | `#FF9800` |
| Sidebar Dark | Dark olive: `#4A4A38` |
| Font Family | "Tajawal" or "Cairo" (Arabic-friendly Google Fonts) |
| Border Radius | Cards: `12px`, Buttons: `8px`, Small elements: `6px` |
| Shadows | `0 2px 12px rgba(0,0,0,0.06)` for cards |
| Layout Direction | RTL (Right-to-Left) |

---

## Global Design System

### Typography
- **Font**: Import "Tajawal" from Google Fonts (weights: 300, 400, 500, 700, 800, 900)
- **Headline (Hero)**: 36px, font-weight: 800, color: `#2C2C2C`, line-height: 1.4
- **Section Titles**: 24px, font-weight: 700, color: `#2C2C2C`
- **Card Titles**: 16px, font-weight: 600, color: `#2C2C2C`
- **Body Text**: 14px, font-weight: 400, color: `#6B6B6B`, line-height: 1.6
- **Small/Caption**: 12px, font-weight: 400, color: `#9E9E9E`
- **Button Text**: 14px, font-weight: 600
- **Price**: 16px, font-weight: 700, color: `#2C2C2C`

### Spacing System
- **Container max-width**: 1280px, centered
- **Section padding**: 60px vertical, 24px horizontal
- **Card padding**: 20px
- **Card gap**: 20px
- **Button padding**: 12px 32px
- **Icon sizes**: Small: 20px, Medium: 24px, Large: 48px

### Components

#### Primary Button (Solid)
```
background: #5C5C47
color: #FFFFFF
border: none
border-radius: 8px
padding: 12px 32px
font-size: 14px
font-weight: 600
cursor: pointer
transition: background 0.2s
hover: background #4A4A38
```

#### Secondary Button (Outline)
```
background: transparent
color: #5C5C47
border: 1.5px solid #5C5C47
border-radius: 8px
padding: 10px 24px
font-size: 14px
font-weight: 600
```

#### Product Card
```
background: #FFFFFF
border-radius: 12px
padding: 16px
box-shadow: 0 2px 12px rgba(0,0,0,0.06)
transition: transform 0.2s, box-shadow 0.2s
hover: transform translateY(-4px), box-shadow 0 8px 24px rgba(0,0,0,0.10)
- Image container: aspect-ratio 1/1, background #F5F4F0, border-radius 10px, overflow hidden
- Product name: 14px, font-weight 600, color #2C2C2C, margin-top 12px
- Price: 14px, font-weight 700, color #2C2C2C, margin-top 4px
- Button: full width, margin-top 12px, Primary Button style
```

#### Input Field
```
background: #FFFFFF
border: 1.5px solid #E8E6E1
border-radius: 8px
padding: 12px 16px
font-size: 14px
color: #2C2C2C
placeholder-color: #9E9E9E
focus: border-color #5C5C47, outline none
```

#### Feature Icon Box
```
width: 48px
height: 48px
border-radius: 50%
background: #F0EFEA
display: flex
align-items: center
justify-content: center
```

---

## Page 1: Homepage (الصفحة الرئيسية)

### 1.1 Navbar (Sticky)
- **Height**: 64px
- **Background**: `#FFFFFF` with subtle bottom border `1px solid #F0EFEA`
- **Layout** (RTL): Logo (left) → Navigation Links (center) → Icons (right)
- **Logo**: Circular geometric pattern icon + "WARKA" in bold serif-like font + "متجر طباعة التخرج" in small text below
- **Nav Links**: الرئيسية | المنتجات | الطلبات | من نحن | تواصل معنا — 14px, font-weight 500, color `#6B6B6B`, hover: `#2C2C2C`
- **Right Icons**: Search icon (magnifier), Cart icon with badge (top-right red dot/count), User profile icon — 24px, color `#2C2C2C`

### 1.2 Hero Section
- **Background**: Off-white `#F8F7F4` with a subtle plant/leaf shadow decoration on the far left side (semi-transparent botanical element)
- **Layout**: Two columns (RTL) — Text right (60%), Image left (40%)
- **Left Column (Image)**: Large product photo showing a black graduation gown/keffiyeh with gold "2025" and botanical embroidery, a black graduation cap, on a cream fabric background. The WARKA circular logo badge is visible on the garment. The image bleeds slightly off the left edge.
- **Right Column (Text)**:
  - Headline: "جودة تليق بيوم تخرجك" — 36px, font-weight 800, color `#2C2C2C`
  - Subheadline: "وشاح، روب، قبعة تخرج بتصميم أنيق وجودة عالية" — 16px, font-weight 400, color `#6B6B6B`, margin-top 12px
  - CTA Button: "تسوق الآن" — Primary Button style, margin-top 24px

### 1.3 Features Bar
- **Background**: `#FFFFFF`
- **Layout**: 4-column grid, centered, with subtle top/bottom border
- **Padding**: 24px vertical
- **Feature Items** (each column):
  1. **جودة عالية** — Icon: quality badge/medal icon | Sub: أفضل الخامات
  2. **تصميم أنيق** — Icon: palette/pen icon | Sub: تفاصيل مميزة
  3. **توصيل سريع** — Icon: truck/delivery icon | Sub: لباب بيتك
  4. **دعم متواصل** — Icon: headset/support icon | Sub: خدمة عملاء 24/7
- Each feature: Icon (48px in `#F0EFEA` circle) + Title (14px, font-weight 600) + Subtitle (12px, color `#9E9E9E`)

### 1.4 Products Section (تسوق المنتجات)
- **Background**: `#F8F7F4`
- **Section Title**: "تسوق المنتجات" — 24px, font-weight 700, centered, with decorative small line/icon above
- **Layout**: 4-column grid of Product Cards
- **Products**:
  1. وشاح تخرج — starts from 75 ريال — [Black sash with gold embroidery]
  2. روب تخرج — starts from 145 ريال — [Black graduation gown]
  3. قبعة تخرج — starts from 45 ريال — [Black graduation cap]
  4. تصميم مخصص — Order custom design — [Icon showing pen/design tool]

### 1.5 How It Works (كيف نعمل)
- **Background**: `#FFFFFF`
- **Section Title**: "كيف نعمل" — 24px, font-weight 700, centered
- **Layout**: 4-column horizontal steps with connecting line between them
- **Steps**:
  1. **(1) اطلب منتجك** — Sub: اختر منتجك وسيغن مخصصك — Circle with number
  2. **(2) أرسل شعارك** — Sub: ارفع شعارك أو نصممك — Circle with number
  3. **(3) نقوم بالطباعة** — Sub: أحدث تقنيات الطباعة — Circle with number
  4. **(4) نصلك الطلب** — Sub: نوصلك سريع ونضمن الجودة — Circle with number
- Each step: Number circle (32px, border `2px solid #5C5C47`, color `#5C5C47`, font-weight 700) + Title (14px, font-weight 600) + Subtitle (12px, color `#9E9E9E`)
- Steps connected by a thin dotted line between circles

### 1.6 Footer
- **Background**: `#2C2C2C` (dark)
- **Text color**: `#FFFFFF`
- **Layout**: Multi-column with logo, links, contact info
- **Bottom bar**: Copyright text, small, color `#9E9E9E`

---

## Page 2: Products Listing (صفحة المنتجات)

### 2.1 Header
- Same Navbar as homepage
- **Breadcrumb**: الرئيسية / المنتجات — small text below navbar, color `#9E9E9E`
- **Page Title**: "المنتجات" — 28px, font-weight 700, centered

### 2.2 Filter Tabs
- **Layout**: Centered horizontal tabs
- **Tabs**: الكل | وشاح | روب | قبعة | مخصص
- **Active tab**: Solid `#5C5C47` background, white text, border-radius 20px, padding 8px 20px
- **Inactive tab**: Transparent background, `#6B6B6B` text, border `1px solid #E8E6E1`, border-radius 20px

### 2.3 Product Grid
- **Layout**: 3-column grid
- **Gap**: 24px
- **Product Cards** (larger than homepage):
  1. وشاح تخرج — 75 ريال — [Black sash with gold 2025]
  2. روب تخرج — 145 ريال — [Black gown]
  3. قبعة تخرج — 45 ريال — [Black cap]
  4. وشاح تخرج فاخر — 95 ريال — [Premium black sash]
  5. روب تخرج فاخر — 185 ريال — [Premium gown]
  6. تصميم مخصص — اطلب تصميم خاص بك — [Design tool icon with dashed border]
- Each card: Image (aspect 4:3, background `#F5F4F0`) + Name + Price + "تسوق الآن" button

---

## Page 3: Product Detail (صفحة المنتج)

### 3.1 Breadcrumb
- الرئيسية / المنتجات / وشاح تخرج فاخر

### 3.2 Product Layout (2 columns)

#### Left Column (Images)
- **Main Image**: Large square, white background, product centered — [Black graduation sash with gold botanical embroidery and "2025"]
- **Thumbnail Gallery**: Row of 4 small square thumbnails below main image, the first one highlighted with a border
- **Thumbnail Style**: 60x60px, border-radius 8px, border `2px solid transparent`, active has border `#5C5C47`

#### Right Column (Details)
- **Product Name**: "وشاح تخرج فاخر" — 24px, font-weight 700
- **Price**: "95 ريال" — 22px, font-weight 700
- **Rating**: Star rating display (4.8) + "(120)" reviews count
- **Description**: "وشاح تخرج فاخر بتصميم أنيق وخيوط ذهبية عالية الجودة" with bullet points:
  - خامة فاخرة
  - تطريز دقيق
  - تصميم أنيق
  - مناسب لجميع الجامعات
- **Color Options**: 
  - Label: "اللون: أسود"
  - Color swatches: 4 small circles (black, beige, olive green, cream) — 28px diameter, selected has border
- **Quantity Selector**:
  - Label: "الكمية"
  - Minus button (-) | Number input (default 1) | Plus button (+)
  - Bordered container, buttons have hover effect
- **Add to Cart Button**: "أضف إلى السلة" — Full width, Primary Button style, large (padding 14px)
- **Action Links Row**: 
  - "حفظ للمفضلة" with heart icon
  - "مشاركة المنتج" with share icon
- **Similar Products Section Below**:
  - Title: "اختر المنتج" 
  - Horizontal row of 2-3 small product cards

---

## Page 4: Shopping Cart (سلة التسوق)

### 4.1 Page Title
- "سلة التسوق" — 24px, font-weight 700

### 4.2 Layout (2 columns)

#### Left Column: Cart Items
- **Cart Item Row** (each product):
  - Product image (small square, 80x80)
  - Product name + variant details (اللون: أسود, الكمية: 2)
  - Quantity controls (- / number / +)
  - Unit price
  - Remove button (X icon)
  - Subtotal for item
- **Products shown**:
  - وشاح تخرج فاخر — أسود — ×2 — 65 ريال — 130 ريال
  - قبعة تخرج — أسود — ×1 — 45 ريال — 45 ريال  
  - روب تخرج — أسود — ×1 — 145 ريال — 145 ريال

#### Right Column: Order Summary
- **Summary Card** (white background, border-radius 12px, shadow):
  - Title: "ملخص الطلب"
  - **المجموع الفرعي**: 380 ريال
  - **الشحن**: 25 ريال
  - **الإجمالي**: 405 ريال (in bold, larger)
  - **Divider line**
  - "إتمام الطلب" button — Primary Button, full width, large

---

## Page 5: Checkout Flow (إنشاء طلب جديد)

### 5.1 Step Indicator (Progress Bar)
- **5 steps** shown as numbered circles connected by lines:
  - 1: المنتج ✓ (completed, filled green)
  - 2: الملاحظات ✓ (completed, filled green)
  - 3: الشعار (current/active, filled green, larger)
  - 4: الكمية (pending, empty circle)
  - 5: تأكيد الطلب (pending, empty circle)
- **Completed step**: `#4CAF50` fill, white checkmark
- **Current step**: `#5C5C47` fill, white number
- **Pending step**: White fill, `#9E9E9E` border and text

### 5.2 Step 3: Upload Logo (رفع الشعار الاختياري)
- **Title**: "رفع الشعار (اختياري)"
- **Upload Area**: Dashed border box (`2px dashed #E8E6E1`), border-radius 12px, centered content:
  - Upload cloud icon (large, color `#9E9E9E`)
  - "اضغط لرفع الشعار أو اسحب وأفلت"
  - Supported formats text: "اللواح المدعومة: PNG, JPG, SVG | الحد الأقصى 5MB"
  - Small preview area below
- **Action Buttons**: 
  - "رجوع" — Secondary/ghost button
  - "التالي" — Primary Button

### 5.3 Order Summary Sidebar (right side)
- Mini summary with product thumbnails and prices
- Totals calculation

---

## Page 6: My Orders (طلباتي)

### 6.1 Layout
- Sidebar navigation (left) + Main content (right)

### 6.2 Sidebar Navigation
- **Background**: `#FFFFFF`
- **Width**: 280px
- **Logo at top**: Same as navbar logo
- **Nav Items**:
  - لوحة التحكم (inactive)
  - المنتجات (inactive)
  - الطلبات (active, with left border indicator `#5C5C47`)
  - العملاء (inactive)
  - التقارير (inactive)
  - الإشعارات (inactive)
  - الإعدادات (inactive)
- Each item: Icon + Label, 14px, padding 12px 16px
- Active item: Background `#F0EFEA`, left border 3px `#5C5C47`, font-weight 600
- **Bottom**: User profile mini card (avatar + name "أحمد محمد" + role "طالب")

### 6.3 Orders Content (for admin/customer view)
- **Tabs**: الكل | قيد المراجعة | قيد الطباعة | قيد التسليم | تم التسليم
- **Active tab**: Same style as product filter tabs
- **Orders Table/List**:
  | # | الطلب | الحالة | التاريخ | رقم الطلب |  |
  |---|---|---|---|---|---|
  | #1025 | أحمد محمد | قيد المراجعة | 2025 مايو 20 | 1025 | [actions] |
  | #1024 | سارة علي | قيد الطباعة | 2025 مايو 18 | 1024 | [actions] |
  | #1023 | محمد خالد | جاهز للاستلام | 2025 مايو 15 | 1023 | [actions] |
  | #1022 | نورة فيصل | تم التسليم | 2025 مايو 12 | 1022 | [actions] |
- Status badges: Colored pills (green for delivered, orange for processing, etc.)

### 6.4 Order Detail View (تتبع الطلب #1025)
- **Title**: "تتبع الطلب #1025"
- **Order Status**: "قيد المراجعة" — badge at top
- **Timeline Tracker** (vertical or horizontal):
  - تم استلام الطلب ✓ — 2025 مايو 20، 10:30
  - قيد المراجعة ✓ — (current step highlighted)
  - قيد الطباعة ○
  - جاهز للاستلام ○
  - تم التسليم ○
- **Order Details**:
  - Order items with images, quantities, prices
  - Total breakdown
  - Shipping address
  - Customer info

---

## Page 7: Notifications (الإشعارات)

- **Page Title**: "الإشعارات"
- **List of notification cards**:
  - "تم تأكيد طلبك #1025" — status: جديد — timestamp: منذ 5 دقائق
  - "طلبك #1024 قيد الطباعة" — status: منذ ساعة
  - "طلب #1023 جاهز للاستلام" — status: منذ يوم
  - "طلب #1022 تم التسليم" — status: منذ يوم
  - "عرض خاص: خصم 15% على المنتجات" — status: منذ 3 أيام
- Each notification: Icon + Title + Description + Timestamp
- Unread notifications have a subtle left border or background highlight
- "عرض جميع الإشعارات" link at bottom

---

## Page 8: My Addresses (عنواني)

- **Page Title**: "عنواني"
- **Default badge**: "الافتراضي" pill badge
- **Address Card**:
  - **المنزل**: 
    - الرياض - حي النرجس
    - شارع أحمد بن حنبل
    - 13336 الرمز البريدي
    - 05xxxxxxxx
  - **الجامعة**:
    - الرياض - جامعة الملك سعود
    - كلية إدارة الأعمال
    - 11451 الرمز البريدي
    - 05xxxxxxxx
- Each address: Icon + Type label + Full address lines + Edit/Delete actions
- "+ إضافة عنوان جديد" button

---

## Page 9: Admin Dashboard (لوحة التحكم)

### 9.1 Sidebar (collapsible)
- **Background**: `#4A4A38` (dark olive)
- **Text**: `#FFFFFF` (inactive: rgba white 0.7)
- **Active item**: Background `rgba(255,255,255,0.1)`, left border 3px white
- **Nav Items**: لوحة التحكم | المنتجات | الطلبات | العملاء | التقارير | الإشعارات | الإعدادات
- **Bottom**: Admin profile (avatar + "أحمد النظام" + "admin@shop.com")
- **Collapsed state**: Icons only, width ~70px

### 9.2 Dashboard Content
- **Top Bar**: Search input ("ابحث عن طلب، منتج...") + Filter button + Notification bell + Admin avatar
- **Stats Cards Row** (4 cards):
  1. إجمالي الطلبات: 128 طلب ↑ +12%
  2. طلبات اليوم: 16 طلب ↑ +8%
  3. إجمالي المبيعات: 24,680 ريال ↑ +15%
  4. العملاء: 450 عميل ↑ +10%
  - Each card: White background, border-radius 12px, shadow, icon top-right, big number, label, percentage badge (green for positive)

- **Charts Section** (2 columns):
  - **Left: Monthly Sales Chart (المبيعات الشهرية)**
    - Dropdown: "6 أشهر"
    - Bar chart showing: يناير, فبراير, مارس, أبريل, مايو, يونيو
    - Values range from ~10K to ~40K
    - Bar color: `#5C5C47`
  - **Right: Recent Orders (أحدث الطلبات)**
    - Table: # | اسم | الحالة | التاريخ
    - Orders #1025 to #1021 with various statuses

- **Bottom Section** (2 columns):
  - **Left: Top Products (أفضل المنتجات)**
    - List: Product image + Name + Count
    - وشاح تخرج: 92
    - روب تخرج: 78
    - قبعة تخرج: 65
    - تصميم مخصص: 22
  - **Right: Product Distribution Chart**
    - Donut/pie chart showing product category distribution
    - Legend with color codes

---

## Page 10: Mobile Responsive Views

### Mobile Home Screen
- **Header**: Hamburger menu (left) | Logo (center) | Icons (right)
- **Hero**: Stacked layout (image top, text below), reduced headline size to 24px
- **Features**: 2x2 grid instead of 4 columns
- **Products**: 2-column grid or horizontal scroll
- **Bottom Nav**: Fixed bottom bar with 5 icons: الرئيسية | المنتجات | السلة | الطلبات | حسابي
  - Each: Icon + Label, 12px
  - Active: Color `#5C5C47`
  - Inactive: Color `#9E9E9E`

### Mobile Product Detail
- Stacked: Image → Details → Add to Cart button (fixed at bottom)

### Mobile Cart
- Full-width items, summary card below

---

## Interactive Behaviors & Animations

1. **Button Hover**: Background darkens by 10%, transition 0.2s ease
2. **Card Hover**: translateY(-4px), shadow increases, transition 0.3s ease
3. **Page Transitions**: Fade in, 0.3s ease
4. **Add to Cart**: Button shows brief loading state, then success message or cart badge updates
5. **Image Gallery**: Click thumbnail updates main image with smooth crossfade
6. **Quantity Buttons**: Increment/decrement with visual feedback
7. **Mobile Menu**: Slide in from right, overlay background, close on outside click
8. **Toast Notifications**: Slide in from top-right for actions (added to cart, order placed, etc.)
9. **Skeleton Loading**: While data loads, show pulsing gray skeletons matching card shapes
10. **RTL Animations**: All slide animations go from right to left (opposite of LTR)

---

## Icons Needed (Use Lucide React or similar)
- Search, ShoppingCart, User, Heart, Share2, UploadCloud, Plus, Minus, X, Bell, Settings, LayoutDashboard, Package, ClipboardList, Users, BarChart3, ChevronLeft, ChevronRight, Star, Truck, Headset, Award, Palette, Check, Clock, MapPin, Phone, Edit, Trash2, Menu, Home, ShoppingBag, UserCircle

---

## Product Images (Prompts for generation)
All product images should have:
- Clean white or light cream background
- Professional product photography style
- Centered composition
- Soft shadows underneath products

1. **Sash (وشاح)**: Black graduation sash/stole with gold embroidered botanical pattern and "2025" text, laid flat, elegant
2. **Gown (روب)**: Black graduation gown with matte finish, displayed on invisible mannequin or flat lay
3. **Cap (قبعة)**: Black mortarboard graduation cap with tassel, centered view
4. **Hero Image**: Arrangement of graduation gown, sash with gold embroidery, and cap on cream fabric background with soft lighting

---

## Important Implementation Notes

1. This is an **RTL (Right-to-Left)** Arabic website. All layouts must be mirrored:
   - Flex directions: `row-reverse` where appropriate
   - Text alignment: `right` by default
   - Margins/Paddings: Apply to left instead of right for spacing
   - Navigation: Logo right, icons left

2. Use a proper i18n setup for Arabic — all text content is in Arabic

3. The design is **clean and minimal** — no flashy gradients, no neon colors, no heavy shadows. Keep it elegant and professional.

4. **Spacing is generous** — don't crowd elements. Use the spacing system consistently.

5. All buttons, inputs, and interactive elements must have visible **focus states** for accessibility.

6. **Responsive breakpoints**:
   - Desktop: 1280px+
   - Tablet: 768px - 1279px
   - Mobile: < 768px

7. Use **Next.js (App Router)** or **React** with a component-based architecture. Tailwind CSS is recommended for styling.

8. State management for cart, orders, and user data should use React Context or Zustand.

9. Include **loading skeletons** and **empty states** for all data-driven sections.

10. All forms must have proper **validation** with Arabic error messages.

---

## Files Structure (Recommended)
```
app/
├── page.tsx                    # Homepage
├── products/
│   ├── page.tsx               # Products listing
│   └── [id]/
│       └── page.tsx           # Product detail
├── cart/
│   └── page.tsx               # Shopping cart
├── checkout/
│   └── page.tsx               # Checkout flow
├── orders/
│   ├── page.tsx               # Orders list
│   └── [id]/
│       └── page.tsx           # Order detail
├── addresses/
│   └── page.tsx               # My addresses
├── notifications/
│   └── page.tsx               # Notifications
├── dashboard/
│   └── page.tsx               # Admin dashboard
├── layout.tsx                  # Root layout (RTL, font, navbar, footer)
└── globals.css                 # Global styles, Tailwind config
components/
├── navbar.tsx
├── footer.tsx
├── hero-section.tsx
├── features-bar.tsx
├── product-card.tsx
├── product-grid.tsx
├── filter-tabs.tsx
├── quantity-selector.tsx
├── cart-item.tsx
├── order-summary.tsx
├── step-indicator.tsx
├── upload-area.tsx
├── sidebar.tsx
├── stats-card.tsx
├── orders-table.tsx
├── notification-card.tsx
├── address-card.tsx
├── mobile-nav.tsx
├── breadcrumb.tsx
├── section-title.tsx
└── skeletons/
    ├── product-skeleton.tsx
    └── card-skeleton.tsx
```

---

Build this entire website to be a **100% pixel-perfect match** to the reference design. Every spacing value, color code, border radius, shadow, font size, and layout proportion must match exactly. The result should look like a professional, production-ready Arabic e-commerce platform for graduation products.
