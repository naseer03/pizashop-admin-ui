"use client"

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
import { Eye } from "lucide-react"
import Link from "next/link"

const recentOrders = [
  {
    id: "ORD-1234",
    customer: "Alice Johnson",
    status: "delivered",
    amount: "$45.99",
    time: "10 min ago",
  },
  {
    id: "ORD-1235",
    customer: "Bob Smith",
    status: "preparing",
    amount: "$32.50",
    time: "15 min ago",
  },
  {
    id: "ORD-1236",
    customer: "Carol White",
    status: "pending",
    amount: "$67.00",
    time: "22 min ago",
  },
  {
    id: "ORD-1237",
    customer: "David Brown",
    status: "delivered",
    amount: "$28.75",
    time: "35 min ago",
  },
  {
    id: "ORD-1238",
    customer: "Emma Davis",
    status: "preparing",
    amount: "$54.25",
    time: "42 min ago",
  },
]

const statusStyles = {
  pending: "bg-warning/10 text-warning-foreground border-warning/20",
  preparing: "bg-chart-3/10 text-chart-3 border-chart-3/20",
  delivered: "bg-success/10 text-success border-success/20",
}

export function RecentOrders() {
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
            {recentOrders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">{order.id}</TableCell>
                <TableCell>{order.customer}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={statusStyles[order.status as keyof typeof statusStyles]}
                  >
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>{order.amount}</TableCell>
                <TableCell className="text-muted-foreground">{order.time}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
