# Final Production Checklist — clothes-print-shop

| Feature | Status | Test Result |
|---------|--------|-------------|
| **Supabase migrations 001–006** | Complete | Schema includes FKs, indexes, RLS; migration `006` tightens employee printing scope. Apply via Supabase SQL editor or CLI. |
| **RLS — Student** | Complete | Students see only own orders (`orders_student_id` policy + server filter). |
| **RLS — Representative** | Complete | Reps limited to `representative_id` scope. |
| **RLS — Admin** | Complete | Admin full access via role policies. |
| **RLS — Employee** | Complete | Migration `006`: SELECT/UPDATE only on printing pipeline statuses with `printing:view` / `printing:status`. |
| **Employee role UI** | Complete | `/employee`, `/employee/orders`, `/employee/printing`, order detail (read-only). |
| **Employee permissions** | Complete | Layout requires `printing:view`; no delete, price edit, or user management routes. |
| **Order lifecycle** | Complete | UI timeline: pending → design_review → approved → printing → ready → delivered (maps to DB enum). |
| **Status history** | Complete | `order_status_history` records `from_status`, `to_status`, `changed_by`, `created_at` on create/update. |
| **Student timeline** | Complete | `StudentOrderProgress` component on order detail + tracking. |
| **Invoice PDF (Admin)** | Complete | Download button on admin order detail; includes order #, student, items, total, date, QR. |
| **Invoice PDF (Student)** | Complete | Download button on student order detail. |
| **Upload validation** | Complete | Logo ≤2MB, preview ≤5MB; PNG/JPEG/WebP/GIF; client + server checks. |
| **Email (Resend)** | Complete | Optional via `RESEND_API_KEY`: new order (admin), status change (student/rep), ready states. |
| **Security — service role** | Pass | `SUPABASE_SERVICE_ROLE_KEY` server-only (`env.ts`, `admin.ts`); not exposed to client. |
| **Security — middleware** | Pass | `proxy.ts` protects `/admin`, `/employee`, `/representative`, `/student` by role. |
| **Security — server actions** | Pass | Role/permission guards on mutations; invoice export checks ownership. |
| **Performance — loading/error** | Complete | `employee/loading.tsx`, `employee/error.tsx` added. |
| **Build** | Pass | `npm run build` — 61 routes, TypeScript OK. |
| **Lint** | Pass | `npm run lint` — 0 errors. |
| **Supabase verify** | Script | `npm run supabase:verify` — connection, buckets, profiles. |
| **First admin setup** | Complete | `/ar/setup` or `npm run supabase:create-admin` |
| **Role promotion CLI** | Complete | `npm run supabase:promote-user` (service role, server only) |
| **Auth callback** | Complete | `/auth/callback` for email confirmation |
| **Migration 007** | **Apply manually** | `007_auth_profile_storage_hardening.sql` — profile lock + storage scope |

## Manual verification (recommended before deploy)

1. Run migrations `001` → `006` on production Supabase.
2. Create test users: student, representative, employee (`printing:view`), admin.
3. Student: place order → verify timeline + invoice PDF.
4. Admin: change status through pipeline → verify history + email (if Resend configured).
5. Employee: confirm only printing-queue orders visible; cannot access admin/student routes.
6. Set `LOCAL_AUTH_ENABLED=false` and configure Supabase env vars for production.

## Environment variables (production)

| Variable | Required |
|----------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes (server only) |
| `NEXT_PUBLIC_APP_URL` | Yes |
| `RESEND_API_KEY` | Optional (email) |
| `RESEND_FROM_EMAIL` | Optional (verified domain) |
| `LOCAL_AUTH_ENABLED` | `false` in production |
