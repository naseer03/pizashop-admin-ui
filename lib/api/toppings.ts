import { pizzaApiFetch } from '@/lib/api/client'
import { unwrapApiArray, unwrapApiData } from '@/lib/api/unwrap'

export type ApiTopping = Record<string, unknown>

type ApiFail = { ok: false; status: number; message: string }

function extractToppingsList(json: unknown): ApiTopping[] {
  const direct = unwrapApiArray<ApiTopping>(json)
  if (direct.length) return direct

  const inner = unwrapApiData<unknown>(json) ?? json
  const flat = unwrapApiArray<ApiTopping>(inner)
  if (flat.length) return flat

  if (inner && typeof inner === 'object') {
    const o = inner as Record<string, unknown>
    const grouped = o.categories
    if (Array.isArray(grouped)) {
      const out: ApiTopping[] = []
      for (const cat of grouped) {
        if (!cat || typeof cat !== 'object') continue
        const catRec = cat as Record<string, unknown>
        const parentCategoryId = catRec.id
        const toppings = catRec.toppings
        if (!Array.isArray(toppings)) continue
        for (const t of toppings) {
          if (!t || typeof t !== 'object') continue
          const rec = { ...(t as ApiTopping) }
          if (rec.category_id == null && parentCategoryId != null) {
            rec.category_id = parentCategoryId
          }
          out.push(rec)
        }
      }
      if (out.length) return out
    }
  }

  return []
}

export type ListToppingsParams = {
  category_id?: number
  is_available?: boolean
}

export async function apiListToppings(
  params: ListToppingsParams = {},
): Promise<
  | { ok: true; data: ApiTopping[] }
  | ApiFail
> {
  const qs = new URLSearchParams()
  if (params.category_id != null) {
    qs.set('category_id', String(params.category_id))
  }
  if (params.is_available != null) {
    qs.set('is_available', String(params.is_available))
  }
  const q = qs.toString()
  const res = await pizzaApiFetch<unknown>(`v1/toppings${q ? `?${q}` : ''}`)
  if (!res.ok) return res
  return { ok: true, data: extractToppingsList(res.data) }
}

export async function apiCreateTopping(body: Record<string, unknown>) {
  return pizzaApiFetch<unknown>('v1/toppings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export async function apiUpdateTopping(
  toppingId: string,
  body: Record<string, unknown>,
) {
  return pizzaApiFetch<unknown>(`v1/toppings/${encodeURIComponent(toppingId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export async function apiDeleteTopping(toppingId: string) {
  return pizzaApiFetch<unknown>(`v1/toppings/${encodeURIComponent(toppingId)}`, {
    method: 'DELETE',
  })
}

