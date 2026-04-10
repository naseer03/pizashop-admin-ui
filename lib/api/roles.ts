import { pizzaApiFetch } from '@/lib/api/client'
import { unwrapApiArray } from '@/lib/api/unwrap'

export type ApiPermission = {
  id?: unknown
  permission_id?: unknown
  code?: string | null
  name?: string | null
  description?: string | null
}

export type ApiRole = {
  id?: unknown
  name?: string | null
  description?: string | null
  permission_ids?: unknown[]
  permissions?: Array<{ id?: unknown; permission_id?: unknown }>
  user_count?: unknown
  users_count?: unknown
  employee_count?: unknown
  employees_count?: unknown
}

type ApiFail = { ok: false; status: number; message: string }

export async function apiListRoles():
  | { ok: true; data: ApiRole[] }
  | ApiFail {
  const res = await pizzaApiFetch<unknown>('v1/roles')
  if (!res.ok) return res
  return { ok: true, data: unwrapApiArray<ApiRole>(res.data) }
}

export async function apiListPermissions():
  | { ok: true; data: ApiPermission[] }
  | ApiFail {
  const res = await pizzaApiFetch<unknown>('v1/permissions')
  if (!res.ok) return res
  return { ok: true, data: unwrapApiArray<ApiPermission>(res.data) }
}

export async function apiCreateRole(body: {
  name: string
  description?: string | null
  color?: string
  permission_ids?: number[]
}) {
  return pizzaApiFetch<unknown>('v1/roles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export async function apiUpdateRole(
  roleId: number,
  body: {
    name: string
    description?: string | null
    color?: string
  },
) {
  return pizzaApiFetch<unknown>(`v1/roles/${roleId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export async function apiUpdateRolePermissions(
  roleId: number,
  permissionIds: number[],
) {
  return pizzaApiFetch<unknown>(`v1/roles/${roleId}/permissions`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ permission_ids: permissionIds }),
  })
}

export async function apiDeleteRole(roleId: number) {
  return pizzaApiFetch<unknown>(`v1/roles/${roleId}`, {
    method: 'DELETE',
  })
}
