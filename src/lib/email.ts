import { Resend } from 'resend'

let resend: Resend | null = null

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY)
  return resend
}

const FROM = process.env.EMAIL_FROM ?? 'Belle Époque <noreply@belle-epoque.com>'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? ''

export async function sendOrderConfirmation(opts: {
  to: string
  orderNumber: string
  items: { name: string; quantity: number; priceEur: number }[]
  totalEur: number
  locale: string
}) {
  const client = getResend()
  if (!client) return

  const itemsHtml = opts.items
    .map(
      (i) =>
        `<tr><td style="padding:6px 0">${i.name}</td><td style="padding:6px 0;text-align:right">× ${i.quantity}</td><td style="padding:6px 0;text-align:right">€${(i.priceEur * i.quantity).toFixed(2)}</td></tr>`
    )
    .join('')

  const subjects: Record<string, string> = {
    en: `Order Confirmation #${opts.orderNumber}`,
    ru: `Подтверждение заказа #${opts.orderNumber}`,
    de: `Bestellbestätigung #${opts.orderNumber}`,
  }

  const greetings: Record<string, string> = {
    en: 'Thank you for your order!',
    ru: 'Спасибо за ваш заказ!',
    de: 'Vielen Dank für Ihre Bestellung!',
  }

  const subject = subjects[opts.locale] ?? subjects.en
  const greeting = greetings[opts.locale] ?? greetings.en

  await client.emails.send({
    from: FROM,
    to: opts.to,
    subject,
    html: `
      <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:40px 20px;color:#1A1A1A">
        <h1 style="font-size:24px;margin-bottom:8px">${greeting}</h1>
        <p style="color:#5A5A5A;margin-bottom:24px">Order #<strong>${opts.orderNumber}</strong></p>
        <table style="width:100%;border-collapse:collapse">
          <tbody>${itemsHtml}</tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding-top:16px;border-top:1px solid #E5E2DC;font-weight:bold">Total</td>
              <td style="padding-top:16px;border-top:1px solid #E5E2DC;text-align:right;font-weight:bold">€${opts.totalEur.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
        <p style="margin-top:32px;color:#5A5A5A;font-size:14px">Your order will be processed within 24 hours.</p>
      </div>
    `,
  }).catch((err) => console.error('[email] sendOrderConfirmation failed', err))
}

export async function notifyAdminNewOrder(opts: {
  orderNumber: string
  totalEur: number
  region: string
  provider: string
  customerEmail: string
}) {
  const client = getResend()
  if (!client || !ADMIN_EMAIL) return

  await client.emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `New order #${opts.orderNumber} — €${opts.totalEur.toFixed(2)}`,
    html: `
      <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:40px 20px;color:#1A1A1A">
        <h2>New order received</h2>
        <ul>
          <li>Order: <strong>#${opts.orderNumber}</strong></li>
          <li>Total: <strong>€${opts.totalEur.toFixed(2)}</strong></li>
          <li>Region: ${opts.region}</li>
          <li>Provider: ${opts.provider}</li>
          <li>Customer: ${opts.customerEmail}</li>
        </ul>
      </div>
    `,
  }).catch((err) => console.error('[email] notifyAdminNewOrder failed', err))
}

export async function notifyAdminContactRequest(opts: {
  name: string
  email: string
  message: string
}) {
  const client = getResend()
  if (!client || !ADMIN_EMAIL) return

  await client.emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `New contact request from ${opts.name}`,
    html: `
      <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:40px 20px;color:#1A1A1A">
        <h2>New contact request</h2>
        <p><strong>Name:</strong> ${opts.name}</p>
        <p><strong>Email:</strong> ${opts.email}</p>
        <p><strong>Message:</strong></p>
        <p style="white-space:pre-wrap;color:#5A5A5A">${opts.message}</p>
      </div>
    `,
  }).catch((err) => console.error('[email] notifyAdminContactRequest failed', err))
}
