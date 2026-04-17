import { pizzaApiFetch } from '@/lib/api/client'
import { unwrapApiArray, unwrapApiData } from '@/lib/api/unwrap'

export type StoreSettings = Record<string, unknown>

export async function apiGetStore():
  | { ok: true; data: StoreSettings }
  | { ok: false; status: number; message: string } {
  const res = await pizzaApiFetch<unknown>('v1/settings/store')
  if (!res.ok) return res
  const data = unwrapApiData<StoreSettings>(res.data)
  return { ok: true, data: data ?? {} }
}

export async function apiPutStore(body: Record<string, unknown>) {
  return pizzaApiFetch<unknown>('v1/settings/store', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export async function apiGetNotifications():
  | { ok: true; data: Record<string, boolean> }
  | { ok: false; status: number; message: string } {
  const res = await pizzaApiFetch<unknown>('v1/settings/notifications')
  if (!res.ok) return res
  const raw = unwrapApiData<unknown>(res.data) ?? res.data
  const obj =
    raw && typeof raw === 'object' && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {}
  const booleans: Record<string, boolean> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'boolean') booleans[k] = v
  }
  return { ok: true, data: booleans }
}

export async function apiPutNotifications(body: Record<string, boolean>) {
  return pizzaApiFetch<unknown>('v1/settings/notifications', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export type BusinessHourRow = {
  day: string
  is_open?: boolean
  open_time?: string
  close_time?: string
}

export async function apiGetBusinessHours():
  | { ok: true; data: BusinessHourRow[] }
  | { ok: false; status: number; message: string } {
  const res = await pizzaApiFetch<unknown>('v1/settings/business-hours')
  if (!res.ok) return res
  const inner = unwrapApiData<unknown>(res.data) ?? res.data
  const obj =
    inner && typeof inner === 'object' && !Array.isArray(inner)
      ? (inner as Record<string, unknown>)
      : null
  const hoursFromObject = Array.isArray(obj?.hours) ? obj.hours : null
  const arr =
    Array.isArray(inner)
      ? inner
      : hoursFromObject ??
        unwrapApiArray<BusinessHourRow>(inner ?? res.data)
  return { ok: true, data: arr as BusinessHourRow[] }
}

export async function apiPutBusinessHours(hours: BusinessHourRow[]) {
  return pizzaApiFetch<unknown>('v1/settings/business-hours', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hours }),
  })
}

export async function apiGetPayments():
  | { ok: true; data: unknown }
  | { ok: false; status: number; message: string } {
  const res = await pizzaApiFetch<unknown>('v1/settings/payments')
  if (!res.ok) return res
  const inner = unwrapApiData<unknown>(res.data) ?? res.data
  return { ok: true, data: inner }
}

export async function apiPutPayments(body: unknown) {
  return pizzaApiFetch<unknown>('v1/settings/payments', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}
