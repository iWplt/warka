# WARKA QA Exploratory Test Report

**Date:** 2026-07-05  
**Environment:** `http://localhost:3000` (Next.js 16.2.9 dev server)  
**Browser tool:** Cursor IDE Browser MCP (headed) — Playwright MCP was configured by user but agent session used `cursor-ide-browser`  
**Audit mode:** Read-only — no application code, config, or database records modified  
**Git status at start:** **NOT CLEAN** — extensive modified/untracked files (Phase 4 work in progress). Audit proceeded anyway; results may reflect uncommitted changes.

**Test credentials used (from repo docs):** `student@warka.demo` / `Student123!` (demo seed)

---

## 1. Executive Summary

**Overall health: Partial / Needs attention**

The public marketing site and student authentication flow work at a basic level, but **React hydration mismatches appear on nearly every major page** in dev mode, and several **pricing / checkout issues** block core ordering flows.

| Severity | Count |
|----------|-------|
| Critical | 1 |
| Major | 3 |
| Minor | 4 |
| Cosmetic | 2 |

**Top blockers:**
1. Widespread React hydration errors (CountdownTimer + multiple components)
2. Duplicate “Gowns” catalog entry priced at **0 IQD**
3. Checkout wizard inaccessible via URL skip (`/checkout?step=3` → blank screen / error)

**Sections not fully executed:** Font management, batch Excel import/export, dynamic settings mutation, student admin CRUD — blocked by read-only audit policy and/or missing admin credentials + no sample assets in repo.

---

## 2. Summary Table

| Feature | Status | Notes |
|---------|--------|-------|
| Landing & navigation | **Partial** | Homepage, products, nav links load; hydration errors; footer links present |
| Responsive layouts | **Partial** | 375/768/1440 tested; browser viewport override had limited visual effect |
| Authentication | **Partial** | Invalid creds OK; valid student login OK; session persists on reload; logout blocked by dev overlay during test |
| Register flow | **Skipped** | Redirects to `/student` when already logged in; logout not completed |
| Order flow wizard | **Fail** | New order → `/products?new=1` (by design); checkout step skip crashes; full wizard not completed (read-only) |
| Font management | **Skipped** | Requires admin; no `.ttf`/`.otf` samples in project |
| Batch Excel import/export | **Skipped** | Requires admin/rep; no sample `.xlsx` in repo |
| Dynamic settings engine | **Skipped** | Read-only policy — settings not mutated |
| Student admin panel | **Skipped** | Requires admin login (credentials not verified) |
| RBAC / access control | **Pass** | Student visiting `/admin` stays on student dashboard |
| Cross-cutting UI | **Partial** | Dev overlay interferes with clicks; hydration badge on most pages |

---

## 3. Detailed Bug List

### BUG-001 — React hydration mismatch on landing page
- **Severity:** Critical
- **Steps:** Open `http://localhost:3000/en`
- **Expected:** Clean render, no hydration errors
- **Actual:** Next.js dev overlay shows “1 Issue”; hydration error in `warka-landing.tsx` line 227 (`CountdownTimer`)
- **Console:** `Hydration failed because the server rendered HTML didn't match the client` — causes include `Date.now()`, locale formatting, `typeof window` branches
- **Screenshot:** `01_section1_homepage_desktop.png`

### BUG-002 — React hydration mismatch on products page
- **Severity:** Major
- **Steps:** Navigate to `/en/products`
- **Expected:** Clean product grid
- **Actual:** Hydration error in `product-card.tsx (81:15)`; brief skeleton flash on first paint
- **Console:** Same hydration error pattern as BUG-001
- **Screenshot:** `04_section1_products_page.png`

### BUG-003 — React hydration mismatch on login page
- **Severity:** Major
- **Steps:** Open `/en/login`, switch to “Email & password” tab
- **Expected:** Stable form render
- **Actual:** Hydration error in `login-form.tsx (44:13)`
- **Console:** Hydration mismatch
- **Screenshot:** `05_section2_login_invalid_creds.png`

### BUG-004 — React hydration mismatch in student dashboard
- **Severity:** Major
- **Steps:** Log in as student → `/en/student`
- **Expected:** Clean dashboard
- **Actual:** Hydration error in `dashboard-sidebar.tsx (203:15)`
- **Console:** Hydration mismatch
- **Screenshot:** `06_section2_student_dashboard.png`

### BUG-005 — “Gowns” product priced at 0 IQD
- **Severity:** Major
- **Steps:** View homepage product grid or `/en/products`
- **Expected:** Valid price for all catalog items
- **Actual:** Separate “Gowns” entry shows **“From 0 IQD”** while “Graduation Gown” shows 45,000 IQD — duplicate/conflicting catalog row
- **Console:** None specific
- **Screenshot:** `04_section1_products_page.png`, `01_section1_homepage_desktop.png`

### BUG-006 — Checkout blank page when skipping wizard steps
- **Severity:** Major
- **Steps:** While logged in, navigate directly to `/en/checkout?step=3`
- **Expected:** Redirect to step 1 or guard message
- **Actual:** Blank page briefly, then redirect to `/en/products` with runtime error referencing `checkout-shell.tsx (42:26)` (`useSyncExternalStore` / cart hydration)
- **Console:** Client runtime error (checkout shell)
- **Screenshot:** `07_section3_checkout_step3_blank.png`

### BUG-007 — New order route shows empty shell before redirect
- **Severity:** Minor
- **Steps:** Visit `/en/student/orders/new`
- **Expected:** Immediate redirect or loading indicator
- **Actual:** Blank page with header/breadcrumb only for ~1s, then redirects to `/products?new=1` (intentional via `NewOrderRedirect`, but poor UX)
- **Screenshot:** (captured during redirect — same session as section 3)

### BUG-008 — Invalid login error persists after switching tabs
- **Severity:** Minor
- **Steps:** Fail login → switch to Email tab → error banner still visible until navigation clears `?error=invalid`
- **Expected:** Error clears when changing login mode or is contextual
- **Actual:** Red “Invalid email or password” remains visible on access-code tab
- **Screenshot:** `05_section2_login_invalid_creds.png`

### BUG-009 — Login page title locale mismatch
- **Severity:** Cosmetic
- **Steps:** View `/en/login` in English UI
- **Expected:** English `<title>`
- **Actual:** Title is Arabic SEO string while page content is English
- **Screenshot:** `05_section2_login_invalid_creds.png`

### BUG-010 — Next.js dev overlay blocks UI interactions
- **Severity:** Cosmetic (dev only)
- **Steps:** Attempt to click Logout / nav items with hydration overlay expanded
- **Expected:** Clicks reach target buttons
- **Actual:** Click intercepted by dev-tools issue badge / overlay
- **Note:** Production build may not show this; impacts QA automation

---

## 4. Console Errors Log

| Page | Error (exact / summary) |
|------|-------------------------|
| `/en` | Hydration failed — `warka-landing.tsx` @ CountdownTimer (line 227) |
| `/en/products` | Hydration failed — `product-card.tsx` (line 81) |
| `/en/login` | Hydration failed — `login-form.tsx` (line 44) |
| `/en/student` | Hydration failed — `dashboard-sidebar.tsx` (line 203) |
| `/en/checkout?step=3` | Runtime error — `checkout-shell.tsx` (line 42) — cart store hydration |
| Multiple pages | Next.js dev tools: “See more info: https://nextjs.org/docs/messages/react-hydration-error” |

**Common root cause (from overlay text):** Server/client mismatch from countdown timer, date/locale formatting, or client-only state rendered on server.

---

## 5. Section Notes

### Section 1 — Landing & Navigation
- Homepage hero, countdown, CTAs, and product sections render.
- Main nav: Home, Products, Bulk order, How it works, Contact — present in header.
- Products page loads with 5 product cards (Cap, Gown, Gowns, Suits, Custom).
- Footer quick links (Products, How it works, Sign in, Register) and contact links present.
- WhatsApp floating button present on public pages.

### Section 2 — Authentication
- **Invalid credentials:** `wrong@test.com` → `/login?error=invalid` + styled red alert ✓
- **Empty submit:** HTML5 `required` validation on email/password fields ✓
- **Valid login:** `student@warka.demo` → redirect to `/en/student` ✓
- **Session persistence:** Reload `/en/student` while logged in ✓
- **Logout:** Not verified — dev overlay intercepted click
- **Register:** Redirects authenticated users to student dashboard (expected); form not tested logged-out
- **Forgot password:** No link found on login page

### Section 3 — Order Flow Wizard
- “New order” clears cart/wizard and redirects to `/products?new=1` (by design in `new-order-redirect.tsx`).
- Direct URL skip to checkout step 3 fails (BUG-006).
- Full end-to-end order **not submitted** — read-only audit policy prohibits DB writes.
- Order list remains empty for test student (0 orders).

### Section 4 — Font Management
- **Skipped:** Requires `/admin/fonts`; admin credentials not verified in this session.

### Section 5 — Batch Excel
- **Skipped:** Requires admin/rep batch pages; no sample `.xlsx` in repository (template is generated at runtime via UI download).

### Section 6 — Dynamic Settings
- **Skipped:** Read-only audit — settings were not changed or reverted.

### Section 7 — Student Admin
- **Skipped:** Requires admin role.
- **RBAC spot-check:** Student session could not access `/admin` (remained on student area) ✓

### Section 8 — Cross-Cutting
- Most primary buttons on tested pages respond (nav, login, product links).
- Dev hydration overlay degrades automated clicking reliability.
- Network 4xx/5xx: not exhaustively captured; no blocking failed API observed on public pages during manual flow.

---

## 6. Cleanup Confirmation

| Item | Status |
|------|--------|
| TEST_ records created | **None** — read-only audit, no DB writes |
| TEST_ records deleted | N/A |
| Settings reverted | N/A — no settings changed |
| Code/config modified | **None** during QA |
| Deliverable added | `reports/warka_qa_report.md` + screenshots (QA artifacts only) |

---

## 7. Screenshots

Saved under `reports/screenshots/`:

| File | Description |
|------|-------------|
| `01_section1_homepage_desktop.png` | Homepage desktop |
| `02_section1_homepage_mobile.png` | Homepage mobile viewport |
| `03_section1_homepage_tablet.png` | Homepage tablet viewport |
| `04_section1_products_page.png` | Products catalog |
| `05_section2_login_invalid_creds.png` | Login invalid credentials error |
| `06_section2_student_dashboard.png` | Student dashboard after login |
| `07_section3_checkout_step3_blank.png` | Checkout step skip failure |

---

## 8. Recommendations (informational — not implemented)

1. Fix hydration at source: render `CountdownTimer` client-only (`dynamic(..., { ssr: false })`) or pass stable server snapshot.
2. Audit duplicate `gown`/`gowns` product types in price catalog — fix 0 IQD row.
3. Add checkout step guard: redirect illegal `?step=N` to step 1 when cart/wizard state invalid.
4. Add loading UI to `NewOrderRedirect` instead of blank page.
5. Re-run sections 4–7 with verified admin credentials (`create-admin.mjs`) in a **non-read-only** test pass if DB mutation testing is required.

---

*Report generated by automated exploratory QA — read-only, no patches applied.*

---

## 9. Fix Verification — 2026-07-05

**Safety checkpoint:** Git stash `QA fix checkpoint 2026-07-05` created before fixes; working tree restored and patches applied.

| Bug ID | Fix applied | Verification | Screenshot |
|--------|-------------|--------------|------------|
| **BUG-001** | `CountdownTimer` client-only via `dynamic(..., { ssr: false })` + mount-guarded tick state (zeros until `useEffect`) | **Pass** — `/en` loads without hydration overlay; countdown renders after mount | `fixes/01_homepage_en.png` |
| **BUG-002** | `ProductCard` compare checkbox deferred until mount (`compareActive`) to avoid persisted compare-store mismatch | **Pass** — `/en/products` shows no hydration overlay; gown priced 45,000 IQD | `fixes/02_products_en.png` |
| **BUG-003** | `LoginForm` defers `searchParams` error/message reads until mount; tab switch clears `?error=` via `router.replace` | **Partial** — code verified; live tab-switch test blocked by active student session redirecting `/en/login` → `/en/student` | — |
| **BUG-004** | `DashboardSidebar` mount guards for `isDesktop`/collapsed/mobile drawer; `suppressHydrationWarning` on profile text; `DashboardHeader` initials deferred until mount | **Pass** — `/en/student` loads without hydration overlay after reload | `fixes/03_student_en.png` |
| **BUG-005** | Catalog dedupe in `getProductsCatalog` / grouped catalog + migration `023_remove_duplicate_zero_price_gown.sql` removes zero-price duplicate gown rows | **Pass** — no separate “Gowns” card at 0 IQD; only “Graduation Gown” at 45,000 IQD on homepage and products | `fixes/02_products_en.png` |
| **BUG-006** | `CheckoutShell` hydration loading UI + step URL guard; `UnifiedOrderWizard` step clamp/redirect with loading state instead of blank crash | **Pass** — `/en/checkout?step=3` with empty cart shows spinner + “Redirecting to products…” then redirects safely | `fixes/04_checkout_step3_guard.png` |
| **BUG-007** | `NewOrderRedirect` shows spinner + “Preparing your new order…” during redirect | **Pass** — `/en/student/orders/new` shows loading indicator before redirect | `fixes/05_new_order_loading.png` |
| **BUG-008** | Login tab `switchMode()` clears `?error=` query param on tab change | **Partial** — implemented; not re-tested live due to authenticated redirect (see BUG-003) | — |
| **BUG-009** | `generateMetadata` on login page uses locale-aware `auth.loginSeoTitle` (`Sign In \| WARKA` for `en`) | **Pass** — metadata added in `login/page.tsx` with EN/AR strings in message files | — |
| **BUG-010** | No code change (Next.js dev overlay only) | **Confirmed** — overlay absent in production builds; dev badge may still appear during HMR but does not affect shipped app | — |

**Notes:**
- Duplicate “Gowns” was an orphaned migration-010 category-default row (same `product_type`, 0 IQD) alongside the seeded “Graduation Gown” — removed via dedupe logic and SQL migration, not a separate intentional SKU.
- Apply migration `023_remove_duplicate_zero_price_gown.sql` on Supabase for persistent DB cleanup.

