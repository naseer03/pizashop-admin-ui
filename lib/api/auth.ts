import { apiUrl } from '@/lib/api/config'

export type LoginResult =
  | { ok: true; accessToken: string; refreshToken?: string }
  | { ok: false; message: string }

function pickStr(o: Record<string, unknown>, key: string): string | null {
  const v = o[key]
  return typeof v === 'string' && v.length > 0 ? v : null
}

function extractTokens(data: Record<string, unknown>): {
  accessToken: string
  refreshToken?: string
} | null {
  const access =
    pickStr(data, 'access_token') ??
    pickStr(data, 'accessToken') ??
    pickStr(data, 'token')
  if (!access) return null

  const refresh =
    pickStr(data, 'refresh_token') ?? pickStr(data, 'refreshToken')

  return { accessToken: access, refreshToken: refresh ?? undefined }
}

function parseTokensFromJson(json: unknown): {
  accessToken: string
  refreshToken?: string
} | null {
  if (!json || typeof json !== 'object') return null
  const root = json as Record<string, unknown>

  const candidates: Record<string, unknown>[] = [root]
  if (root.success === true && root.data && typeof root.data === 'object') {
    const data = root.data as Record<string, unknown>
    candidates.push(data)
    for (const key of ['tokens', 'auth', 'session'] as const) {
      const inner = data[key]
      if (inner && typeof inner === 'object') {
        candidates.push(inner as Record<string, unknown>)
      }
    }
  }

  for (const c of candidates) {
    const t = extractTokens(c)
    if (t) return t
  }

  return null
}

function errorMessageFromJson(json: unknown, fallback: string): string {
  if (json && typeof json === 'object') {
    const o = json as Record<string, unknown>
    const err = o.error
    if (err && typeof err === 'object' && 'message' in err) {
      const m = (err as { message?: unknown }).message
      if (typeof m === 'string' && m.length > 0) return m
    }
    if (typeof o.message === 'string' && o.message.length > 0) return o.message
  }
  return fallback
}

export async function loginWithEmailPassword(
  email: string,
  password: string,
): Promise<LoginResult> {
  const res = await fetch(apiUrl('v1/auth/login'), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  })

  let json: unknown = null
  try {
    json = await res.json()
  } catch {
    json = null
  }

  if (!res.ok) {
    return {
      ok: false,
      message: errorMessageFromJson(
        json,
        res.status === 401
          ? 'Invalid email or password.'
          : `Sign-in failed (${res.status}).`,
      ),
    }
  }

  if (
    json &&
    typeof json === 'object' &&
    (json as Record<string, unknown>).success === false
  ) {
    return {
      ok: false,
      message: errorMessageFromJson(json, 'Sign-in failed.'),
    }
  }

  const tokens = parseTokensFromJson(json)
  if (!tokens) {
    return {
      ok: false,
      message:
        'Signed in but the response did not include an access token. Check the API response shape against lib/api/auth.ts.',
    }
  }

  return { ok: true, ...tokens }
}

export async function logoutRequest(accessToken: string | undefined): Promise<void> {
  if (!accessToken) return
  try {
    await fetch(apiUrl('v1/auth/logout'), {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    })
  } catch {
    /* ignore network errors on logout */
  }
}
