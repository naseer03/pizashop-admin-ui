'use client'

import { apiUrl } from '@/lib/api/config'
import { clearDummySession, getAccessToken } from '@/lib/auth'

type Json = Record<string, unknown>

type ApiFail = { ok: false; status: number; message: string }

/**
 * True when the API rejected the session (401). `pizzaApiFetch` clears storage and sends the
 * browser to `/login` with a `redirect` back to the current page — do not surface `message` to the UI.
 */
export function isUnauthorizedApiError(res: {
  ok: boolean
  status?: number
}): boolean {
  return res.ok === false && res.status === 401
}

function redirectToLoginForReauth() {
  if (typeof window === 'undefined') return
  clearDummySession()
  const path = window.location.pathname + window.location.search
  const qs =
    path && path !== '/login'
      ? `?redirect=${encodeURIComponent(path)}`
      : ''
  window.location.assign(`/login${qs}`)
}

/**
 * Call PizzaHub API through the same-origin `/api/pizza` proxy with Bearer auth when logged in.
 */
export async function pizzaApiFetch<T = Json>(
  pathFromV1: string,
  init: RequestInit = {},
): Promise<{ ok: true; data: T } | ApiFail> {
  const path = pathFromV1.replace(/^\/+/, '')
  const token = getAccessToken()

  const headers = new Headers(init.headers)
  if (!headers.has('Accept')) headers.set('Accept', 'application/json')
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const res = await fetch(apiUrl(path), {
    ...init,
    headers,
  })

  if (res.status === 204 || res.status === 205 || res.status === 304) {
    return { ok: true, data: {} as T }
  }

  let body: unknown = null
  try {
    body = await res.json()
  } catch {
    body = null
  }

  if (!res.ok) {
    if (res.status === 401) {
      redirectToLoginForReauth()
      return { ok: false, status: 401, message: '' }
    }
    let message = `Request failed (${res.status}).`
    if (body && typeof body === 'object' && 'error' in body) {
      const err = (body as { error?: { message?: string } }).error
      if (err?.message) message = err.message
    }
    return { ok: false, status: res.status, message }
  }

  return { ok: true, data: body as T }
}
