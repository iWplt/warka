# Graduation Printing Shop (`clothes-print-shop`)

Production-ready EMS for graduation print orders: sash, cap, gown, and custom designs. Bilingual Arabic/English UI with role-based dashboards.

## Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, TypeScript, Tailwind CSS v4 |
| i18n | next-intl (`/ar`, `/en`) |
| Database & Auth | Supabase (PostgreSQL + Auth + Storage) |
| Optional local dev | HMAC cookie admin (no database) |

## Features

- **Public landing** with live 2D design preview (no 3D)
- **Student**: register, design studio (layers, undo/redo, save/load), place orders, track status
- **Representative**: batches, group orders, student roster, tracking
- **Admin**: orders, printing, delivery, payments, users, templates, reports (Excel/PDF)
- **Notifications** bell with real-time polling
- **Storage**: designs, logos, QR codes, templates, exports

## Prerequisites

- Node.js **20.9+**
- npm
- [Supabase](https://supabase.com) project (required for production)

## Installation

```bash
git clone <repo-url>
cd clothes-print-shop
npm install
cp .env.example .env.local
```

## Environment variables

```env
# Supabase (required for production)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

NEXT_PUBLIC_APP_URL=http://localhost:3000

# Local admin only (disable in production)
LOCAL_AUTH_ENABLED=false
NEXT_PUBLIC_LOCAL_AUTH_ENABLED=false
```

### Local development without Supabase

```env
LOCAL_AUTH_ENABLED=true
NEXT_PUBLIC_LOCAL_AUTH_ENABLED=true
LOCAL_ADMIN_USERNAME=admin
LOCAL_ADMIN_PASSWORD=admin123
LOCAL_AUTH_SECRET=change-this-local-secret-key
```

Login at `/ar/login` → admin dashboard. **Orders and students are not persisted** without Supabase.

## Supabase setup

### 1. Run migrations (SQL Editor, in order)

```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_storage_buckets.sql
supabase/migrations/003_batch_student_profiles.sql
supabase/migrations/004_public_templates_seed.sql
supabase/migrations/005_products_designs_storage.sql
```

### 2. Storage buckets

Created by migration `002`: `templates`, `designs`, `logos`, `qr-codes`, `exports`

### 3. Create admin user

1. Register at `/ar/register` or create user in Supabase Auth
2. Promote to admin:

```sql
UPDATE profiles SET role = 'admin' WHERE id = 'USER_UUID';
```

### 4. Email sync

Migration `005` adds `profiles.email` synced from `auth.users`.

## Development

```bash
npm run dev
```

- Arabic: http://localhost:3000/ar
- English: http://localhost:3000/en

### Network access (mobile testing)

```bash
npm run dev -- -H 0.0.0.0
```

`next.config.ts` allows dev origin `192.168.56.1`.

## Production build

```bash
npm run lint
npm run build
npm start
```

## Routes

| Path | Role |
|------|------|
| `/ar`, `/en` | Public landing |
| `/login`, `/register` | Authentication |
| `/admin/*` | Admin |
| `/representative/*` | Representative |
| `/student/*` | Student |

## Database schema (core)

| Table | Purpose |
|-------|---------|
| `profiles` | Users (extends auth.users) |
| `products` | Bilingual product catalog |
| `design_templates` | Printable templates |
| `designs` | Saved student studio JSON + preview |
| `orders` / `order_items` | Orders |
| `payments` | Payment records |
| `notifications` | In-app notifications |
| `batches` / `batch_students` | Group graduation orders |

RLS policies enforce: students see own data, reps see their batches/orders, admins see all.

## Design studio

2D preview only:

- Product, color, text, font, embroidery, logo
- Layers with size, rotation, z-order
- Undo / redo
- Save & reload designs (Supabase)
- PNG export on order submit

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Run production server |
| `npm run lint` | ESLint |
| `npm run db:studio` | Prisma Studio (optional Prisma path) |

## Deployment

1. Set all env vars on your host (Vercel, etc.)
2. `LOCAL_AUTH_ENABLED=false`
3. Run Supabase migrations on production database
4. `npm run build && npm start`

## Account roles

- **admin** — full access
- **representative** — batches and group orders assigned to them
- **student** — own orders and designs only

## License

Private — all rights reserved.
