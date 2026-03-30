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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Search, Eye, Users, ShoppingCart, DollarSign, Star } from "lucide-react"

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  totalOrders: number
  totalSpent: number
  lastOrder: string
  status: "active" | "inactive"
  favoriteItem: string
}

const customersData: Customer[] = [
  {
    id: "1",
    name: "Alice Johnson",
    email: "alice.j@email.com",
    phone: "+1 234 567 8901",
    totalOrders: 45,
    totalSpent: 1350,
    lastOrder: "2024-01-18",
    status: "active",
    favoriteItem: "Margherita Pizza",
  },
  {
    id: "2",
    name: "Bob Smith",
    email: "bob.smith@email.com",
    phone: "+1 234 567 8902",
    totalOrders: 32,
    totalSpent: 960,
    lastOrder: "2024-01-17",
    status: "active",
    favoriteItem: "Pepperoni Pizza",
  },
  {
    id: "3",
    name: "Carol White",
    email: "carol.w@email.com",
    phone: "+1 234 567 8903",
    totalOrders: 28,
    totalSpent: 840,
    lastOrder: "2024-01-15",
    status: "active",
    favoriteItem: "BBQ Chicken Pizza",
  },
  {
    id: "4",
    name: "David Brown",
    email: "david.b@email.com",
    phone: "+1 234 567 8904",
    totalOrders: 18,
    totalSpent: 540,
    lastOrder: "2024-01-10",
    status: "inactive",
    favoriteItem: "Hawaiian Pizza",
  },
  {
    id: "5",
    name: "Emma Davis",
    email: "emma.d@email.com",
    phone: "+1 234 567 8905",
    totalOrders: 52,
    totalSpent: 1560,
    lastOrder: "2024-01-18",
    status: "active",
    favoriteItem: "Veggie Supreme",
  },
  {
    id: "6",
    name: "Frank Miller",
    email: "frank.m@email.com",
    phone: "+1 234 567 8906",
    totalOrders: 15,
    totalSpent: 450,
    lastOrder: "2023-12-20",
    status: "inactive",
    favoriteItem: "Meat Lovers",
  },
  {
    id: "7",
    name: "Grace Lee",
    email: "grace.l@email.com",
    phone: "+1 234 567 8907",
    totalOrders: 38,
    totalSpent: 1140,
    lastOrder: "2024-01-16",
    status: "active",
    favoriteItem: "Margherita Pizza",
  },
  {
    id: "8",
    name: "Henry Wilson",
    email: "henry.w@email.com",
    phone: "+1 234 567 8908",
    totalOrders: 22,
    totalSpent: 660,
    lastOrder: "2024-01-12",
    status: "active",
    favoriteItem: "Supreme Pizza",
  },
]

export default function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  const filteredCustomers = customersData.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalCustomers = customersData.length
  const activeCustomers = customersData.filter((c) => c.status === "active").length
  const totalRevenue = customersData.reduce((sum, c) => sum + c.totalSpent, 0)
  const avgOrderValue = totalRevenue / customersData.reduce((sum, c) => sum + c.totalOrders, 0)

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Customers</h1>
          <p className="text-muted-foreground">
            View and manage your customer database
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="rounded-lg bg-primary/10 p-3">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Customers</p>
                <p className="text-2xl font-bold">{totalCustomers}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="rounded-lg bg-success/10 p-3">
                <Users className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Customers</p>
                <p className="text-2xl font-bold">{activeCustomers}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="rounded-lg bg-chart-3/10 p-3">
                <DollarSign className="h-5 w-5 text-chart-3" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">${totalRevenue.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="rounded-lg bg-chart-4/10 p-3">
                <ShoppingCart className="h-5 w-5 text-chart-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Order Value</p>
                <p className="text-2xl font-bold">${avgOrderValue.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Customers table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              All Customers ({filteredCustomers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead className="hidden sm:table-cell">Total Spent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {getInitials(customer.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{customer.name}</p>
                          <p className="text-xs text-muted-foreground md:hidden">
                            {customer.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{customer.email}</TableCell>
                    <TableCell>{customer.totalOrders}</TableCell>
                    <TableCell className="hidden sm:table-cell font-medium">
                      ${customer.totalSpent.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          customer.status === "active"
                            ? "bg-success/10 text-success border-success/20"
                            : "bg-muted text-muted-foreground"
                        }
                      >
                        {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setSelectedCustomer(customer)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
<DialogTitle>Customer Details</DialogTitle>
                <DialogDescription>
                  View customer information and order history.
                </DialogDescription>
              </DialogHeader>
                          {selectedCustomer && (
                            <div className="space-y-6 mt-4">
                              <div className="flex items-center gap-4">
                                <Avatar className="h-16 w-16">
                                  <AvatarFallback className="bg-primary/10 text-primary text-xl">
                                    {getInitials(selectedCustomer.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <h3 className="text-xl font-semibold">{selectedCustomer.name}</h3>
                                  <p className="text-muted-foreground">{selectedCustomer.email}</p>
                                  <Badge
                                    variant="outline"
                                    className={
                                      selectedCustomer.status === "active"
                                        ? "bg-success/10 text-success border-success/20 mt-1"
                                        : "bg-muted text-muted-foreground mt-1"
                                    }
                                  >
                                    {selectedCustomer.status.charAt(0).toUpperCase() +
                                      selectedCustomer.status.slice(1)}
                                  </Badge>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div className="rounded-lg border p-4">
                                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                    <ShoppingCart className="h-4 w-4" />
                                    <span className="text-sm">Total Orders</span>
                                  </div>
                                  <p className="text-2xl font-bold">{selectedCustomer.totalOrders}</p>
                                </div>
                                <div className="rounded-lg border p-4">
                                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                    <DollarSign className="h-4 w-4" />
                                    <span className="text-sm">Total Spent</span>
                                  </div>
                                  <p className="text-2xl font-bold">
                                    ${selectedCustomer.totalSpent.toLocaleString()}
                                  </p>
                                </div>
                              </div>

                              <div className="space-y-3">
                                <div className="flex justify-between py-2 border-b">
                                  <span className="text-muted-foreground">Phone</span>
                                  <span className="font-medium">{selectedCustomer.phone}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b">
                                  <span className="text-muted-foreground">Last Order</span>
                                  <span className="font-medium">{selectedCustomer.lastOrder}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b">
                                  <span className="text-muted-foreground">Favorite Item</span>
                                  <span className="font-medium flex items-center gap-1">
                                    <Star className="h-4 w-4 text-chart-4" />
                                    {selectedCustomer.favoriteItem}
                                  </span>
                                </div>
                              </div>

                              <Button className="w-full">View Order History</Button>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
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
