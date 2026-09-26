import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy — Belle Époque',
}

export default async function PrivacyPage() {
  const t = await getTranslations('legal.privacy')

  return (
    <div className="min-h-screen bg-[#0a1f18] pt-20 text-[#f4ead1]">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-12 border-b border-gold/10 pb-8">
          <p className="text-[11px] uppercase tracking-[0.3em] text-gold/50">Legal</p>
          <h1 className="mt-3 font-serif text-3xl text-gold-rich">{t('title')}</h1>
          <p className="mt-4 text-xs text-gold/40">Last updated: 1 January 2025 · GDPR Compliant</p>
        </div>

        <div className="space-y-8 text-[#c8bfaa]/70">
          {[
            {
              heading: '1. Controller',
              body: 'Belle Époque Kunsthandel GmbH, Kärntner Ring 14, 1010 Vienna, Austria is the data controller responsible for your personal data. Contact: privacy@belleepoque.art',
            },
            {
              heading: '2. Data We Collect',
              body: 'We collect data you provide directly: name, email address, postal address, phone number, and payment information. We also collect usage data (pages visited, browser type, IP address) via cookies and analytics tools.',
            },
            {
              heading: '3. Purpose and Legal Basis',
              body: 'We process your data to: (a) fulfil orders — legal basis: performance of contract; (b) communicate about your order — legal basis: legitimate interest; (c) improve our services — legal basis: legitimate interest; (d) send marketing communications — legal basis: consent (you may withdraw at any time).',
            },
            {
              heading: '4. Data Sharing',
              body: 'We share data with: payment processors (Stripe, YooKassa) for transaction processing; shipping carriers for delivery; analytics providers (PostHog) under data processing agreements. We do not sell personal data.',
            },
            {
              heading: '5. Data Retention',
              body: 'We retain order data for 7 years to comply with Austrian accounting regulations. Marketing preferences are retained until withdrawn. Account data is retained until deletion is requested.',
            },
            {
              heading: '6. Your Rights',
              body: 'Under GDPR you have the right to: access, rectify, erase, and port your data; object to or restrict processing; withdraw consent at any time. To exercise these rights, contact us at privacy@belleepoque.art. You also have the right to lodge a complaint with the Austrian Data Protection Authority (dsb.gv.at).',
            },
            {
              heading: '7. Cookies',
              body: 'We use strictly necessary cookies (session management, region preference), analytics cookies (PostHog — aggregated, anonymised), and preference cookies (language, cart). You may decline non-essential cookies via our cookie banner.',
            },
            {
              heading: '8. Security',
              body: 'We implement appropriate technical and organisational measures including TLS encryption, database row-level security, and access controls to protect your personal data.',
            },
          ].map(({ heading, body }) => (
            <section key={heading}>
              <h2 className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-gold/70">{heading}</h2>
              <p className="text-sm leading-relaxed">{body}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
