import { pizzaApiFetch } from '@/lib/api/client'
import { unwrapApiArray, unwrapApiData } from '@/lib/api/unwrap'

export type ApiCrust = Record<string, unknown>

type ApiFail = { ok: false; status: number; message: string }

function extractCrustsList(json: unknown): ApiCrust[] {
  const direct = unwrapApiArray<ApiCrust>(json)
  if (direct.length) return direct

  const inner = unwrapApiData<unknown>(json) ?? json
  const flat = unwrapApiArray<ApiCrust>(inner)
  if (flat.length) return flat

  if (inner && typeof inner === 'object') {
    const o = inner as Record<string, unknown>
    const grouped = o.categories
    if (Array.isArray(grouped)) {
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

export async function apiListCrusts():
  | { ok: true; data: ApiCrust[] }
  | ApiFail {
  const res = await pizzaApiFetch<unknown>('v1/crusts')
  if (!res.ok) return res
  return { ok: true, data: extractCrustsList(res.data) }
}

export async function apiCreateCrust(body: Record<string, unknown>) {
  return pizzaApiFetch<unknown>('v1/crusts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export async function apiUpdateCrust(
  crustId: string,
  body: Record<string, unknown>,
) {
  return pizzaApiFetch<unknown>(`v1/crusts/${encodeURIComponent(crustId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export async function apiDeleteCrust(crustId: string) {
  return pizzaApiFetch<unknown>(`v1/crusts/${encodeURIComponent(crustId)}`, {
    method: 'DELETE',
  })
}
