# Antique Shop — Implementation Plan

## Architecture Overview
Next.js 15 App Router + TypeScript, TailwindCSS + shadcn/ui, Framer Motion, next-intl (ru/en/de),
Supabase (Postgres + Auth + Storage), Stripe + YooKassa/CloudPayments, Zustand, Vercel deploy.
Routes: /[locale]/... with middleware-based locale detection. Payment provider resolved server-side
by region (cookie → Vercel Geo → fallback EU). Prices stored in EUR, converted by cached exchange rates.
Admin at /admin with Supabase RLS role=admin guard.

### [ ] Step 1: Project Foundation
- package.json, next.config.ts, tailwind.config.ts, tsconfig.json
- middleware.ts (next-intl locale routing)
- .env.example

### [ ] Step 2: Database Schema & Types
- supabase/schema.sql (all tables + RLS policies)
- src/types/index.ts (TypeScript interfaces)

### [ ] Step 3: i18n & Translation Files
- src/i18n/config.ts, src/i18n/routing.ts
- messages/ru.json, messages/en.json, messages/de.json

### [ ] Step 4: Utility Functions & Stores
- src/lib/getLocalizedField.ts
- src/lib/getPriceForRegion.ts
- src/lib/getPaymentProvidersForRegion.ts
- src/lib/region.ts, src/lib/supabase.ts, src/lib/exchangeRates.ts
- src/store/cartStore.ts, src/store/regionStore.ts

### [ ] Step 5: Core Layout & Components
- src/app/layout.tsx, src/app/[locale]/layout.tsx
- src/components/Header.tsx, Footer.tsx, CookieBanner.tsx
- src/components/ui/* (shared components)

### [ ] Step 6: Main Pages (Home, Catalog, Product)
- src/app/[locale]/page.tsx (Home with hero, carousel, categories)
- src/app/[locale]/catalog/page.tsx (filters, grid)
- src/app/[locale]/catalog/[slug]/page.tsx (product detail, photo gallery)

### [ ] Step 7: Cart & Checkout
- src/app/[locale]/cart/page.tsx
- src/app/[locale]/checkout/page.tsx (address form, payment methods by region)
- src/app/[locale]/checkout/success/page.tsx

### [ ] Step 8: Auth Pages
- src/app/[locale]/auth/login/page.tsx
- src/app/[locale]/auth/register/page.tsx
- src/app/[locale]/account/orders/page.tsx

### [ ] Step 9: Static Pages
- src/app/[locale]/about/page.tsx
- src/app/[locale]/contacts/page.tsx
- src/app/[locale]/legal/offer/page.tsx
- src/app/[locale]/legal/privacy/page.tsx

### [ ] Step 10: Admin Panel
- src/app/admin/layout.tsx (auth guard)
- src/app/admin/page.tsx (dashboard + metrics)
- src/app/admin/products/* (CRUD with multilingual fields)
- src/app/admin/orders/page.tsx
- src/app/admin/content/page.tsx (static pages editor)
- src/app/admin/contacts/page.tsx (contact requests)

### [ ] Step 11: API Routes
- src/app/api/checkout/stripe/route.ts
- src/app/api/checkout/yookassa/route.ts
- src/app/api/webhooks/stripe/route.ts
- src/app/api/webhooks/yookassa/route.ts
- src/app/api/exchange-rates/route.ts
- src/app/api/region/route.ts
- src/app/api/contact/route.ts
