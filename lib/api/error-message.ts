/**
 * Extract a human-readable message from PizzaHub API error JSON.
 */
export function parseApiErrorMessage(json: unknown, fallback: string): string {
  if (!json || typeof json !== 'object') return fallback
  const o = json as Record<string, unknown>

  const err = o.error
  if (err && typeof err === 'object') {
    const rec = err as Record<string, unknown>
    const msg = rec.message
    if (typeof msg === 'string' && msg.trim()) return msg.trim()

    const details = rec.details
    if (details && typeof details === 'object') {
      const parts: string[] = []
      for (const [key, val] of Object.entries(details as Record<string, unknown>)) {
        if (Array.isArray(val)) {
          parts.push(`${key}: ${val.map(String).join(', ')}`)
        } else if (val != null) {
          parts.push(`${key}: ${String(val)}`)
        }
      }
      if (parts.length) return parts.join('; ')
    }
  }

  const detail = o.detail
  if (typeof detail === 'string' && detail.trim()) return detail.trim()
  if (Array.isArray(detail)) {
    const parts = detail
      .map((d) => {
        if (typeof d === 'string') return d
        if (d && typeof d === 'object' && 'msg' in d) {
          return String((d as { msg?: unknown }).msg ?? '')
        }
        return ''
      })
      .filter(Boolean)
    if (parts.length) return parts.join('; ')
  }

  if (typeof o.message === 'string' && o.message.trim()) return o.message.trim()

  return fallback
}
