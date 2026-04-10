'use client'

import {
  AUTH_SESSION_COOKIE,
  AUTH_ACCESS_TOKEN_KEY,
  AUTH_REFRESH_TOKEN_KEY,
  AUTH_DISPLAY_EMAIL_KEY,
} from '@/lib/auth-constants'

export { AUTH_SESSION_COOKIE }

const MAX_AGE_SECONDS = 60 * 60 * 24 * 7

export function setSession(tokens: {
  accessToken: string
  refreshToken?: string
  email?: string
}) {
  if (typeof document === 'undefined') return
  const value = encodeURIComponent('1')
  document.cookie = `${AUTH_SESSION_COOKIE}=${value}; Path=/; Max-Age=${MAX_AGE_SECONDS}; SameSite=Lax`
  try {
    sessionStorage.setItem(AUTH_ACCESS_TOKEN_KEY, tokens.accessToken)
    if (tokens.refreshToken) {
      sessionStorage.setItem(AUTH_REFRESH_TOKEN_KEY, tokens.refreshToken)
    } else {
      sessionStorage.removeItem(AUTH_REFRESH_TOKEN_KEY)
    }
    if (tokens.email) {
      sessionStorage.setItem(AUTH_DISPLAY_EMAIL_KEY, tokens.email)
    } else {
      sessionStorage.removeItem(AUTH_DISPLAY_EMAIL_KEY)
    }
  } catch {
    /* ignore */
  }
}

export function getAccessToken(): string | null {
  if (typeof sessionStorage === 'undefined') return null
  try {
    return sessionStorage.getItem(AUTH_ACCESS_TOKEN_KEY)
  } catch {
    return null
  }
}

export function clearDummySession() {
  if (typeof document === 'undefined') return
  document.cookie = `${AUTH_SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`
  try {
    sessionStorage.removeItem(AUTH_ACCESS_TOKEN_KEY)
    sessionStorage.removeItem(AUTH_REFRESH_TOKEN_KEY)
    sessionStorage.removeItem(AUTH_DISPLAY_EMAIL_KEY)
  } catch {
    /* ignore */
  }
}
