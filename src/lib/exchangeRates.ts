import { unstable_cache } from 'next/cache'
import { createAdminClient } from './supabaseServer'

const FALLBACK_RATES: Record<string, number> = {
  RUB: 95, USD: 1.08, GBP: 0.86, CNY: 7.8, JPY: 162, CHF: 0.95,
}

export const getExchangeRates = unstable_cache(async (): Promise<Record<string, number>> => {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return FALLBACK_RATES
    const supabase = createAdminClient()
    const { data: cached } = await supabase
      .from('exchange_rates')
      .select('rates, expires_at')
      .gte('expires_at', new Date().toISOString())
      .order('fetched_at', { ascending: false })
      .limit(1)
      .single()

    if (cached?.rates) return cached.rates as Record<string, number>

    const apiKey = process.env.EXCHANGE_RATES_API_KEY
    if (!apiKey) return FALLBACK_RATES

    const response = await fetch(
      `https://api.exchangerate.host/latest?base=EUR&access_key=${apiKey}`,
      { next: { revalidate: 3600 } }
    )

    if (!response.ok) return FALLBACK_RATES

    const data = await response.json()
    if (!data.rates) return FALLBACK_RATES

    const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString()
    await supabase.from('exchange_rates').insert({ rates: data.rates, expires_at: expiresAt })

    return data.rates as Record<string, number>
  } catch {
    return FALLBACK_RATES
  }
}, ['exchange-rates'], { revalidate: 300 })
