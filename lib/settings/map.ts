import type { BusinessHourRow } from '@/lib/api/settings'

function normalizeDayKey(raw: string): string {
  return raw.trim().toLowerCase()
}

export const WEEKDAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const

export type SettingsFormState = {
  storeName: string
  email: string
  phone: string
  address: string
  currency: string
  timezone: string
  orderNotifications: boolean
  lowStockAlerts: boolean
  dailyReports: boolean
  marketingEmails: boolean
  taxRate: string
  deliveryFee: string
  minOrderDelivery: string
}

export const DEFAULT_SETTINGS: SettingsFormState = {
  storeName: '',
  email: '',
  phone: '',
  address: '',
  currency: 'USD',
  timezone: 'America/New_York',
  orderNotifications: true,
  lowStockAlerts: true,
  dailyReports: true,
  marketingEmails: false,
  taxRate: '0',
  deliveryFee: '0',
  minOrderDelivery: '0',
}

export function mapStoreToForm(
  store: Record<string, unknown>,
  defaults: SettingsFormState,
): SettingsFormState {
  const n = (v: unknown): number | undefined => {
    if (typeof v === 'number' && Number.isFinite(v)) return v
    if (typeof v === 'string') {
      const p = parseFloat(v)
      return Number.isFinite(p) ? p : undefined
    }
    return undefined
  }
  const tax = n(store.tax_rate)
  return {
    ...defaults,
    storeName: String(store.store_name ?? defaults.storeName),
    email: String(store.email ?? defaults.email),
    phone: String(store.phone ?? defaults.phone),
    address: String(store.address_line1 ?? store.address ?? defaults.address),
    currency: String(store.currency ?? defaults.currency),
    timezone: String(store.timezone ?? defaults.timezone),
    taxRate: tax != null ? String(tax) : defaults.taxRate,
  }
}

export function mapNotificationsToForm(
  api: Record<string, boolean>,
  defaults: SettingsFormState,
): Partial<SettingsFormState> {
  const g = (a: string, b: string, fallback: boolean) => {
    if (a in api) return api[a] as boolean
    if (b in api) return api[b] as boolean
    return fallback
  }
  return {
    orderNotifications: g('order_notifications', 'orderNotifications', defaults.orderNotifications),
    lowStockAlerts: g('low_stock_alerts', 'lowStockAlerts', defaults.lowStockAlerts),
    dailyReports: g('daily_reports', 'dailyReports', defaults.dailyReports),
    marketingEmails: g('marketing_emails', 'marketingEmails', defaults.marketingEmails),
  }
}

export function formNotificationsToApi(form: SettingsFormState): Record<string, boolean> {
  return {
    order_notifications: form.orderNotifications,
    low_stock_alerts: form.lowStockAlerts,
    daily_reports: form.dailyReports,
    marketing_emails: form.marketingEmails,
  }
}

export function mergeStorePut(
  snapshot: Record<string, unknown>,
  patch: Record<string, unknown>,
): Record<string, unknown> {
  return { ...snapshot, ...patch }
}

export function formGeneralToStorePatch(form: SettingsFormState): Record<string, unknown> {
  return {
    store_name: form.storeName.trim() || null,
    email: form.email.trim() || null,
    phone: form.phone.trim() || null,
    address_line1: form.address.trim() || null,
    currency: form.currency || null,
    timezone: form.timezone || null,
  }
}

export function formPaymentsToStorePatch(form: SettingsFormState): Record<string, unknown> {
  const tr = parseFloat(form.taxRate)
  return {
    tax_rate: Number.isFinite(tr) ? tr : null,
  }
}

export function defaultBusinessHourRows(): BusinessHourRow[] {
  return WEEKDAYS.map((day) => ({
    day,
    is_open: true,
    open_time: '10:00',
    close_time: '18:00',
  }))
}

/** Merge API rows into monday–sunday order; fill gaps with sensible defaults. */
export function normalizeBusinessHoursFromApi(rows: BusinessHourRow[]): BusinessHourRow[] {
  const byDay = new Map<string, BusinessHourRow>()
  for (const r of rows) {
    const key = normalizeDayKey(r.day)
    if (!key) continue
    const open = (r.open_time ?? '10:00').slice(0, 5)
    const close = (r.close_time ?? '18:00').slice(0, 5)
    byDay.set(key, {
      day: key,
      is_open: r.is_open !== false,
      open_time: open,
      close_time: close,
    })
  }
  return WEEKDAYS.map((day) => {
    const hit = byDay.get(day)
    if (hit) return hit
    return { day, is_open: true, open_time: '10:00', close_time: '18:00' }
  })
}

export function dayLabel(day: string): string {
  const d = normalizeDayKey(day)
  if (!d) return day
  return d.charAt(0).toUpperCase() + d.slice(1)
}

export function extractDeliveryFromPayments(data: unknown): {
  taxRate?: string
  deliveryFee?: string
  minOrder?: string
} {
  if (!data) return {}

  const toObject = (v: unknown): Record<string, unknown> | null =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? (v as Record<string, unknown>)
      : null

  const hasPaymentKeys = (row: Record<string, unknown>): boolean =>
    'delivery_fee' in row ||
    'deliveryFee' in row ||
    'delivery_fee_amount' in row ||
    'minimum_order_for_free_delivery' in row ||
    'min_order_free_delivery' in row ||
    'minOrderDelivery' in row

  const findPaymentRow = (
    input: unknown,
    depth = 0,
  ): Record<string, unknown> | null => {
    if (depth > 4 || input == null) return null
    if (Array.isArray(input)) {
      for (const item of input) {
        const found = findPaymentRow(item, depth + 1)
        if (found) return found
      }
      return null
    }
    const obj = toObject(input)
    if (!obj) return null
    if (hasPaymentKeys(obj)) return obj

    // Common API envelope shapes.
    const directCandidates = [obj.items, obj.data, obj.settings, obj.payment, obj.payments]
    for (const c of directCandidates) {
      const found = findPaymentRow(c, depth + 1)
      if (found) return found
    }

    // Fallback: search nested object values.
    for (const v of Object.values(obj)) {
      const found = findPaymentRow(v, depth + 1)
      if (found) return found
    }
    return null
  }

  const row = findPaymentRow(data)
  if (!row) return {}

  const d =
    row.delivery_fee ?? row.deliveryFee ?? row.delivery_fee_amount
  const t = row.tax_rate ?? row.taxRate
  const m =
    row.minimum_order_for_free_delivery ??
    row.min_order_free_delivery ??
    row.minOrderDelivery
  const numStr = (v: unknown) =>
    typeof v === 'number' && Number.isFinite(v)
      ? String(v)
      : typeof v === 'string'
        ? v
        : undefined
  return {
    taxRate: numStr(t),
    deliveryFee: numStr(d),
    minOrder: numStr(m),
  }
}

export function buildPaymentsPutBody(
  taxRate: string,
  deliveryFee: string,
  minOrderDelivery: string,
): Record<string, number> {
  const tr = parseFloat(taxRate)
  const df = parseFloat(deliveryFee)
  const mo = parseFloat(minOrderDelivery)
  return {
    tax_rate: Number.isFinite(tr) ? tr : 0,
    delivery_fee: Number.isFinite(df) ? df : 0,
    minimum_order_for_free_delivery: Number.isFinite(mo) ? mo : 0,
  }
}
