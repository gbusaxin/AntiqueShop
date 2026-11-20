import { defineConfig, devices } from '@playwright/test'

const isCI = !!process.env.CI
const VISUAL = /visual\.spec\.ts/
// The standalone server binds to 127.0.0.1 explicitly (GitHub runners set HOSTNAME to the machine name).
const BASE_URL = isCI ? 'http://127.0.0.1:3000' : 'http://localhost:3000'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: isCI ? [['html', { open: 'never' }], ['github']] : 'html',
  // One baseline per project, independent of the host OS. Baselines are produced
  // on Linux in CI (see .github/workflows/ui-quality.yml) — do not regenerate them on macOS.
  snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}/{arg}{ext}',
  expect: {
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
      maxDiffPixelRatio: 0.02,
    },
  },
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      testIgnore: VISUAL,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'visual-desktop',
      testMatch: VISUAL,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
        // MotionConfig reducedMotion="user" + CSS media query freeze every animation
        reducedMotion: 'reduce',
        locale: 'ru-RU',
        timezoneId: 'Europe/Vienna',
      },
    },
    {
      name: 'visual-mobile',
      testMatch: VISUAL,
      use: {
        ...devices['Pixel 7'],
        reducedMotion: 'reduce',
        locale: 'ru-RU',
        timezoneId: 'Europe/Vienna',
      },
    },
  ],
  webServer: {
    // CI tests the production build; locally the dev server is enough.
    command: isCI ? 'npm run start:standalone' : 'npm run dev',
    url: BASE_URL,
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },
})
