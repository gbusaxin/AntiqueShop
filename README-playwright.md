# Playwright Smoke Tests

## Install

```bash
npm i -D @playwright/test
npx playwright install chromium
```

## Run all tests

```bash
npm run test:e2e        # smoke tests (chromium project)
npm run test:visual     # visual regression (desktop + mobile, light + dark)
```

The dev server starts automatically if not already running (`npm run dev`).

## View HTML report

```bash
npx playwright show-report
```

## Run a single test by name

```bash
npx playwright test -g "Catalog"
npx playwright test -g "Admin protection"
npx playwright test -g "JSON-LD"
```

## Run in headed mode (see browser)

```bash
npx playwright test --headed
```

## Run in debug mode (step through)

```bash
npx playwright test --debug
```

## data-testid attributes used in tests

| Attribute | Component | File |
|---|---|---|
| `hero-title` | `<motion.h1>` | `src/components/home/HeroSection.tsx` |
| `theme-toggle` | `<button>` | `src/components/Navbar.tsx` |
| `locale-en` / `locale-ru` / `locale-de` | `<button>` | `src/components/Navbar.tsx` |
| `cart-link` | `<Link>` | `src/components/Navbar.tsx` |
| `product-card` | `<Link>` | `src/components/ProductCard.tsx` |
| `products-grid` | `<div>` | `src/components/catalog/ProductGrid.tsx` |
| `add-to-cart` | `<motion.button>` | `src/components/product/AddToCartButton.tsx` |
| `cart-item` | `<motion.div>` | `src/components/cart/CartContent.tsx` |
| `payment-section` | `<div>` | `src/components/checkout/CheckoutForm.tsx` |
| `checkout-submit` | `<button type="submit">` | `src/components/checkout/CheckoutForm.tsx` |
| `favorite-toggle` | `<button>` | `src/components/favorites/FavoriteButton.tsx` |
| `favorites-link` | `<Link>` | `src/components/Navbar.tsx` |
| `hero-section`, `materials-marquee`, `heritage-section` | `<section>` | `src/components/home/*` |
| `site-footer` | `<footer>` | `src/components/Footer.tsx` |
| `catalog-header`, `catalog-filters` | `<header>`, `<aside>` | `src/app/[locale]/catalog/page.tsx` |

## Notes

- Tests 3, 4, 5, 8 automatically skip if no products exist in the database.
- Test 7 verifies admin route protection; no admin credentials needed.
- Test 5 does **not** complete a real payment — it only verifies the form renders correctly.
- For CI, set `CI=true` to enable retries and single-worker mode (already configured in `playwright.config.ts`).

## Visual regression

`tests/visual.spec.ts` screenshots the storefront in **light and dark** themes on
**desktop (1440×900) and mobile (Pixel 7)**. Everything that comes from the database —
photos, product cards and any element marked `data-visual="dynamic"` — is masked,
so adding a product does not break the build, while a broken layout, colour or font does.
Animations are frozen through `reducedMotion: 'reduce'` (the site honours it everywhere).

Baselines live in `tests/__screenshots__/<project>/` and are generated **on Linux in CI**
(fonts render differently on macOS — do not regenerate them locally):

1. GitHub → Actions → **UI quality** → *Run workflow* with `update_snapshots = true`.
2. Download the `visual-baselines` artifact and unpack it into `tests/__screenshots__/`.
3. Commit the PNGs. From then on every PR is compared against them.

When a test fails, the `playwright-report` artifact contains the expected / actual / diff images.

## Lighthouse CI

`lighthouserc.cjs` runs Lighthouse 3× on `/ru`, `/ru/catalog`, `/ru/contacts` against the
production standalone build and enforces budgets: accessibility ≥ 0.9 and SEO ≥ 0.9 and
CLS ≤ 0.1 fail the job; performance < 0.8, best practices < 0.9 and LCP > 3 s are warnings.
HTML reports are uploaded as the `lighthouse-reports` artifact.

Locally:

```bash
npm run build && npm run prepare:standalone
npx @lhci/cli autorun --config=./lighthouserc.cjs
```
