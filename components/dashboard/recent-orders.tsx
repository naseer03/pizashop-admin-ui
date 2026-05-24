"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Spinner } from "@/components/ui/spinner"
import { Eye } from "lucide-react"
import Link from "next/link"
import { apiListOrders } from "@/lib/api/orders"
import { isUnauthorizedApiError } from "@/lib/api/client"
import {
  formatStatusLabel,
  mapApiOrdersToRows,
  statusBadgeClass,
  type OrderRow,
} from "@/lib/orders/map-api"

export function RecentOrders() {
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const res = await apiListOrders({
      page: 1,
      per_page: 5,
      sort_by: "created_at",
      sort_order: "desc",
    })
    setLoading(false)
    if (!res.ok) {
      if (!isUnauthorizedApiError(res)) setError(res.message)
      setOrders([])
      return
    }
    setOrders(mapApiOrdersToRows(res.data))
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Recent Orders</CardTitle>
        <Link href="/orders">
          <Button variant="outline" size="sm">
            View All
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}{" "}
            <button
              type="button"
              className="underline underline-offset-2"
              onClick={() => void load()}
            >
              Retry
            </button>
          </div>
        ) : null}

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
            <Spinner className="h-6 w-6" />
            Loading orders…
          </div>
        ) : orders.length === 0 && !error ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No orders yet.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">
                    {order.orderNumber}
                  </TableCell>
                  <TableCell>{order.customerName}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={statusBadgeClass(order.status)}
                    >
                      {formatStatusLabel(order.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>{order.amountLabel}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {order.timeLabel}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href="/orders">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
