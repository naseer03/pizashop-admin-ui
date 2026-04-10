/**
 * Server-only: upstream for the `/api/pizza` proxy.
 * Override with `PIZZA_API_BASE_URL` in `.env.local` (no trailing slash).
 */
export const DEFAULT_PIZZA_API_BASE = 'https://pizzaapi.lefruit.in'

export function getPizzaApiBaseUrl(): string {
  const raw = process.env.PIZZA_API_BASE_URL?.trim() || DEFAULT_PIZZA_API_BASE
  return raw.replace(/\/$/, '')
}
