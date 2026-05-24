/**
 * Browser calls go through the Next.js proxy at `/api/pizza/*` (see `app/api/pizza/[...path]/route.ts`)
 * so we avoid CORS issues with the upstream PizzaHub API.
 */
export const API_PROXY_PREFIX = '/api/pizza'

/** Upstream origin (proxy target). Override with `PIZZA_API_BASE_URL` in `.env.local`. */
export const PIZZA_API_ORIGIN = 'https://pizzaapi.lefruit.in'

/** List toppings — `GET https://pizzaapi.lefruit.in/v1/toppings` */
export const TOPPINGS_LIST_PATH = 'v1/toppings'

/** List crusts — `GET https://pizzaapi.lefruit.in/v1/crusts` */
export const CRUSTS_LIST_PATH = 'v1/crusts'

export function apiUrl(apiPath: string): string {
  const trimmed = apiPath.replace(/^\/+/, '')
  return `${API_PROXY_PREFIX}/${trimmed}`
}

export function upstreamApiUrl(apiPath: string): string {
  const trimmed = apiPath.replace(/^\/+/, '')
  return `${PIZZA_API_ORIGIN}/${trimmed}`
}
