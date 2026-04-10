import type { BusinessHourRow } from '@/lib/api/settings'

export const WEEKDAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
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
  openTime: string
  closeTime: string
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
  openTime: '10:00',
  closeTime: '22:00',
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

export function hoursFromApi(rows: BusinessHourRow[]): { open: string; close: string } {
  const first = rows.find((r) => r.is_open !== false) ?? rows[0]
  if (!first) return { open: '10:00', close: '22:00' }
  const o = (first.open_time ?? '10:00').slice(0, 5)
  const c = (first.close_time ?? '22:00').slice(0, 5)
  return { open: o, close: c }
}

export function formHoursToApiPayload(
  openTime: string,
  closeTime: string,
): BusinessHourRow[] {
  const ot = openTime.length === 5 ? `${openTime}:00` : openTime
  const ct = closeTime.length === 5 ? `${closeTime}:00` : closeTime
  return WEEKDAYS.map((day) => ({
    day,
    is_open: true,
    open_time: ot,
    close_time: ct,
  }))
}

export function extractDeliveryFromPayments(data: unknown): {
  deliveryFee?: string
  minOrder?: string
} {
  if (!data) return {}
  const arr = Array.isArray(data) ? data : null
  const row =
    arr && arr.length > 0 && typeof arr[0] === 'object'
      ? (arr[0] as Record<string, unknown>)
      : typeof data === 'object' && data !== null && !Array.isArray(data)
        ? (data as Record<string, unknown>)
        : null
  if (!row) return {}
  const d =
    row.delivery_fee ?? row.deliveryFee ?? row.delivery_fee_amount
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
    deliveryFee: numStr(d),
    minOrder: numStr(m),
  }
}

export function buildPaymentsPutBody(
  previous: unknown,
  deliveryFee: string,
  minOrderDelivery: string,
): unknown {
  const df = parseFloat(deliveryFee)
  const mo = parseFloat(minOrderDelivery)
  const row = {
    delivery_fee: Number.isFinite(df) ? df : 0,
    minimum_order_for_free_delivery: Number.isFinite(mo) ? mo : 0,
  }
  if (Array.isArray(previous) && previous.length > 0) {
    const copy = JSON.parse(JSON.stringify(previous)) as Record<string, unknown>[]
    const first = {
      ...(typeof copy[0] === 'object' && copy[0] ? copy[0] : {}),
      ...row,
    }
    copy[0] = first
    return copy
  }
  return [row]
}
