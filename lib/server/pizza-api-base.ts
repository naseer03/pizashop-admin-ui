/**
 * Server-only: upstream for the `/api/pizza` proxy.
 * Override with `PIZZA_API_BASE_URL` in `.env.local` (origin only, no trailing slash).
 * Do not include `/v1` — paths already start with `v1/...`.
 */
export const DEFAULT_PIZZA_API_BASE = 'https://pizzaapi.lefruit.in'

export function getPizzaApiBaseUrl(): string {
  let raw = process.env.PIZZA_API_BASE_URL?.trim() || DEFAULT_PIZZA_API_BASE
  raw = raw.replace(/\/$/, '')
  if (/\/v1$/i.test(raw)) {
    raw = raw.replace(/\/v1$/i, '')
  }
  return raw
}
