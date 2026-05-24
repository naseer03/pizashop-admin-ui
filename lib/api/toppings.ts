import { pizzaApiFetch } from '@/lib/api/client'
import { TOPPINGS_LIST_PATH, upstreamApiUrl } from '@/lib/api/config'
import { unwrapApiArray, unwrapApiData } from '@/lib/api/unwrap'

/** Resolved upstream URL: `https://pizzaapi.lefruit.in/v1/toppings` (via proxy in the browser). */
export const TOPPINGS_LIST_URL = upstreamApiUrl(TOPPINGS_LIST_PATH)

export type ApiTopping = Record<string, unknown>

type ApiFail = { ok: false; status: number; message: string }

function toppingStableId(raw: ApiTopping): string | null {
  const id = raw.id ?? raw.topping_id ?? raw.toppingId
  if (id == null || id === '') return null
  return String(id)
}

/** Collect category ids from `category_ids`, nested `categories`, and legacy `category_id`. */
function categoryIdsFromToppingRecord(
  rec: ApiTopping,
  parentCategoryId?: unknown,
): number[] {
  const set = new Set<number>()
  const add = (raw: unknown) => {
    if (raw == null || raw === '') return
    const n = typeof raw === 'number' ? raw : Number.parseInt(String(raw), 10)
    if (Number.isFinite(n) && n > 0) set.add(n)
  }

  const ids = rec.category_ids
  if (Array.isArray(ids)) {
    for (const x of ids) add(x)
  }

  const nested = rec.categories
  if (Array.isArray(nested)) {
    for (const c of nested) {
      if (c && typeof c === 'object') {
        add((c as Record<string, unknown>).id)
      }
    }
  }

  add(rec.category_id ?? rec.categoryId)
  add(parentCategoryId)

  return Array.from(set)
}

function mergeToppingRecords(
  existing: ApiTopping,
  incoming: ApiTopping,
  parentCategoryId?: unknown,
): ApiTopping {
  const merged = { ...existing, ...incoming }
  const categoryIds = [
    ...categoryIdsFromToppingRecord(existing, parentCategoryId),
    ...categoryIdsFromToppingRecord(incoming, parentCategoryId),
  ]
  const unique = [...new Set(categoryIds)]
  if (unique.length) merged.category_ids = unique
  return merged
}

/** One row per topping id (API may repeat the same topping under multiple categories). */
function dedupeToppingsById(list: ApiTopping[]): ApiTopping[] {
  const byId = new Map<string, ApiTopping>()
  const noId: ApiTopping[] = []

  for (const raw of list) {
    if (!raw || typeof raw !== 'object') continue
    const rec = { ...(raw as ApiTopping) }
    const key = toppingStableId(rec)
    if (!key) {
      noId.push(rec)
      continue
    }
    const prev = byId.get(key)
    byId.set(key, prev ? mergeToppingRecords(prev, rec) : rec)
  }

  return [...byId.values(), ...noId]
}

function extractToppingsFromGroupedCategories(
  grouped: unknown[],
): ApiTopping[] {
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
      const ids = categoryIdsFromToppingRecord(rec, parentCategoryId)
      if (ids.length) rec.category_ids = ids
      if (rec.category_id == null && ids[0] != null) {
        rec.category_id = ids[0]
      }
      out.push(rec)
    }
  }
  return dedupeToppingsById(out)
}

function extractToppingsList(json: unknown): ApiTopping[] {
  const inner = unwrapApiData<unknown>(json) ?? json

  if (inner && typeof inner === 'object') {
    const o = inner as Record<string, unknown>

    /** Current API: `{ success, data: { toppings: [...] } }` */
    if (Array.isArray(o.toppings)) {
      return dedupeToppingsById(o.toppings as ApiTopping[])
    }

    /** Legacy / alternate: `{ data: { categories: [{ toppings: [...] }] } }` */
    const grouped = o.categories
    if (Array.isArray(grouped) && grouped.length) {
      return extractToppingsFromGroupedCategories(grouped)
    }
  }

  const flat = unwrapApiArray<ApiTopping>(json)
  if (flat.length) return dedupeToppingsById(flat)

  const fromInner = unwrapApiArray<ApiTopping>(inner)
  if (fromInner.length) return dedupeToppingsById(fromInner)

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
  const res = await pizzaApiFetch<unknown>(
    `${TOPPINGS_LIST_PATH}${q ? `?${q}` : ''}`,
  )
  if (!res.ok) return res
  return { ok: true, data: extractToppingsList(res.data) }
}

export async function apiCreateTopping(body: Record<string, unknown>) {
  return pizzaApiFetch<unknown>(TOPPINGS_LIST_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export async function apiUpdateTopping(
  toppingId: string,
  body: Record<string, unknown>,
) {
  return pizzaApiFetch<unknown>(
    `${TOPPINGS_LIST_PATH}/${encodeURIComponent(toppingId)}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  )
}

export async function apiDeleteTopping(toppingId: string) {
  return pizzaApiFetch<unknown>(
    `${TOPPINGS_LIST_PATH}/${encodeURIComponent(toppingId)}`,
    { method: 'DELETE' },
  )
}

