import { pizzaApiFetch } from '@/lib/api/client'
import { unwrapApiArray, unwrapApiData } from '@/lib/api/unwrap'

export type ApiOrder = Record<string, unknown>

export type OrdersListMeta = {
  page?: number
  per_page?: number
  total?: number
  total_pages?: number
}

type ApiFail = { ok: false; status: number; message: string }

function extractOrdersPayload(json: unknown): {
  orders: ApiOrder[]
  meta: OrdersListMeta
} {
  const inner = unwrapApiData<unknown>(json) ?? json
  if (inner && typeof inner === 'object') {
    const o = inner as Record<string, unknown>
    const orders = Array.isArray(o.orders) ? (o.orders as ApiOrder[]) : []
    const meta: OrdersListMeta = {}
    if (typeof o.page === 'number') meta.page = o.page
    if (typeof o.per_page === 'number') meta.per_page = o.per_page
    if (typeof o.total === 'number') meta.total = o.total
    if (typeof o.total_pages === 'number') meta.total_pages = o.total_pages
    if (orders.length || Object.keys(meta).length) {
      return { orders, meta }
    }
  }

  const flat = unwrapApiArray<ApiOrder>(json)
  if (flat.length) return { orders: flat, meta: {} }

  const fromInner = unwrapApiArray<ApiOrder>(inner)
  return { orders: fromInner, meta: {} }
}

export type ListOrdersParams = {
  page?: number
  per_page?: number
  status?: string | null
  order_type?: string | null
  payment_status?: string | null
  date_from?: string | null
  date_to?: string | null
  search?: string | null
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export async function apiListOrders(
  params: ListOrdersParams = {},
): Promise<
  | { ok: true; data: ApiOrder[]; meta: OrdersListMeta }
  | ApiFail
> {
  const qs = new URLSearchParams()
  qs.set('page', String(params.page ?? 1))
  qs.set('per_page', String(params.per_page ?? 20))
  qs.set('sort_by', params.sort_by ?? 'created_at')
  qs.set('sort_order', params.sort_order ?? 'desc')

  if (params.status) qs.set('status', params.status)
  if (params.order_type) qs.set('order_type', params.order_type)
  if (params.payment_status) qs.set('payment_status', params.payment_status)
  if (params.date_from) qs.set('date_from', params.date_from)
  if (params.date_to) qs.set('date_to', params.date_to)
  if (params.search?.trim()) qs.set('search', params.search.trim())

  const res = await pizzaApiFetch<unknown>(`v1/orders?${qs.toString()}`)
  if (!res.ok) return res

  const { orders, meta } = extractOrdersPayload(res.data)
  return { ok: true, data: orders, meta }
}
