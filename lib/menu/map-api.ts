import type { ApiCategory, ApiMenuItem, ApiMenuSize } from '@/lib/api/menu'

/** Must match backend `sizes[].size` for the fourth tier (see API / validation). */
const API_SIZE_EXTRA_LARGE = 'extra_large' as const

function parseMoneyField(raw: string | undefined | null): number | undefined {
  if (raw == null) return undefined
  const t = String(raw).trim().replace(',', '.')
  if (t === '') return undefined
  const n = Number.parseFloat(t)
  return Number.isFinite(n) ? n : undefined
}

function toHttpUrlOrNull(raw: string): string | null {
  const v = raw.trim()
  if (!v) return null
  try {
    const u = new URL(v)
    if (u.protocol === 'http:' || u.protocol === 'https:') return u.toString()
  } catch {
    return null
  }
  return null
}

export type MenuRow = {
  id: number
  name: string
  description: string
  categoryId: number
  categoryName: string
  category: { id: number; name: string }
  subcategoryId: number | null
  subcategoryName: string
  subcategory: { id: number | null; name: string }
  basePrice: number
  sizes: {
    small?: number
    medium?: number
    large?: number
    extraLarge?: number
  } | null
  available: boolean
  hasSizes: boolean
  raw: ApiMenuItem
}

export function parseSizesFromApi(sizes?: ApiMenuSize[] | null): {
  small?: number
  medium?: number
  large?: number
  extraLarge?: number
} | null {
  if (!sizes?.length) return null
  const out: {
    small?: number
    medium?: number
    large?: number
    extraLarge?: number
  } = {}
  const isExtraLarge = (key: string) =>
    key === 'xl' ||
    key === 'xxl' ||
    key === '2xl' ||
    key === 'xlarge' ||
    key.startsWith('xlarge') ||
    key === 'extra_large' ||
    key.replace(/\s+/g, '') === 'extralarge' ||
    /^extra[\s_-]*large$/.test(key)
  for (const s of sizes) {
    const key = s.size.trim().toLowerCase()
    if (key === 's' || key.startsWith('small')) out.small = s.price
    else if (key === 'm' || key.startsWith('medium')) out.medium = s.price
    else if (isExtraLarge(key)) out.extraLarge = s.price
    else if (key === 'l' || key.startsWith('large')) out.large = s.price
  }
  return Object.keys(out).length ? out : null
}

/** Build API `sizes` array (multipart JSON). Extra tier uses snake_case like many PizzaHub payloads. */
export function sizesPayloadFromForm(
  useSizesPricing: boolean,
  form: MenuFormValues,
): ApiMenuSize[] | undefined {
  if (!useSizesPricing) return undefined
  const out: ApiMenuSize[] = []
  const s = parseMoneyField(form.smallPrice)
  const m = parseMoneyField(form.mediumPrice)
  const l = parseMoneyField(form.largePrice)
  const xl = parseMoneyField(form.extraLargePrice ?? '')
  if (s != null) out.push({ size: 'small', price: s, is_default: false })
  if (m != null) out.push({ size: 'medium', price: m, is_default: true })
  if (l != null) out.push({ size: 'large', price: l, is_default: false })
  if (xl != null)
    out.push({
      size: API_SIZE_EXTRA_LARGE,
      price: xl,
      is_default: false,
    })
  return out.length ? out : undefined
}

export type MenuFormValues = {
  name: string
  categoryId: string
  subcategoryId: string
  /** When category has_sizes is false; still send size variants via API sizes[]. */
  sizesEnabled: boolean
  price: string
  smallPrice: string
  mediumPrice: string
  largePrice: string
  extraLargePrice: string
  description: string
  imageUrl: string
  available: boolean
}

export function menuItemToRow(item: ApiMenuItem, categories: ApiCategory[]): MenuRow {
  const fallbackCategoryId = item.category_id ?? item.category?.id ?? 0
  const cat =
    categories.find((c) => c.id === fallbackCategoryId) ??
    (item.category
      ? {
          id: item.category.id,
          name: item.category.name,
          has_sizes: item.category.has_sizes ?? false,
          subcategories: [],
        }
      : undefined)
  const derivedSubId = item.subcategory_id ?? item.subcategory?.id ?? null
  const sub =
    cat?.subcategories?.find((s) => s.id === derivedSubId) ??
    (item.subcategory ? { id: item.subcategory.id, name: item.subcategory.name } : undefined)
  const sizes = parseSizesFromApi(item.sizes ?? undefined)
  const hasSizes =
    item.category?.has_sizes === true ||
    cat?.has_sizes === true ||
    (Array.isArray(item.sizes) && item.sizes.length > 0)
  const categoryId = cat?.id ?? fallbackCategoryId
  const categoryName = cat?.name ?? item.category?.name ?? `Category ${categoryId}`
  const subcategoryId = derivedSubId
  const subcategoryName = sub?.name ?? (subcategoryId ? `Sub #${subcategoryId}` : '—')

  return {
    id: item.id,
    name: item.name,
    description: item.description ?? '',
    categoryId,
    categoryName,
    category: { id: categoryId, name: categoryName },
    subcategoryId,
    subcategoryName,
    subcategory: { id: subcategoryId, name: subcategoryName },
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
    sizesEnabled: false,
    price: '',
    smallPrice: '',
    mediumPrice: '',
    largePrice: '',
    extraLargePrice: '',
    description: '',
    imageUrl: '',
    available: true,
  }
}

export function menuRowToForm(row: MenuRow): MenuFormValues {
  const hasVariantPrices =
    row.sizes &&
    (row.sizes.small != null ||
      row.sizes.medium != null ||
      row.sizes.large != null ||
      row.sizes.extraLarge != null)

  return {
    name: row.name,
    categoryId: String(row.categoryId),
    subcategoryId: row.subcategoryId != null ? String(row.subcategoryId) : 'none',
    sizesEnabled: row.hasSizes || Boolean(hasVariantPrices),
    price: hasVariantPrices ? '' : row.basePrice.toString(),
    smallPrice: row.sizes?.small?.toString() ?? '',
    mediumPrice: row.sizes?.medium?.toString() ?? '',
    largePrice: row.sizes?.large?.toString() ?? '',
    extraLargePrice: row.sizes?.extraLarge?.toString() ?? '',
    description: row.description,
    imageUrl: row.raw.image_url ?? '',
    available: row.available,
  }
}

export function buildMenuItemPayload(
  form: MenuFormValues,
  categories: ApiCategory[],
): Record<string, unknown> {
  const categoryId = Number(form.categoryId)
  const cat = categories.find((c) => c.id === categoryId)
  const categoryWantsSizes = cat?.has_sizes === true
  const useSizesPricing = categoryWantsSizes || form.sizesEnabled
  const subId =
    form.subcategoryId && form.subcategoryId !== 'none'
      ? Number(form.subcategoryId)
      : null

  const sizes = sizesPayloadFromForm(useSizesPricing, form)
  const basePrice = useSizesPricing
    ? (parseMoneyField(form.mediumPrice) ??
        parseMoneyField(form.smallPrice) ??
        parseMoneyField(form.largePrice) ??
        parseMoneyField(form.extraLargePrice) ??
        parseMoneyField(form.price) ??
        0)
    : (parseMoneyField(form.price) ?? 0)

  const body: Record<string, unknown> = {
    name: form.name.trim(),
    description: form.description.trim() || null,
    image_url: toHttpUrlOrNull(form.imageUrl),
    category_id: categoryId,
    subcategory_id: subId,
    base_price: Number.isFinite(basePrice) ? basePrice : 0,
    is_available: form.available,
  }

  if (useSizesPricing && sizes?.length) body.sizes = sizes

  return body
}

export function buildMenuItemMultipartBody(
  form: MenuFormValues,
  categories: ApiCategory[],
  imageFile: File | null,
): FormData {
  const payload = buildMenuItemPayload(form, categories)
  const fd = new FormData()

  fd.set('name', String(payload.name ?? '').trim())
  fd.set('category_id', String(payload.category_id ?? ''))
  fd.set('base_price', String(payload.base_price ?? 0))
  fd.set('is_available', String(Boolean(payload.is_available)))

  const description = payload.description
  fd.set('description', description == null ? '' : String(description))

  const sub = payload.subcategory_id
  fd.set('subcategory_id', sub == null ? '' : String(sub))

  const sizes = payload.sizes
  fd.set('sizes', Array.isArray(sizes) ? JSON.stringify(sizes) : '')

  if (imageFile) {
    fd.set('image', imageFile)
  }

  return fd
}
