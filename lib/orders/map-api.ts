import type { ApiOrder } from '@/lib/api/orders'

export type OrderRow = {
  id: number
  orderNumber: string
  customerName: string
  customerPhone: string
  orderType: string
  status: string
  paymentStatus: string
  paymentMethod: string
  itemsCount: number
  subtotal: number
  taxAmount: number
  deliveryFee: number
  discountAmount: number
  totalAmount: number
  kotPrinted: boolean
  createdAt: string
  estimatedReadyTime: string | null
  timeLabel: string
  amountLabel: string
  itemsSummary: string
}

function toFiniteNumber(raw: unknown): number {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw
  if (typeof raw === 'string') {
    const n = Number.parseFloat(raw)
    return Number.isFinite(n) ? n : 0
  }
  return 0
}

function toBoolean(raw: unknown): boolean {
  if (typeof raw === 'boolean') return raw
  if (typeof raw === 'number') return raw !== 0
  if (typeof raw === 'string') {
    const s = raw.trim().toLowerCase()
    return s === 'true' || s === '1' || s === 'yes'
  }
  return false
}

export function formatOrderMoney(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export function formatOrderDateTime(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatRelativeTime(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const diffMs = Date.now() - d.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec < 60) return 'Just now'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin} min ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr} hr ago`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 7) return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`
  return formatOrderDateTime(iso)
}

export function formatOrderTypeLabel(type: string): string {
  const t = type.trim().toLowerCase().replace(/_/g, '-')
  if (t === 'dine-in' || t === 'dinein') return 'Dine-in'
  if (t === 'takeaway') return 'Takeaway'
  if (t === 'delivery') return 'Delivery'
  return type.charAt(0).toUpperCase() + type.slice(1)
}

export function formatStatusLabel(status: string): string {
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function apiOrderToRow(raw: ApiOrder): OrderRow | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>

  const id = toFiniteNumber(o.id)
  if (!id) return null

  const orderNumber = String(o.order_number ?? o.orderNumber ?? `ORD-${id}`)
  const customerName = String(
    o.customer_name ?? o.customerName ?? 'Guest',
  ).trim()
  const customerPhone = String(
    o.customer_phone ?? o.customerPhone ?? '',
  ).trim()
  const orderType = String(o.order_type ?? o.orderType ?? 'takeaway')
  const status = String(o.status ?? 'pending')
  const paymentStatus = String(
    o.payment_status ?? o.paymentStatus ?? '',
  )
  const paymentMethod = String(
    o.payment_method ?? o.paymentMethod ?? '',
  )
  const itemsCount = toFiniteNumber(o.items_count ?? o.itemsCount)
  const subtotal = toFiniteNumber(o.subtotal)
  const taxAmount = toFiniteNumber(o.tax_amount ?? o.taxAmount)
  const deliveryFee = toFiniteNumber(o.delivery_fee ?? o.deliveryFee)
  const discountAmount = toFiniteNumber(
    o.discount_amount ?? o.discountAmount,
  )
  const totalAmount = toFiniteNumber(o.total_amount ?? o.totalAmount)
  const createdAt = String(o.created_at ?? o.createdAt ?? '')
  const estimatedRaw = o.estimated_ready_time ?? o.estimatedReadyTime
  const estimatedReadyTime =
    estimatedRaw == null || estimatedRaw === ''
      ? null
      : String(estimatedRaw)

  const itemsSummary =
    itemsCount > 0
      ? `${itemsCount} item${itemsCount === 1 ? '' : 's'}`
      : 'No items'

  return {
    id,
    orderNumber,
    customerName,
    customerPhone,
    orderType,
    status: status.toLowerCase(),
    paymentStatus: paymentStatus.toLowerCase(),
    paymentMethod,
    itemsCount,
    subtotal,
    taxAmount,
    deliveryFee,
    discountAmount,
    totalAmount,
    kotPrinted: toBoolean(o.kot_printed ?? o.kotPrinted),
    createdAt,
    estimatedReadyTime,
    timeLabel: formatRelativeTime(createdAt),
    amountLabel: formatOrderMoney(totalAmount),
    itemsSummary,
  }
}

export function mapApiOrdersToRows(raw: ApiOrder[]): OrderRow[] {
  return raw.map(apiOrderToRow).filter((r): r is OrderRow => r != null)
}

export const orderStatusStyles: Record<string, string> = {
  pending: 'bg-warning/10 text-warning-foreground border-warning/20',
  preparing: 'bg-chart-3/10 text-chart-3 border-chart-3/20',
  ready: 'bg-primary/10 text-primary border-primary/20',
  delivered: 'bg-success/10 text-success border-success/20',
  completed: 'bg-success/10 text-success border-success/20',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
}

export const orderTypeStyles: Record<string, string> = {
  'dine-in': 'bg-chart-5/10 text-chart-5 border-chart-5/20',
  dinein: 'bg-chart-5/10 text-chart-5 border-chart-5/20',
  takeaway: 'bg-chart-4/10 text-chart-4 border-chart-4/20',
  delivery: 'bg-chart-2/10 text-chart-2 border-chart-2/20',
}

export function statusBadgeClass(status: string): string {
  return (
    orderStatusStyles[status.toLowerCase()] ??
    'bg-muted text-muted-foreground'
  )
}

export function orderTypeBadgeClass(orderType: string): string {
  const key = orderType.toLowerCase().replace(/_/g, '-')
  return orderTypeStyles[key] ?? 'bg-muted text-muted-foreground'
}
