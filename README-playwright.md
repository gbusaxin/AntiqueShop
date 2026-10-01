# Playwright Smoke Tests

## Install

```bash
npm i -D @playwright/test
npx playwright install chromium
```

## Run all tests

```bash
npx playwright test
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

## Notes

- Tests 3, 4, 5, 8 automatically skip if no products exist in the database.
- Test 7 verifies admin route protection; no admin credentials needed.
- Test 5 does **not** complete a real payment — it only verifies the form renders correctly.
- For CI, set `CI=true` to enable retries and single-worker mode (already configured in `playwright.config.ts`).
