import { pizzaApiFetch } from '@/lib/api/client'
import { CRUSTS_LIST_PATH, upstreamApiUrl } from '@/lib/api/config'
import { unwrapApiArray, unwrapApiData } from '@/lib/api/unwrap'

/** Resolved upstream URL: `https://pizzaapi.lefruit.in/v1/crusts` (via proxy in the browser). */
export const CRUSTS_LIST_URL = upstreamApiUrl(CRUSTS_LIST_PATH)

export type ApiCrust = Record<string, unknown>

type ApiFail = { ok: false; status: number; message: string }

function crustStableId(raw: ApiCrust): string | null {
  const id = raw.id ?? raw.crust_id ?? raw.crustId
  if (id == null || id === '') return null
  return String(id)
}

function categoryIdsFromCrustRecord(
  rec: ApiCrust,
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

function mergeCrustRecords(
  existing: ApiCrust,
  incoming: ApiCrust,
  parentCategoryId?: unknown,
): ApiCrust {
  const merged = { ...existing, ...incoming }
  const categoryIds = [
    ...categoryIdsFromCrustRecord(existing, parentCategoryId),
    ...categoryIdsFromCrustRecord(incoming, parentCategoryId),
  ]
  const unique = [...new Set(categoryIds)]
  if (unique.length) merged.category_ids = unique
  return merged
}

function dedupeCrustsById(list: ApiCrust[]): ApiCrust[] {
  const byId = new Map<string, ApiCrust>()
  const noId: ApiCrust[] = []

  for (const raw of list) {
    if (!raw || typeof raw !== 'object') continue
    const rec = { ...(raw as ApiCrust) }
    const key = crustStableId(rec)
    if (!key) {
      noId.push(rec)
      continue
    }
    const prev = byId.get(key)
    byId.set(key, prev ? mergeCrustRecords(prev, rec) : rec)
  }

  return [...byId.values(), ...noId]
}

function extractCrustsFromGroupedCategories(grouped: unknown[]): ApiCrust[] {
  const out: ApiCrust[] = []
  for (const cat of grouped) {
    if (!cat || typeof cat !== 'object') continue
    const catRec = cat as Record<string, unknown>
    const parentCategoryId = catRec.id
    const crusts = catRec.crusts
    if (!Array.isArray(crusts)) continue
    for (const c of crusts) {
      if (!c || typeof c !== 'object') continue
      const rec = { ...(c as ApiCrust) }
      const ids = categoryIdsFromCrustRecord(rec, parentCategoryId)
      if (ids.length) rec.category_ids = ids
      if (rec.category_id == null && ids[0] != null) {
        rec.category_id = ids[0]
      }
      out.push(rec)
    }
  }
  return dedupeCrustsById(out)
}

function extractCrustsList(json: unknown): ApiCrust[] {
  const inner = unwrapApiData<unknown>(json) ?? json

  if (inner && typeof inner === 'object') {
    const o = inner as Record<string, unknown>

    /** Current API: `{ success, data: { crusts: [...] } }` */
    if (Array.isArray(o.crusts)) {
      return dedupeCrustsById(o.crusts as ApiCrust[])
    }

    /** Legacy: `{ data: { categories: [{ crusts: [...] }] } }` */
    const grouped = o.categories
    if (Array.isArray(grouped) && grouped.length) {
      return extractCrustsFromGroupedCategories(grouped)
    }
  }

  const flat = unwrapApiArray<ApiCrust>(json)
  if (flat.length) return dedupeCrustsById(flat)

  const fromInner = unwrapApiArray<ApiCrust>(inner)
  if (fromInner.length) return dedupeCrustsById(fromInner)

  return []
}

export type ListCrustsParams = {
  category_id?: number
  is_available?: boolean
}

export async function apiListCrusts(
  params: ListCrustsParams = {},
): Promise<
  | { ok: true; data: ApiCrust[] }
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
    `${CRUSTS_LIST_PATH}${q ? `?${q}` : ''}`,
  )
  if (!res.ok) return res
  return { ok: true, data: extractCrustsList(res.data) }
}

export async function apiCreateCrust(body: Record<string, unknown>) {
  return pizzaApiFetch<unknown>(CRUSTS_LIST_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export async function apiUpdateCrust(
  crustId: string,
  body: Record<string, unknown>,
) {
  return pizzaApiFetch<unknown>(
    `${CRUSTS_LIST_PATH}/${encodeURIComponent(crustId)}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  )
}

export async function apiDeleteCrust(crustId: string) {
  return pizzaApiFetch<unknown>(
    `${CRUSTS_LIST_PATH}/${encodeURIComponent(crustId)}`,
    { method: 'DELETE' },
  )
}
