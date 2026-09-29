import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabaseServer'
import { rateLimit, getClientIp } from '@/lib/rateLimit'
import { isValidEmail, sanitizeString } from '@/lib/validation'
import { notifyAdminContactRequest } from '@/lib/email'

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const { allowed, retryAfter } = await rateLimit(`contact:${ip}`, 5, 15 * 60 * 1000)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    )
  }

  try {
    const body = await request.json()
    const name = sanitizeString(body.name, 100)
    const email = sanitizeString(body.email, 254)
    const phone = sanitizeString(body.phone, 30)
    const message = sanitizeString(body.message, 3000)

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    if (message.length < 10) {
      return NextResponse.json({ error: 'Message too short' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { error } = await supabase.from('contact_requests').insert({
      name,
      email,
      phone,
      message,
    })

    if (error) {
      console.error('[contact]', error)
      return NextResponse.json({ error: 'Failed to save message' }, { status: 500 })
    }

    await notifyAdminContactRequest({ name, email, message })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[contact]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
