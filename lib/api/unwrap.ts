/** Normalize single-resource payloads from `{ success, data }` envelopes. */

export function unwrapApiData<T>(json: unknown): T | null {
  if (json == null) return null
  if (typeof json !== 'object') return json as T
  const o = json as Record<string, unknown>
  if (o.success === true && 'data' in o) {
    const d = o.data
    if (d == null) return null
    return d as T
  }
  return json as T
}

/** Normalize list payloads from PizzaHub-style `{ success, data }` envelopes. */

export function unwrapApiArray<T>(json: unknown): T[] {
  if (Array.isArray(json)) return json as T[]
  if (!json || typeof json !== 'object') return []
  const o = json as Record<string, unknown>
  let inner: unknown = o
  if (o.success === true && 'data' in o && o.data !== undefined) {
    inner = o.data
  }
  if (Array.isArray(inner)) return inner as T[]
  if (inner && typeof inner === 'object') {
    const d = inner as Record<string, unknown>
    if (Array.isArray(d.items)) return d.items as T[]
    if (Array.isArray(d.data)) return d.data as T[]
    if (Array.isArray(d.results)) return d.results as T[]
  }
  return []
}
