/**
 * Browser calls go through the Next.js proxy at `/api/pizza/*` (see `app/api/pizza/[...path]/route.ts`)
 * so we avoid CORS issues with https://pizzaapi.lefruit.in .
 */
export const API_PROXY_PREFIX = '/api/pizza'

export function apiUrl(apiPath: string): string {
  const trimmed = apiPath.replace(/^\/+/, '')
  return `${API_PROXY_PREFIX}/${trimmed}`
}
