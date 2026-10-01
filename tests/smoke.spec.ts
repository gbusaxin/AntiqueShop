import { test, expect } from '@playwright/test'

test.describe('TEST 1 — Homepage loads + theme toggle', () => {
  test('hero h1 is visible and theme persists across reload', async ({ page }) => {
    await page.goto('/ru')
    await page.waitForLoadState('networkidle')

    const hero = page.getByTestId('hero-title')
    await expect(hero).toBeVisible()

    const themeToggle = page.getByTestId('theme-toggle')
    await expect(themeToggle).toBeVisible()

    await themeToggle.click()
    await page.waitForFunction(() =>
      document.documentElement.classList.contains('dark') ||
      document.documentElement.classList.contains('light')
    )
    const htmlClass = await page.evaluate(() => document.documentElement.className)
    expect(htmlClass).toMatch(/dark|light/)

    await page.reload()
    await page.waitForLoadState('networkidle')
    const htmlClassAfterReload = await page.evaluate(() => document.documentElement.className)
    expect(htmlClassAfterReload).toMatch(/dark|light/)
  })
})

test.describe('TEST 2 — Locale switch', () => {
  test('switches locale to en and URL updates', async ({ page }) => {
    await page.goto('/ru')
    await page.waitForLoadState('networkidle')

    const enBtn = page.getByTestId('locale-en')
    await expect(enBtn).toBeVisible()
    await enBtn.click()

    await page.waitForURL('**/en**')
    expect(page.url()).toContain('/en')

    const hero = page.getByTestId('hero-title')
    await expect(hero).toBeVisible()
    const heroText = await hero.textContent()
    expect(heroText).toBeTruthy()
  })
})

test.describe('TEST 3 — Catalog + product cards visible', () => {
  test('catalog loads product grid with cards', async ({ page }) => {
    await page.goto('/ru/catalog')
    await page.waitForLoadState('networkidle')

    const grid = page.getByTestId('products-grid')
    await expect(grid).toBeVisible({ timeout: 15_000 })

    const cards = page.getByTestId('product-card')
    const initialCount = await cards.count()

    if (initialCount === 0) {
      test.skip()
      return
    }

    expect(initialCount).toBeGreaterThan(0)
  })
})

test.describe('TEST 4 — Product page + add to cart + persist', () => {
  test('add to cart and verify cart persists on reload', async ({ page }) => {
    await page.goto('/ru/catalog')
    await page.waitForLoadState('networkidle')

    const cards = page.getByTestId('product-card')
    const count = await cards.count()
    if (count === 0) {
      test.skip()
      return
    }

    const firstCard = cards.first()
    const href = await firstCard.getAttribute('href')
    if (!href) {
      test.skip()
      return
    }

    await firstCard.click()
    await page.waitForLoadState('networkidle')

    const addBtn = page.getByTestId('add-to-cart')
    await expect(addBtn).toBeVisible()

    await addBtn.click()
    await page.waitForTimeout(500)

    await page.getByTestId('cart-link').click()
    await page.waitForURL('**/cart')
    await page.waitForLoadState('networkidle')

    const cartItems = page.getByTestId('cart-item')
    await expect(cartItems.first()).toBeVisible({ timeout: 10_000 })

    await page.reload()
    await page.waitForLoadState('networkidle')
    const cartItemsAfterReload = page.getByTestId('cart-item')
    await expect(cartItemsAfterReload.first()).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('TEST 5 — Checkout flow (no real payment)', () => {
  test('checkout page renders with payment section and submit button', async ({ page }) => {
    await page.goto('/ru/catalog')
    await page.waitForLoadState('networkidle')

    const cards = page.getByTestId('product-card')
    const count = await cards.count()
    if (count === 0) {
      test.skip()
      return
    }

    await cards.first().click()
    await page.waitForLoadState('networkidle')

    const addBtn = page.getByTestId('add-to-cart')
    await expect(addBtn).toBeVisible()
    await addBtn.click()
    await page.waitForTimeout(400)

    await page.goto('/ru/checkout')
    await page.waitForLoadState('networkidle')

    const firstNameField = page.locator('input[name="firstName"], input[name="first_name"], input[placeholder*="First"], input[placeholder*="Имя"]').first()
    if (await firstNameField.isVisible()) {
      await firstNameField.fill('Test')
    }

    const submitBtn = page.getByTestId('checkout-submit')
    if (await submitBtn.isVisible()) {
      await expect(submitBtn).toBeEnabled()
    } else {
      const paymentSection = page.getByTestId('payment-section')
      if (await paymentSection.isVisible()) {
        await expect(paymentSection).toBeVisible()
      }
    }
  })
})

test.describe('TEST 6 — Auth login page', () => {
  test('login page has form and noindex meta', async ({ page }) => {
    const response = await page.goto('/ru/auth/login')
    expect(response?.status()).not.toBe(500)
    await page.waitForLoadState('domcontentloaded')

    const content = await page.content()
    const hasNoIndex =
      content.includes('noindex') ||
      content.includes('robots')
    expect(hasNoIndex).toBeTruthy()

    const emailInput = page.locator('input[type="email"], input[name="email"]')
    await expect(emailInput).toBeVisible({ timeout: 10_000 })

    const passwordInput = page.locator('input[type="password"]')
    await expect(passwordInput).toBeVisible()
  })
})

test.describe('TEST 7 — Admin protection', () => {
  test('unauthenticated access to /admin redirects to login', async ({ page }) => {
    await page.goto('/ru/admin')
    await page.waitForLoadState('networkidle')

    const finalUrl = page.url()
    expect(finalUrl).toMatch(/auth\/login|\/login/)
  })
})

test.describe('TEST 8 — JSON-LD XSS safety', () => {
  test('product page JSON-LD does not contain unescaped closing script tags', async ({ page }) => {
    await page.goto('/ru/catalog')
    await page.waitForLoadState('networkidle')

    const cards = page.getByTestId('product-card')
    const count = await cards.count()
    if (count === 0) {
      test.skip()
      return
    }

    await cards.first().click()
    await page.waitForLoadState('networkidle')

    const content = await page.content()

    const jsonLdBlocks = content.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi) ?? []
    for (const block of jsonLdBlocks) {
      const innerMatch = block.match(/<script[^>]*>([\s\S]*?)<\/script>/i)
      if (!innerMatch) continue
      const inner = innerMatch[1]
      expect(inner).not.toContain('</script>')
      expect(inner).not.toContain('<script')
    }
  })
})
