"use client"

import { useState } from "react"
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

const ordersData = [
  {
    id: "ORD-1234",
    items: "Margherita x2, Pepperoni x1",
    type: "delivery",
    status: "delivered",
    amount: "$45.99",
    customer: "Alice Johnson",
    time: "10:30 AM",
    address: "123 Main St, Apt 4B",
  },
  {
    id: "ORD-1235",
    items: "BBQ Chicken x1, Garlic Bread x2",
    type: "dine-in",
    status: "preparing",
    amount: "$32.50",
    customer: "Bob Smith",
    time: "10:45 AM",
    table: "Table 5",
  },
  {
    id: "ORD-1236",
    items: "Veggie Supreme x3, Coke x3",
    type: "takeaway",
    status: "pending",
    amount: "$67.00",
    customer: "Carol White",
    time: "11:00 AM",
  },
  {
    id: "ORD-1237",
    items: "Hawaiian Pizza x1",
    type: "delivery",
    status: "delivered",
    amount: "$28.75",
    customer: "David Brown",
    time: "11:15 AM",
    address: "456 Oak Ave",
  },
  {
    id: "ORD-1238",
    items: "Meat Lovers x2, Wings x1",
    type: "dine-in",
    status: "preparing",
    amount: "$54.25",
    customer: "Emma Davis",
    time: "11:30 AM",
    table: "Table 8",
  },
  {
    id: "ORD-1239",
    items: "Cheese Pizza x4, Breadsticks x2",
    type: "delivery",
    status: "pending",
    amount: "$72.00",
    customer: "Frank Miller",
    time: "11:45 AM",
    address: "789 Pine Rd",
  },
  {
    id: "ORD-1240",
    items: "Supreme Pizza x1, Salad x1",
    type: "takeaway",
    status: "ready",
    amount: "$38.50",
    customer: "Grace Lee",
    time: "12:00 PM",
  },
  {
    id: "ORD-1241",
    items: "Pepperoni x2, Coke x2",
    type: "dine-in",
    status: "delivered",
    amount: "$42.00",
    customer: "Henry Wilson",
    time: "12:15 PM",
    table: "Table 3",
  },
]

const statusStyles: Record<string, string> = {
  pending: "bg-warning/10 text-warning-foreground border-warning/20",
  preparing: "bg-chart-3/10 text-chart-3 border-chart-3/20",
  ready: "bg-primary/10 text-primary border-primary/20",
  delivered: "bg-success/10 text-success border-success/20",
}

const typeStyles: Record<string, string> = {
  "dine-in": "bg-chart-5/10 text-chart-5 border-chart-5/20",
  takeaway: "bg-chart-4/10 text-chart-4 border-chart-4/20",
  delivery: "bg-chart-2/10 text-chart-2 border-chart-2/20",
}

export default function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedOrder, setSelectedOrder] = useState<(typeof ordersData)[0] | null>(null)

  const filteredOrders = ordersData.filter((order) => {
    const matchesStatus = statusFilter === "all" || order.status === statusFilter
    const matchesType = typeFilter === "all" || order.type === typeFilter
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesType && matchesSearch
  })

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Orders</h1>
            <p className="text-muted-foreground">
              Manage and track all your pizza orders
            </p>
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            + New Order
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search orders..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-3">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="preparing">Preparing</SelectItem>
                    <SelectItem value="ready">Ready</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
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

        {/* Orders table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              All Orders ({filteredOrders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
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
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{order.id}</p>
                        <p className="text-xs text-muted-foreground md:hidden">
                          {order.items.slice(0, 25)}...
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell max-w-[200px] truncate">
                      {order.items}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={typeStyles[order.type]}>
                        {order.type.charAt(0).toUpperCase() + order.type.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusStyles[order.status]}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell font-medium">
                      {order.amount}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setSelectedOrder(order)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
<DialogTitle>Order Details - {order.id}</DialogTitle>
                            <DialogDescription>
                              View order information and status.
                            </DialogDescription>
                          </DialogHeader>
                            <div className="space-y-4 mt-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm text-muted-foreground">Customer</p>
                                  <p className="font-medium">{order.customer}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Time</p>
                                  <p className="font-medium">{order.time}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Order Type</p>
                                  <Badge variant="outline" className={typeStyles[order.type]}>
                                    {order.type.charAt(0).toUpperCase() + order.type.slice(1)}
                                  </Badge>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Status</p>
                                  <Badge variant="outline" className={statusStyles[order.status]}>
                                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                  </Badge>
                                </div>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Items</p>
                                <p className="font-medium">{order.items}</p>
                              </div>
                              {order.address && (
                                <div>
                                  <p className="text-sm text-muted-foreground">Delivery Address</p>
                                  <p className="font-medium">{order.address}</p>
                                </div>
                              )}
                              {order.table && (
                                <div>
                                  <p className="text-sm text-muted-foreground">Table</p>
                                  <p className="font-medium">{order.table}</p>
                                </div>
                              )}
                              <div className="border-t pt-4">
                                <div className="flex justify-between items-center">
                                  <span className="text-lg font-semibold">Total</span>
                                  <span className="text-lg font-bold text-primary">{order.amount}</span>
                                </div>
                              </div>
                              <div className="flex gap-2 pt-4">
                                <Button className="flex-1">Update Status</Button>
                                <Button variant="outline" className="flex-1">Print Receipt</Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Mark as Preparing</DropdownMenuItem>
                            <DropdownMenuItem>Mark as Ready</DropdownMenuItem>
                            <DropdownMenuItem>Mark as Delivered</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              Cancel Order
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
