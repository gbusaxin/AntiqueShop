import { test, expect, type Locator, type Page } from '@playwright/test'

/**
 * Visual regression for the storefront design.
 * Only layout and styling are compared: everything that comes from the database
 * (photos, product cards, counters, names) is masked, so a new product in the shop
 * does not break the build — a broken grid, colour or font does.
 *
 * Baselines: generated on Linux in CI. Update them with the "UI quality" workflow
 * (Run workflow → update_snapshots = true) and commit the artifact it uploads.
 */

const THEMES = ['light', 'dark'] as const
type Theme = (typeof THEMES)[number]

async function openPage(page: Page, path: string, theme: Theme) {
  await page.addInitScript((value) => {
    window.localStorage.setItem('theme', value)
    window.localStorage.setItem('cookie_consent', 'declined')
  }, theme)
  await page.goto(path)
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => document.fonts.ready)
  // Walk the page once so every scroll-triggered reveal reaches its final state, then return to the top.
  await page.evaluate(async () => {
    const step = Math.max(200, Math.floor(window.innerHeight / 2))
    for (let y = 0; y <= document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y)
      await new Promise((resolve) => setTimeout(resolve, 80))
    }
    window.scrollTo(0, 0)
  })
  await page.waitForTimeout(600)
}

function dynamicContent(page: Page): Locator[] {
  return [
    page.locator('img'),
    page.getByTestId('product-card'),
    page.locator('[data-visual="dynamic"]'),
    page.locator('.leaflet-container'),
  ]
}

for (const theme of THEMES) {
  test.describe(`storefront — ${theme} theme`, () => {
    test(`home @${theme}`, async ({ page }) => {
      await openPage(page, '/ru', theme)
      const mask = dynamicContent(page)

      await expect(page).toHaveScreenshot(`home-hero-${theme}.png`, { mask })
      await expect(page.getByTestId('materials-marquee')).toHaveScreenshot(`home-marquee-${theme}.png`, { mask })
      await expect(page.getByTestId('heritage-section')).toHaveScreenshot(`home-heritage-${theme}.png`, { mask })
      await expect(page.getByTestId('site-footer')).toHaveScreenshot(`footer-${theme}.png`, { mask })
    })

    test(`catalog @${theme}`, async ({ page }) => {
      await openPage(page, '/ru/catalog', theme)
      const mask = dynamicContent(page)

      await expect(page.getByTestId('catalog-header')).toHaveScreenshot(`catalog-header-${theme}.png`, { mask })
      // On mobile the filters collapse behind a button; the sidebar itself is desktop-only.
      const filters = page.getByTestId('catalog-filters')
      await expect(filters).toHaveScreenshot(`catalog-filters-${theme}.png`, { mask })
    })

    test(`static pages @${theme}`, async ({ page }) => {
      await openPage(page, '/ru/favorites', theme)
      await expect(page).toHaveScreenshot(`favorites-empty-${theme}.png`, { fullPage: true, mask: dynamicContent(page) })

      await openPage(page, '/ru/this-page-does-not-exist', theme)
      await expect(page).toHaveScreenshot(`not-found-${theme}.png`, { fullPage: true, mask: dynamicContent(page) })

      await openPage(page, '/ru/auth/login', theme)
      await expect(page).toHaveScreenshot(`login-${theme}.png`, { fullPage: true, mask: dynamicContent(page) })
    })
  })
}
