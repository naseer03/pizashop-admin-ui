'use client'

import { apiUrl } from '@/lib/api/config'
import { parseApiErrorMessage } from '@/lib/api/error-message'
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

function isApiFailureBody(body: unknown): boolean {
  return (
    body != null &&
    typeof body === 'object' &&
    (body as Record<string, unknown>).success === false
  )
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

  const method = (init.method ?? 'GET').toUpperCase()
  if (
    !['GET', 'HEAD'].includes(method) &&
    init.body != null &&
    typeof init.body === 'string' &&
    !headers.has('Content-Type')
  ) {
    headers.set('Content-Type', 'application/json')
  }

  let res: Response
  try {
    res = await fetch(apiUrl(path), {
      ...init,
      headers,
    })
  } catch {
    return {
      ok: false,
      status: 0,
      message:
        'Could not reach the server. Check your connection and that the admin app is running.',
    }
  }

  if (res.status === 204 || res.status === 205 || res.status === 304) {
    return { ok: true, data: {} as T }
  }

  let body: unknown = null
  const text = await res.text()
  if (text) {
    try {
      body = JSON.parse(text) as unknown
    } catch {
      body = null
    }
  }

  const failMessage = parseApiErrorMessage(
    body,
    `Request failed (${res.status}).`,
  )

  if (!res.ok) {
    if (res.status === 401) {
      redirectToLoginForReauth()
      return { ok: false, status: 401, message: '' }
    }
    return { ok: false, status: res.status, message: failMessage }
  }

  if (isApiFailureBody(body)) {
    return { ok: false, status: res.status, message: failMessage }
  }

  return { ok: true, data: body as T }
}
