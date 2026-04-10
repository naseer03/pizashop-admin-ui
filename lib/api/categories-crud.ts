import { pizzaApiFetch } from '@/lib/api/client'

export async function apiCreateCategory(body: {
  name: string
  description?: string | null
  has_sizes?: boolean
  display_order?: number
}) {
  return pizzaApiFetch<unknown>('v1/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export async function apiUpdateCategory(
  categoryId: number,
  body: Record<string, unknown>,
) {
  return pizzaApiFetch<unknown>(`v1/categories/${categoryId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export async function apiDeleteCategory(categoryId: number) {
  return pizzaApiFetch<unknown>(`v1/categories/${categoryId}`, {
    method: 'DELETE',
  })
}

export async function apiCreateSubcategory(
  categoryId: number,
  body: { name: string; display_order?: number },
) {
  return pizzaApiFetch<unknown>(`v1/categories/${categoryId}/subcategories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export async function apiUpdateSubcategory(
  subId: number,
  body: { name: string; display_order?: number },
) {
  return pizzaApiFetch<unknown>(`v1/subcategories/${subId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export async function apiDeleteSubcategory(subId: number) {
  return pizzaApiFetch<unknown>(`v1/subcategories/${subId}`, {
    method: 'DELETE',
  })
}
