import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'
import pluginSecurity from 'eslint-plugin-security'
import pluginNoSecrets from 'eslint-plugin-no-secrets'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({ baseDirectory: __dirname })

const nextConfig = compat.extends('next/core-web-vitals', 'next/typescript')

export default [
  ...nextConfig,

  pluginSecurity.configs.recommended,

  {
    plugins: {
      'no-secrets': pluginNoSecrets,
    },
    rules: {
      'no-secrets/no-secrets': ['error', {
        tolerance: 4.5,
        additionalRegexes: {
          StripeSecretKey: /sk_(live|test)_[a-zA-Z0-9]{24,}/,
          SupabaseServiceRole: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9_\-]{100,}/,
          YooKassaKey: /(live|test)_[A-Za-z0-9]{20,}/,
        },
        ignoreContent: [
          'CHECKOUT_SESSION_ID',
          'localhost:3000',
          'belle-epoque',
          'supabase.co',
          'posthog.com',
          'sentry.io',
        ],
      }],
    },
  },

  {
    rules: {
      'security/detect-object-injection': 'warn',
      'security/detect-non-literal-regexp': 'warn',
      'security/detect-unsafe-regex': 'error',
      'security/detect-buffer-noassert': 'error',
      'security/detect-child-process': 'error',
      'security/detect-disable-mustache-escape': 'error',
      'security/detect-eval-with-expression': 'error',
      'security/detect-new-buffer': 'error',
      'security/detect-no-csrf-before-method-override': 'error',
      'security/detect-non-literal-fs-filename': 'warn',
      'security/detect-non-literal-require': 'warn',
      'security/detect-possible-timing-attacks': 'error',
      'security/detect-pseudoRandomBytes': 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',
    },
  },

  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'out/**',
      'dist/**',
      'coverage/**',
      'playwright-report/**',
    ],
  },
]
