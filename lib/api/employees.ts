import { pizzaApiFetch } from '@/lib/api/client'
import { unwrapApiArray, unwrapApiData } from '@/lib/api/unwrap'

export type ApiEmployee = {
  id?: unknown
  first_name?: string | null
  last_name?: string | null
  name?: string | null
  email?: string | null
  phone?: string | null
  status?: string | null
  role_id?: unknown
  hourly_rate?: unknown
  hire_date?: string | null
  date_of_birth?: string | null
  address?: string | null
  emergency_contact_name?: string | null
  emergency_contact_phone?: string | null
  schedule?: Array<Record<string, unknown>> | null
  created_at?: string | null
  role?: { id?: unknown; name?: string | null } | null
}

type ApiFail = { ok: false; status: number; message: string }

function extractEmployeesList(json: unknown): ApiEmployee[] {
  const direct = unwrapApiArray<ApiEmployee>(json)
  if (direct.length) return direct

  const inner = unwrapApiData<unknown>(json)
  const fromInner = unwrapApiArray<ApiEmployee>(inner)
  if (fromInner.length) return fromInner

  const obj =
    inner && typeof inner === 'object' && !Array.isArray(inner)
      ? (inner as Record<string, unknown>)
      : null
  if (!obj) return []

  if (Array.isArray(obj.employees)) return obj.employees as ApiEmployee[]
  if (Array.isArray(obj.rows)) return obj.rows as ApiEmployee[]
  if (Array.isArray(obj.list)) return obj.list as ApiEmployee[]
  return []
}

export async function apiListEmployees(params: {
  page?: number
  per_page?: number
  status?: string
  role_id?: number
  search?: string
} = {}): Promise<{ ok: true; data: ApiEmployee[] } | ApiFail> {
  const qs = new URLSearchParams()
  if (params.page != null) qs.set('page', String(params.page))
  if (params.per_page != null) qs.set('per_page', String(params.per_page))
  if (params.status) qs.set('status', params.status)
  if (params.role_id != null) qs.set('role_id', String(params.role_id))
  if (params.search) qs.set('search', params.search)
  const q = qs.toString()
  const res = await pizzaApiFetch<unknown>(`v1/employees${q ? `?${q}` : ''}`)
  if (!res.ok) return res
  return { ok: true, data: extractEmployeesList(res.data) }
}

export async function apiCreateEmployee(body: {
  first_name: string
  last_name: string
  email: string
  phone?: string | null
  role_id: number
  hourly_rate: number
  hire_date: string
  date_of_birth: string
  address: string
  emergency_contact_name: string
  emergency_contact_phone: string
  schedule: Array<Record<string, unknown>>
  password: string
}) {
  return pizzaApiFetch<unknown>('v1/employees', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export async function apiUpdateEmployee(
  employeeId: number,
  body: {
    first_name: string
    last_name: string
    email: string
    phone?: string | null
    role_id: number
    hourly_rate: number
    hire_date: string
    date_of_birth: string
    address: string
    emergency_contact_name: string
    emergency_contact_phone: string
    schedule: Array<Record<string, unknown>>
    password?: string
  },
) {
  return pizzaApiFetch<unknown>(`v1/employees/${employeeId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export async function apiPatchEmployeeStatus(
  employeeId: number,
  status: 'active' | 'inactive',
) {
  return pizzaApiFetch<unknown>(`v1/employees/${employeeId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
}

export async function apiDeleteEmployee(employeeId: number) {
  return pizzaApiFetch<unknown>(`v1/employees/${employeeId}`, {
    method: 'DELETE',
  })
}
