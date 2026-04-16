import { pizzaApiFetch } from '@/lib/api/client'
import { unwrapApiArray, unwrapApiData } from '@/lib/api/unwrap'

export type ApiTopping = Record<string, unknown>

type ApiFail = { ok: false; status: number; message: string }

function extractToppingsList(json: unknown): ApiTopping[] {
  const direct = unwrapApiArray<ApiTopping>(json)
  if (direct.length) return direct

  const inner = unwrapApiData<unknown>(json) ?? json
  return unwrapApiArray<ApiTopping>(inner)
}

export async function apiListToppings():
  | { ok: true; data: ApiTopping[] }
  | ApiFail {
  const res = await pizzaApiFetch<unknown>('v1/toppings')
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

