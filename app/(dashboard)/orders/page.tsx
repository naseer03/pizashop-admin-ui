"use client"

import { useCallback, useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Search, Eye, MoreHorizontal, Filter } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Spinner } from "@/components/ui/spinner"
import { apiListOrders } from "@/lib/api/orders"
import { isUnauthorizedApiError } from "@/lib/api/client"
import {
  formatOrderDateTime,
  formatOrderMoney,
  formatOrderTypeLabel,
  formatStatusLabel,
  mapApiOrdersToRows,
  orderTypeBadgeClass,
  statusBadgeClass,
  type OrderRow,
} from "@/lib/orders/map-api"

function orderTypeQueryParam(typeFilter: string): string | undefined {
  if (typeFilter === "all") return undefined
  if (typeFilter === "dine-in") return "dine_in"
  return typeFilter
}

export default function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchQuery.trim()), 400)
    return () => window.clearTimeout(t)
  }, [searchQuery])

  const loadOrders = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    const res = await apiListOrders({
      page: 1,
      per_page: 20,
      sort_by: "created_at",
      sort_order: "desc",
      status: statusFilter === "all" ? null : statusFilter,
      order_type: orderTypeQueryParam(typeFilter) ?? null,
      search: debouncedSearch || null,
    })
    setLoading(false)
    if (!res.ok) {
      if (!isUnauthorizedApiError(res)) setLoadError(res.message)
      setOrders([])
      return
    }
    setOrders(mapApiOrdersToRows(res.data))
  }, [statusFilter, typeFilter, debouncedSearch])

  useEffect(() => {
    void loadOrders()
  }, [loadOrders])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Orders</h1>
            <p className="text-muted-foreground">
              Orders from <code className="text-xs">GET /v1/orders</code>
            </p>
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            + New Order
          </Button>
        </div>

        {loadError ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {loadError}{" "}
            <button
              type="button"
              className="underline underline-offset-2"
              onClick={() => void loadOrders()}
            >
              Retry
            </button>
          </div>
        ) : null}

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative max-w-sm flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search orders..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="flex items-center gap-3">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                  disabled={loading}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="preparing">Preparing</SelectItem>
                    <SelectItem value="ready">Ready</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={typeFilter}
                  onValueChange={setTypeFilter}
                  disabled={loading}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Order Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="dine-in">Dine-in</SelectItem>
                    <SelectItem value="takeaway">Takeaway</SelectItem>
                    <SelectItem value="delivery">Delivery</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              All Orders ({orders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
                <Spinner className="h-6 w-6" />
                Loading orders…
              </div>
            ) : orders.length === 0 ? (
              <p className="py-16 text-center text-muted-foreground">
                No orders match your filters.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead className="hidden md:table-cell">Items</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.orderNumber}</p>
                          <p className="text-xs text-muted-foreground">
                            {order.customerName}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {order.itemsSummary}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={orderTypeBadgeClass(order.orderType)}
                        >
                          {formatOrderTypeLabel(order.orderType)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={statusBadgeClass(order.status)}
                        >
                          {formatStatusLabel(order.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell font-medium">
                        {order.amountLabel}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>
                                  Order {order.orderNumber}
                                </DialogTitle>
                                <DialogDescription>
                                  Placed {formatOrderDateTime(order.createdAt)}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="mt-4 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm text-muted-foreground">
                                      Customer
                                    </p>
                                    <p className="font-medium">
                                      {order.customerName}
                                    </p>
                                    {order.customerPhone ? (
                                      <p className="text-sm text-muted-foreground">
                                        {order.customerPhone}
                                      </p>
                                    ) : null}
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">
                                      Time
                                    </p>
                                    <p className="font-medium">
                                      {formatOrderDateTime(order.createdAt)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">
                                      Order type
                                    </p>
                                    <Badge
                                      variant="outline"
                                      className={orderTypeBadgeClass(
                                        order.orderType,
                                      )}
                                    >
                                      {formatOrderTypeLabel(order.orderType)}
                                    </Badge>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">
                                      Status
                                    </p>
                                    <Badge
                                      variant="outline"
                                      className={statusBadgeClass(order.status)}
                                    >
                                      {formatStatusLabel(order.status)}
                                    </Badge>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">
                                      Payment
                                    </p>
                                    <p className="font-medium capitalize">
                                      {order.paymentMethod || "—"}{" "}
                                      {order.paymentStatus
                                        ? `(${formatStatusLabel(order.paymentStatus)})`
                                        : ""}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">
                                      Items
                                    </p>
                                    <p className="font-medium">
                                      {order.itemsSummary}
                                    </p>
                                  </div>
                                </div>
                                <div className="space-y-1 border-t pt-4 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                      Subtotal
                                    </span>
                                    <span>{formatOrderMoney(order.subtotal)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                      Tax
                                    </span>
                                    <span>{formatOrderMoney(order.taxAmount)}</span>
                                  </div>
                                  {order.deliveryFee > 0 ? (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">
                                        Delivery
                                      </span>
                                      <span>
                                        {formatOrderMoney(order.deliveryFee)}
                                      </span>
                                    </div>
                                  ) : null}
                                  {order.discountAmount > 0 ? (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">
                                        Discount
                                      </span>
                                      <span>
                                        -{formatOrderMoney(order.discountAmount)}
                                      </span>
                                    </div>
                                  ) : null}
                                  <div className="flex justify-between border-t pt-2 text-base font-semibold">
                                    <span>Total</span>
                                    <span className="text-primary">
                                      {order.amountLabel}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem disabled>
                                Status updates (API pending)
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
