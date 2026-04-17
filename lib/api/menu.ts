import { pizzaApiFetch } from '@/lib/api/client'
import { unwrapApiArray } from '@/lib/api/unwrap'

export type ApiSubcategory = {
  id: number
  name: string
  category_id?: number
}

export type ApiCategory = {
  id: number
  name: string
  slug?: string
  description?: string | null
  has_sizes?: boolean
  subcategories?: ApiSubcategory[]
}

export type ApiMenuSize = {
  size: string
  price: number
  is_default?: boolean
}

export type ApiMenuItem = {
  id: number
  name: string
  description?: string | null
  category_id?: number
  subcategory_id?: number | null
  category?: {
    id: number
    name: string
    has_sizes?: boolean
  } | null
  subcategory?: {
    id: number
    name: string
  } | null
  base_price: number
  sizes?: ApiMenuSize[] | null
  is_available?: boolean
  is_featured?: boolean
  image_url?: string | null
  preparation_time_minutes?: number | null
}

export async function apiListCategories(): Promise<
  | { ok: true; data: ApiCategory[] }
  | { ok: false; status: number; message: string }
> {
  const res = await pizzaApiFetch<unknown>('v1/categories')
  if (!res.ok) return res
  return { ok: true, data: unwrapApiArray<ApiCategory>(res.data) }
}

export type ListMenuItemsParams = {
  page?: number
  per_page?: number
  category_id?: number
  subcategory_id?: number
  search?: string
  is_available?: boolean
}

export async function apiListMenuItems(
  params: ListMenuItemsParams = {},
): Promise<
  | { ok: true; data: ApiMenuItem[] }
  | { ok: false; status: number; message: string }
> {
  const qs = new URLSearchParams()
  if (params.page != null) qs.set('page', String(params.page))
  if (params.per_page != null) qs.set('per_page', String(params.per_page))
  if (params.category_id != null) qs.set('category_id', String(params.category_id))
  if (params.subcategory_id != null) {
    qs.set('subcategory_id', String(params.subcategory_id))
  }
  if (params.search) qs.set('search', params.search)
  if (params.is_available != null) {
    qs.set('is_available', String(params.is_available))
  }
  const q = qs.toString()
  const res = await pizzaApiFetch<unknown>(`v1/menu-items${q ? `?${q}` : ''}`)
  if (!res.ok) return res
  return { ok: true, data: unwrapApiArray<ApiMenuItem>(res.data) }
}

export async function apiCreateMenuItem(body: Record<string, unknown> | FormData) {
  const isMultipart = typeof FormData !== 'undefined' && body instanceof FormData
  return pizzaApiFetch<unknown>('v1/menu-items', {
    method: 'POST',
    ...(isMultipart
      ? { body }
      : {
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }),
  })
}

export async function apiUpdateMenuItem(
  itemId: number,
  body: Record<string, unknown>,
) {
  return pizzaApiFetch<unknown>(`v1/menu-items/${itemId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export async function apiDeleteMenuItem(itemId: number) {
  return pizzaApiFetch<unknown>(`v1/menu-items/${itemId}`, {
    method: 'DELETE',
  })
}

export async function apiPatchMenuItemAvailability(
  itemId: number,
  isAvailable: boolean,
) {
  return pizzaApiFetch<unknown>(`v1/menu-items/${itemId}/availability`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_available: isAvailable }),
  })
}
