"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import { DollarSign, ShoppingCart, TrendingUp, Users, Download } from "lucide-react"

const revenueData = [
  { name: "Jan", revenue: 12400, orders: 124 },
  { name: "Feb", revenue: 13800, orders: 138 },
  { name: "Mar", revenue: 15200, orders: 152 },
  { name: "Apr", revenue: 14100, orders: 141 },
  { name: "May", revenue: 16500, orders: 165 },
  { name: "Jun", revenue: 18200, orders: 182 },
  { name: "Jul", revenue: 17800, orders: 178 },
  { name: "Aug", revenue: 19500, orders: 195 },
  { name: "Sep", revenue: 21200, orders: 212 },
  { name: "Oct", revenue: 20100, orders: 201 },
  { name: "Nov", revenue: 22800, orders: 228 },
  { name: "Dec", revenue: 25400, orders: 254 },
]

const topSellingData = [
  { name: "Margherita", value: 1250, color: "hsl(var(--chart-1))" },
  { name: "Pepperoni", value: 980, color: "hsl(var(--chart-2))" },
  { name: "BBQ Chicken", value: 750, color: "hsl(var(--chart-3))" },
  { name: "Hawaiian", value: 620, color: "hsl(var(--chart-4))" },
  { name: "Veggie Supreme", value: 480, color: "hsl(var(--chart-5))" },
]

const orderTypeData = [
  { name: "Delivery", orders: 3420, revenue: 58140 },
  { name: "Dine-in", orders: 2180, revenue: 39240 },
  { name: "Takeaway", orders: 1650, revenue: 26400 },
]

const weeklyData = [
  { name: "Mon", orders: 145 },
  { name: "Tue", orders: 132 },
  { name: "Wed", orders: 156 },
  { name: "Thu", orders: 148 },
  { name: "Fri", orders: 198 },
  { name: "Sat", orders: 245 },
  { name: "Sun", orders: 212 },
]

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState("year")

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Reports</h1>
            <p className="text-muted-foreground">
              Analyze your sales performance and business metrics
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold text-foreground mt-1">$217,200</p>
                  <p className="text-xs text-success mt-1">+12.5% from last year</p>
                </div>
                <div className="rounded-lg bg-success/10 p-3">
                  <DollarSign className="h-5 w-5 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold text-foreground mt-1">7,250</p>
                  <p className="text-xs text-success mt-1">+8.3% from last year</p>
                </div>
                <div className="rounded-lg bg-primary/10 p-3">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Order Value</p>
                  <p className="text-2xl font-bold text-foreground mt-1">$29.96</p>
                  <p className="text-xs text-success mt-1">+3.8% from last year</p>
                </div>
                <div className="rounded-lg bg-chart-3/10 p-3">
                  <TrendingUp className="h-5 w-5 text-chart-3" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">New Customers</p>
                  <p className="text-2xl font-bold text-foreground mt-1">1,842</p>
                  <p className="text-xs text-success mt-1">+15.2% from last year</p>
                </div>
                <div className="rounded-lg bg-chart-4/10 p-3">
                  <Users className="h-5 w-5 text-chart-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts row 1 */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Revenue chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Revenue Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `$${value / 1000}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="hsl(var(--chart-1))"
                      strokeWidth={2}
                      fill="url(#revenueGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Orders by day */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Orders by Day</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="orders" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts row 2 */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Top selling pizzas */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Top Selling Pizzas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={topSellingData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {topSellingData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => [`${value} orders`, "Orders"]}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value) => (
                        <span style={{ color: "hsl(var(--foreground))", fontSize: "12px" }}>
                          {value}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Order types breakdown */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Order Type Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {orderTypeData.map((type, index) => {
                  const totalOrders = orderTypeData.reduce((sum, t) => sum + t.orders, 0)
                  const percentage = ((type.orders / totalOrders) * 100).toFixed(1)
                  const colors = [
                    "bg-chart-1",
                    "bg-chart-2",
                    "bg-chart-3",
                  ]
                  return (
                    <div key={type.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`h-3 w-3 rounded-full ${colors[index]}`} />
                          <span className="font-medium text-foreground">{type.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-foreground">
                            {type.orders.toLocaleString()} orders
                          </p>
                          <p className="text-sm text-muted-foreground">
                            ${type.revenue.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted">
                        <div
                          className={`h-2 rounded-full ${colors[index]}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-muted-foreground">Total</span>
                  <div className="text-right">
                    <p className="font-bold text-foreground">
                      {orderTypeData.reduce((sum, t) => sum + t.orders, 0).toLocaleString()} orders
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ${orderTypeData.reduce((sum, t) => sum + t.revenue, 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
