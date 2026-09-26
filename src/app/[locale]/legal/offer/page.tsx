import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Public Offer — Belle Époque',
}

export default async function PublicOfferPage() {
  const t = await getTranslations('legal.offer')

  return (
    <div className="min-h-screen bg-[#0a1f18] pt-20 text-[#f4ead1]">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-12 border-b border-gold/10 pb-8">
          <p className="text-[11px] uppercase tracking-[0.3em] text-gold/50">Legal</p>
          <h1 className="mt-3 font-serif text-3xl text-gold-rich">{t('title')}</h1>
          <p className="mt-4 text-xs text-gold/40">Last updated: 1 January 2025</p>
        </div>

        <div className="prose prose-sm max-w-none space-y-8 text-[#c8bfaa]/70">
          {[
            {
              heading: '1. General Provisions',
              body: 'This Public Offer (hereinafter "Offer") governs the terms and conditions of the sale of antique objects by Belle Époque (hereinafter "Seller") to any person who accepts this Offer (hereinafter "Buyer"). Acceptance of this Offer is effected by placing an order on the website.',
            },
            {
              heading: '2. Subject of the Agreement',
              body: 'The Seller undertakes to transfer ownership of antique objects as described in the catalogue to the Buyer, and the Buyer undertakes to accept and pay for such objects in accordance with the prices and terms specified herein.',
            },
            {
              heading: '3. Pricing and Payment',
              body: 'All prices are stated in EUR unless otherwise indicated. The Seller reserves the right to change prices at any time prior to order confirmation. Payment must be made in full prior to shipment. The Seller accepts payment via Stripe (card, Apple Pay, Google Pay, SEPA) and YooKassa (bank card, SBP, YooMoney, MIR) depending on the Buyer\'s region.',
            },
            {
              heading: '4. Authenticity and Condition',
              body: 'The Seller guarantees that all objects offered for sale are authentic antiques as described. Condition is assessed using the grading system specified on the individual product page. The Seller provides provenance documentation where available.',
            },
            {
              heading: '5. Delivery',
              body: 'Delivery is carried out via specialist art-shipping carriers. The Seller is responsible for appropriate packaging to ensure safe transit. Delivery times and costs are specified at checkout. Risk passes to the Buyer upon handover to the carrier.',
            },
            {
              heading: '6. Returns',
              body: 'Given the unique and one-of-a-kind nature of antique objects, the Seller does not accept returns except in cases where the object materially differs from its description. Any such claim must be made within 7 days of receipt with photographic evidence.',
            },
            {
              heading: '7. Dispute Resolution',
              body: 'Any disputes arising from this Agreement shall be resolved by negotiation. If negotiation fails, disputes shall be submitted to the competent courts of the Republic of Austria.',
            },
            {
              heading: '8. Contact',
              body: 'Questions regarding this Offer may be directed to: legal@belleepoque.art',
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
