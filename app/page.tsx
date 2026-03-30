import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { StatsCard } from "@/components/dashboard/stats-card"
import { SalesChart } from "@/components/dashboard/sales-chart"
import { RecentOrders } from "@/components/dashboard/recent-orders"
import { ShoppingCart, DollarSign, Clock, AlertTriangle } from "lucide-react"

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here&apos;s what&apos;s happening at your pizza shop today.
          </p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Orders Today"
            value="124"
            change="+12% from yesterday"
            changeType="positive"
            icon={ShoppingCart}
            iconColor="bg-primary/10 text-primary"
          />
          <StatsCard
            title="Revenue Today"
            value="$4,235"
            change="+8% from yesterday"
            changeType="positive"
            icon={DollarSign}
            iconColor="bg-success/10 text-success"
          />
          <StatsCard
            title="Active Orders"
            value="18"
            change="5 pending, 13 preparing"
            changeType="neutral"
            icon={Clock}
            iconColor="bg-chart-3/10 text-chart-3"
          />
          <StatsCard
            title="Low Stock Items"
            value="3"
            change="Needs attention"
            changeType="negative"
            icon={AlertTriangle}
            iconColor="bg-warning/10 text-warning-foreground"
          />
        </div>

        {/* Charts and tables */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <SalesChart />
          <div className="lg:col-span-1">
            <TopSellingItems />
          </div>
        </div>

        {/* Recent orders */}
        <RecentOrders />
      </div>
    </DashboardLayout>
  )
}

function TopSellingItems() {
  const topItems = [
    { name: "Margherita Pizza", orders: 45, revenue: "$675" },
    { name: "Pepperoni Pizza", orders: 38, revenue: "$608" },
    { name: "BBQ Chicken Pizza", orders: 32, revenue: "$576" },
    { name: "Veggie Supreme", orders: 28, revenue: "$448" },
    { name: "Hawaiian Pizza", orders: 24, revenue: "$384" },
  ]

  return (
    <div className="rounded-xl border border-border bg-card p-6 h-full">
      <h3 className="text-lg font-semibold text-foreground mb-4">Top Selling Items</h3>
      <div className="space-y-4">
        {topItems.map((item, index) => (
          <div key={item.name} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {index + 1}
              </span>
              <div>
                <p className="text-sm font-medium text-foreground">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.orders} orders</p>
              </div>
            </div>
            <span className="text-sm font-semibold text-foreground">{item.revenue}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
