import type { ApiCategory, ApiMenuItem, ApiMenuSize } from '@/lib/api/menu'

export type MenuRow = {
  id: number
  name: string
  description: string
  categoryId: number
  categoryName: string
  subcategoryId: number | null
  subcategoryName: string
  basePrice: number
  sizes: { small?: number; medium?: number; large?: number } | null
  available: boolean
  hasSizes: boolean
  raw: ApiMenuItem
}

export function parseSizesFromApi(sizes?: ApiMenuSize[] | null): {
  small?: number
  medium?: number
  large?: number
} | null {
  if (!sizes?.length) return null
  const out: { small?: number; medium?: number; large?: number } = {}
  for (const s of sizes) {
    const key = s.size.trim().toLowerCase()
    if (key === 's' || key.startsWith('small')) out.small = s.price
    else if (key === 'm' || key.startsWith('medium')) out.medium = s.price
    else if (key === 'l' || key.startsWith('large')) out.large = s.price
  }
  return Object.keys(out).length ? out : null
}

export function sizesPayloadFromForm(hasSizes: boolean, form: MenuFormValues): ApiMenuSize[] | undefined {
  if (!hasSizes) return undefined
  const out: ApiMenuSize[] = []
  const s = parseFloat(form.smallPrice)
  const m = parseFloat(form.mediumPrice)
  const l = parseFloat(form.largePrice)
  if (!Number.isNaN(s))
    out.push({ size: 'Small', price: s, is_default: false })
  if (!Number.isNaN(m))
    out.push({ size: 'Medium', price: m, is_default: true })
  if (!Number.isNaN(l))
    out.push({ size: 'Large', price: l, is_default: false })
  return out.length ? out : undefined
}

export type MenuFormValues = {
  name: string
  categoryId: string
  subcategoryId: string
  price: string
  smallPrice: string
  mediumPrice: string
  largePrice: string
  description: string
  available: boolean
}

export function menuItemToRow(item: ApiMenuItem, categories: ApiCategory[]): MenuRow {
  const cat = categories.find((c) => c.id === item.category_id)
  const sub = cat?.subcategories?.find((s) => s.id === item.subcategory_id)
  const sizes = parseSizesFromApi(item.sizes ?? undefined)
  const hasSizes =
    cat?.has_sizes === true ||
    (Array.isArray(item.sizes) && item.sizes.length > 0)

  return {
    id: item.id,
    name: item.name,
    description: item.description ?? '',
    categoryId: item.category_id,
    categoryName: cat?.name ?? `Category ${item.category_id}`,
    subcategoryId: item.subcategory_id ?? null,
    subcategoryName: sub?.name ?? (item.subcategory_id ? `Sub #${item.subcategory_id}` : '—'),
    basePrice: Number(item.base_price),
    sizes,
    available: item.is_available ?? true,
    hasSizes,
    raw: item,
  }
}

export function emptyMenuForm(defaultCategoryId: string): MenuFormValues {
  return {
    name: '',
    categoryId: defaultCategoryId,
    subcategoryId: 'none',
    price: '',
    smallPrice: '',
    mediumPrice: '',
    largePrice: '',
    description: '',
    available: true,
  }
}

export function menuRowToForm(row: MenuRow): MenuFormValues {
  return {
    name: row.name,
    categoryId: String(row.categoryId),
    subcategoryId: row.subcategoryId != null ? String(row.subcategoryId) : 'none',
    price: row.sizes ? '' : row.basePrice.toString(),
    smallPrice: row.sizes?.small?.toString() ?? '',
    mediumPrice: row.sizes?.medium?.toString() ?? '',
    largePrice: row.sizes?.large?.toString() ?? '',
    description: row.description,
    available: row.available,
  }
}

export function buildMenuItemPayload(
  form: MenuFormValues,
  categories: ApiCategory[],
): Record<string, unknown> {
  const categoryId = Number(form.categoryId)
  const cat = categories.find((c) => c.id === categoryId)
  const hasSizes = cat?.has_sizes === true
  const subId =
    form.subcategoryId && form.subcategoryId !== 'none'
      ? Number(form.subcategoryId)
      : null

  const sizes = sizesPayloadFromForm(hasSizes, form)
  const basePrice = hasSizes
    ? Number.parseFloat(form.mediumPrice || form.smallPrice || form.largePrice || '0')
    : Number.parseFloat(form.price || '0')

  const body: Record<string, unknown> = {
    name: form.name.trim(),
    description: form.description.trim() || null,
    category_id: categoryId,
    subcategory_id: subId,
    base_price: Number.isFinite(basePrice) ? basePrice : 0,
    is_available: form.available,
  }

  if (hasSizes && sizes?.length) body.sizes = sizes

  return body
}
