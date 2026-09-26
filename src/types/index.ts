export type Locale = 'ru' | 'en' | 'de'

export type Region = 'EU' | 'CIS' | 'US' | 'UK' | 'OTHER'

export type PaymentProvider = 'stripe' | 'yookassa' | 'cloudpayments'

export type ProfileRole = 'customer' | 'admin'

export type ProductCondition = 'excellent' | 'very_good' | 'good' | 'fair'

export type OrderStatus = 'new' | 'paid' | 'shipped' | 'completed' | 'cancelled'

export interface Profile {
  id: string
  role: ProfileRole
  full_name: string | null
  phone: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  slug: string
  name_ru: string | null
  name_en: string | null
  name_de: string | null
  description_ru: string | null
  description_en: string | null
  description_de: string | null
  image_url: string | null
  sort_order: number
  created_at: string
}

export interface PriceOverride {
  amount: number
  currency: string
}

export interface ProductSnapshot {
  name: string
  price_eur: number
}

export interface Product {
  id: string
  slug: string
  category_id: string | null
  name_ru: string | null
  name_en: string | null
  name_de: string | null
  description_ru: string | null
  description_en: string | null
  description_de: string | null
  provenance_ru: string | null
  provenance_en: string | null
  provenance_de: string | null
  era: string | null
  material: string | null
  country_of_origin: string | null
  condition: ProductCondition | null
  year_circa: string | null
  price_eur: number
  price_override: PriceOverride | null
  images: string[]
  is_available: boolean
  views_count: number
  created_at: string
  updated_at: string
  localizedName: string
  localizedDescription: string
}

export interface ShippingAddress {
  country: string
  city: string
  address_line_1: string
  address_line_2?: string
  postal_code?: string
  state?: string
  region?: string
  province?: string
  recipient_name?: string
  recipient_phone?: string
  [key: string]: string | undefined
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string | null
  product_snapshot: ProductSnapshot | null
  quantity: number
  price_eur: number
  product?: Product
}

export interface Order {
  id: string
  user_id: string | null
  status: OrderStatus
  region: Region
  payment_provider: PaymentProvider | null
  payment_session_id: string | null
  payment_intent_id: string | null
  currency: string
  total_eur: number
  total_local: number | null
  exchange_rate: number | null
  shipping_address: ShippingAddress | null
  shipping_method: string | null
  shipping_cost_eur: number
  notes: string | null
  created_at: string
  updated_at: string
  items: OrderItem[]
}

export interface CartItem {
  product: Product
  quantity: number
}

export interface SiteContent {
  id: string
  page: string
  section: string
  content_ru: string | null
  content_en: string | null
  content_de: string | null
  metadata: Record<string, unknown> | null
  updated_at: string
}

export interface ContactRequest {
  id: string
  name: string
  email: string
  phone: string | null
  message: string
  locale: Locale | null
  is_read: boolean
  created_at: string
}

export interface ExchangeRates {
  id: string
  base_currency: string
  rates: Record<string, number>
  fetched_at: string
  expires_at: string
}

export interface PaymentMethod {
  id: string
  label: Record<Locale, string>
  icon: string
  provider: PaymentProvider
}

export interface PriceInfo {
  amount: number
  currency: string
  isConverted: boolean
  rateDate?: string
}
