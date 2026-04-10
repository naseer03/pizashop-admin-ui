import { pizzaApiFetch } from '@/lib/api/client'
import { unwrapApiArray, unwrapApiData } from '@/lib/api/unwrap'

export type ApiInventoryItem = {
  id?: unknown
  name?: string | null
  sku?: string | null
  category?: string | null
  unit?: string | null
  current_stock?: unknown
  min_stock_level?: unknown
  reorder_level?: unknown
  updated_at?: string | null
  created_at?: string | null
}

type ApiFail = { ok: false; status: number; message: string }

function extractInventoryList(json: unknown): ApiInventoryItem[] {
  const direct = unwrapApiArray<ApiInventoryItem>(json)
  if (direct.length) return direct

  const inner = unwrapApiData<unknown>(json)
  const fromInner = unwrapApiArray<ApiInventoryItem>(inner)
  if (fromInner.length) return fromInner

  if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
    const o = inner as Record<string, unknown>
    if (Array.isArray(o.inventory)) return o.inventory as ApiInventoryItem[]
    if (Array.isArray(o.rows)) return o.rows as ApiInventoryItem[]
    if (Array.isArray(o.list)) return o.list as ApiInventoryItem[]
  }
  return []
}

export async function apiListInventory(params: {
  page?: number
  per_page?: number
  category?: string
  low_stock?: boolean
  search?: string
} = {}): Promise<{ ok: true; data: ApiInventoryItem[] } | ApiFail> {
  const qs = new URLSearchParams()
  if (params.page != null) qs.set('page', String(params.page))
  if (params.per_page != null) qs.set('per_page', String(params.per_page))
  if (params.category) qs.set('category', params.category)
  if (params.low_stock != null) qs.set('low_stock', String(params.low_stock))
  if (params.search) qs.set('search', params.search)
  const q = qs.toString()
  const res = await pizzaApiFetch<unknown>(`v1/inventory${q ? `?${q}` : ''}`)
  if (!res.ok) return res
  return { ok: true, data: extractInventoryList(res.data) }
}

export async function apiCreateInventory(body: {
  name: string
  category: string
  unit: string
  current_stock?: number
  min_stock_level?: number
  reorder_level?: number
  sku?: string | null
  unit_cost?: number
  supplier_name?: string | null
  supplier_contact?: string | null
}) {
  return pizzaApiFetch<unknown>('v1/inventory', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export async function apiUpdateInventory(
  invId: number,
  body: {
    name: string
    category: string
    unit: string
    current_stock?: number
    min_stock_level?: number
    reorder_level?: number
    sku?: string | null
    unit_cost?: number
    supplier_name?: string | null
    supplier_contact?: string | null
  },
) {
  return pizzaApiFetch<unknown>(`v1/inventory/${invId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export async function apiDeleteInventory(invId: number) {
  return pizzaApiFetch<unknown>(`v1/inventory/${invId}`, {
    method: 'DELETE',
  })
}
