/**
 * Lighthouse CI — performance / accessibility / SEO budgets for the storefront.
 * Runs against the production standalone build (see .github/workflows/ui-quality.yml).
 * Reports are written to .lighthouseci/ and uploaded as a workflow artifact
 * (no third-party upload).
 */
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run start:standalone',
      startServerReadyPattern: 'Ready',
      startServerReadyTimeout: 60000,
      url: [
        'http://127.0.0.1:3000/ru',
        'http://127.0.0.1:3000/ru/catalog',
        'http://127.0.0.1:3000/ru/contacts',
      ],
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
        // Third-party analytics would make scores noisy and is consent-gated anyway
        blockedUrlPatterns: ['*posthog*', '*vercel-insights*', '*vercel-scripts*', '*sentry*'],
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 3000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: '.lighthouseci',
    },
  },
}
