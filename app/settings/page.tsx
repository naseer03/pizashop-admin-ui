"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Store, Bell, CreditCard, Clock, Save, FolderTree, Plus, Pencil, Trash2, ChevronRight } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Subcategory {
  id: string
  name: string
}

interface Category {
  id: string
  name: string
  subcategories: Subcategory[]
}

const initialCategories: Category[] = [
  {
    id: "1",
    name: "Pizzas",
    subcategories: [
      { id: "1-1", name: "Classic Pizzas" },
      { id: "1-2", name: "Specialty Pizzas" },
      { id: "1-3", name: "Gourmet Pizzas" },
    ],
  },
  {
    id: "2",
    name: "Sides",
    subcategories: [
      { id: "2-1", name: "Bread Sticks" },
      { id: "2-2", name: "Wings" },
      { id: "2-3", name: "Salads" },
    ],
  },
  {
    id: "3",
    name: "Beverages",
    subcategories: [
      { id: "3-1", name: "Soft Drinks" },
      { id: "3-2", name: "Juices" },
    ],
  },
  {
    id: "4",
    name: "Desserts",
    subcategories: [
      { id: "4-1", name: "Cakes" },
      { id: "4-2", name: "Ice Cream" },
    ],
  },
]

export default function SettingsPage() {
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [subcategoryDialogOpen, setSubcategoryDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editingSubcategory, setEditingSubcategory] = useState<{ categoryId: string; subcategory: Subcategory | null }>({ categoryId: "", subcategory: null })
  const [categoryName, setCategoryName] = useState("")
  const [subcategoryName, setSubcategoryName] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{ type: "category" | "subcategory"; categoryId: string; subcategoryId?: string } | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<string[]>(["1"])

  const [settings, setSettings] = useState({
    storeName: "PizzaHub Downtown",
    email: "contact@pizzahub.com",
    phone: "+1 234 567 8900",
    address: "123 Main Street, Downtown",
    currency: "USD",
    timezone: "America/New_York",
    orderNotifications: true,
    lowStockAlerts: true,
    dailyReports: true,
    marketingEmails: false,
    taxRate: "8.5",
    deliveryFee: "3.99",
    minOrderDelivery: "15",
    openTime: "10:00",
    closeTime: "22:00",
  })

  const handleSave = () => {
    // Save settings logic would go here
    console.log("Settings saved:", settings)
  }

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  const openAddCategory = () => {
    setEditingCategory(null)
    setCategoryName("")
    setCategoryDialogOpen(true)
  }

  const openEditCategory = (category: Category) => {
    setEditingCategory(category)
    setCategoryName(category.name)
    setCategoryDialogOpen(true)
  }

  const handleSaveCategory = () => {
    if (!categoryName.trim()) return

    if (editingCategory) {
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === editingCategory.id ? { ...cat, name: categoryName } : cat
        )
      )
    } else {
      const newCategory: Category = {
        id: Date.now().toString(),
        name: categoryName,
        subcategories: [],
      }
      setCategories((prev) => [...prev, newCategory])
    }
    setCategoryDialogOpen(false)
    setCategoryName("")
  }

  const openAddSubcategory = (categoryId: string) => {
    setEditingSubcategory({ categoryId, subcategory: null })
    setSubcategoryName("")
    setSubcategoryDialogOpen(true)
  }

  const openEditSubcategory = (categoryId: string, subcategory: Subcategory) => {
    setEditingSubcategory({ categoryId, subcategory })
    setSubcategoryName(subcategory.name)
    setSubcategoryDialogOpen(true)
  }

  const handleSaveSubcategory = () => {
    if (!subcategoryName.trim()) return

    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id !== editingSubcategory.categoryId) return cat

        if (editingSubcategory.subcategory) {
          return {
            ...cat,
            subcategories: cat.subcategories.map((sub) =>
              sub.id === editingSubcategory.subcategory!.id
                ? { ...sub, name: subcategoryName }
                : sub
            ),
          }
        } else {
          return {
            ...cat,
            subcategories: [
              ...cat.subcategories,
              { id: `${cat.id}-${Date.now()}`, name: subcategoryName },
            ],
          }
        }
      })
    )
    setSubcategoryDialogOpen(false)
    setSubcategoryName("")
  }

  const confirmDelete = (type: "category" | "subcategory", categoryId: string, subcategoryId?: string) => {
    setItemToDelete({ type, categoryId, subcategoryId })
    setDeleteDialogOpen(true)
  }

  const handleDelete = () => {
    if (!itemToDelete) return

    if (itemToDelete.type === "category") {
      setCategories((prev) => prev.filter((cat) => cat.id !== itemToDelete.categoryId))
    } else if (itemToDelete.subcategoryId) {
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === itemToDelete.categoryId
            ? {
                ...cat,
                subcategories: cat.subcategories.filter(
                  (sub) => sub.id !== itemToDelete.subcategoryId
                ),
              }
            : cat
        )
      )
    }
    setDeleteDialogOpen(false)
    setItemToDelete(null)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">
            Configure your store settings and preferences
          </p>
        </div>

        {/* Settings tabs */}
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-[620px]">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="hours">Hours</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Store className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Store Information</CardTitle>
                    <CardDescription>
                      Basic information about your pizza shop
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="storeName">Store Name</FieldLabel>
                    <Input
                      id="storeName"
                      value={settings.storeName}
                      onChange={(e) =>
                        setSettings({ ...settings, storeName: e.target.value })
                      }
                    />
                  </Field>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="email">Email</FieldLabel>
                      <Input
                        id="email"
                        type="email"
                        value={settings.email}
                        onChange={(e) =>
                          setSettings({ ...settings, email: e.target.value })
                        }
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="phone">Phone</FieldLabel>
                      <Input
                        id="phone"
                        value={settings.phone}
                        onChange={(e) =>
                          setSettings({ ...settings, phone: e.target.value })
                        }
                      />
                    </Field>
                  </div>
                  <Field>
                    <FieldLabel htmlFor="address">Address</FieldLabel>
                    <Input
                      id="address"
                      value={settings.address}
                      onChange={(e) =>
                        setSettings({ ...settings, address: e.target.value })
                      }
                    />
                  </Field>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="currency">Currency</FieldLabel>
                      <Select
                        value={settings.currency}
                        onValueChange={(value) =>
                          setSettings({ ...settings, currency: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                          <SelectItem value="GBP">GBP (£)</SelectItem>
                          <SelectItem value="CAD">CAD ($)</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="timezone">Timezone</FieldLabel>
                      <Select
                        value={settings.timezone}
                        onValueChange={(value) =>
                          setSettings({ ...settings, timezone: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="America/New_York">Eastern Time</SelectItem>
                          <SelectItem value="America/Chicago">Central Time</SelectItem>
                          <SelectItem value="America/Denver">Mountain Time</SelectItem>
                          <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>
                </FieldGroup>
                <Button className="mt-6" onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Bell className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Notification Preferences</CardTitle>
                    <CardDescription>
                      Configure how you receive notifications
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <Label className="text-base">Order Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications for new orders
                      </p>
                    </div>
                    <Switch
                      checked={settings.orderNotifications}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, orderNotifications: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <Label className="text-base">Low Stock Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when inventory items are running low
                      </p>
                    </div>
                    <Switch
                      checked={settings.lowStockAlerts}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, lowStockAlerts: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <Label className="text-base">Daily Reports</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive daily sales and performance reports
                      </p>
                    </div>
                    <Switch
                      checked={settings.dailyReports}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, dailyReports: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <Label className="text-base">Marketing Emails</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive tips and updates about new features
                      </p>
                    </div>
                    <Switch
                      checked={settings.marketingEmails}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, marketingEmails: checked })
                      }
                    />
                  </div>
                </div>
                <Button className="mt-6" onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Settings */}
          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Payment & Pricing</CardTitle>
                    <CardDescription>
                      Configure tax rates and delivery fees
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="taxRate">Tax Rate (%)</FieldLabel>
                    <Input
                      id="taxRate"
                      type="number"
                      step="0.1"
                      value={settings.taxRate}
                      onChange={(e) =>
                        setSettings({ ...settings, taxRate: e.target.value })
                      }
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="deliveryFee">Delivery Fee ($)</FieldLabel>
                    <Input
                      id="deliveryFee"
                      type="number"
                      step="0.01"
                      value={settings.deliveryFee}
                      onChange={(e) =>
                        setSettings({ ...settings, deliveryFee: e.target.value })
                      }
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="minOrderDelivery">
                      Minimum Order for Free Delivery ($)
                    </FieldLabel>
                    <Input
                      id="minOrderDelivery"
                      type="number"
                      step="1"
                      value={settings.minOrderDelivery}
                      onChange={(e) =>
                        setSettings({ ...settings, minOrderDelivery: e.target.value })
                      }
                    />
                  </Field>
                </FieldGroup>
                <Button className="mt-6" onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Business Hours */}
          <TabsContent value="hours">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Business Hours</CardTitle>
                    <CardDescription>
                      Set your store operating hours
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="openTime">Opening Time</FieldLabel>
                      <Input
                        id="openTime"
                        type="time"
                        value={settings.openTime}
                        onChange={(e) =>
                          setSettings({ ...settings, openTime: e.target.value })
                        }
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="closeTime">Closing Time</FieldLabel>
                      <Input
                        id="closeTime"
                        type="time"
                        value={settings.closeTime}
                        onChange={(e) =>
                          setSettings({ ...settings, closeTime: e.target.value })
                        }
                      />
                    </Field>
                  </div>
                </FieldGroup>
                <div className="mt-6 rounded-lg border bg-muted/50 p-4">
                  <p className="text-sm text-muted-foreground">
                    Your store is currently set to operate from{" "}
                    <span className="font-medium text-foreground">{settings.openTime}</span> to{" "}
                    <span className="font-medium text-foreground">{settings.closeTime}</span> daily.
                  </p>
                </div>
                <Button className="mt-6" onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Menu Categories */}
          <TabsContent value="categories">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <FolderTree className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle>Menu Categories</CardTitle>
                      <CardDescription>
                        Manage categories and subcategories for your menu items
                      </CardDescription>
                    </div>
                  </div>
                  <Button onClick={openAddCategory}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Category
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <div key={category.id} className="rounded-lg border">
                      {/* Category Row */}
                      <div className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => toggleCategory(category.id)}
                            className="rounded p-1 hover:bg-muted"
                          >
                            <ChevronRight
                              className={`h-4 w-4 text-muted-foreground transition-transform ${
                                expandedCategories.includes(category.id) ? "rotate-90" : ""
                              }`}
                            />
                          </button>
                          <span className="font-medium">{category.name}</span>
                          <Badge variant="secondary">
                            {category.subcategories.length} subcategories
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openAddSubcategory(category.id)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Sub
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditCategory(category)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => confirmDelete("category", category.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>

                      {/* Subcategories */}
                      {expandedCategories.includes(category.id) && category.subcategories.length > 0 && (
                        <div className="border-t bg-muted/30 px-4 py-2">
                          <div className="space-y-1">
                            {category.subcategories.map((sub) => (
                              <div
                                key={sub.id}
                                className="flex items-center justify-between rounded-md px-4 py-2 hover:bg-muted"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                  <span className="text-sm">{sub.name}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => openEditSubcategory(category.id, sub)}
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => confirmDelete("subcategory", category.id, sub.id)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Empty subcategories state */}
                      {expandedCategories.includes(category.id) && category.subcategories.length === 0 && (
                        <div className="border-t bg-muted/30 px-4 py-4 text-center">
                          <p className="text-sm text-muted-foreground">
                            No subcategories yet.{" "}
                            <button
                              onClick={() => openAddSubcategory(category.id)}
                              className="text-primary hover:underline"
                            >
                              Add one
                            </button>
                          </p>
                        </div>
                      )}
                    </div>
                  ))}

                  {categories.length === 0 && (
                    <div className="py-12 text-center">
                      <FolderTree className="mx-auto h-12 w-12 text-muted-foreground/50" />
                      <h3 className="mt-4 text-lg font-medium">No categories yet</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Create your first category to organize your menu items.
                      </p>
                      <Button className="mt-4" onClick={openAddCategory}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Category
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Category Dialog */}
        <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? "Edit Category" : "Add New Category"}
              </DialogTitle>
              <DialogDescription>
                {editingCategory ? "Update the category name below." : "Enter a name for the new menu category."}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Field>
                <FieldLabel htmlFor="categoryName">Category Name</FieldLabel>
                <Input
                  id="categoryName"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="e.g., Pizzas, Beverages, Desserts"
                />
              </Field>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveCategory} disabled={!categoryName.trim()}>
                {editingCategory ? "Save Changes" : "Add Category"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Subcategory Dialog */}
        <Dialog open={subcategoryDialogOpen} onOpenChange={setSubcategoryDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingSubcategory.subcategory ? "Edit Subcategory" : "Add New Subcategory"}
              </DialogTitle>
              <DialogDescription>
                {editingSubcategory.subcategory ? "Update the subcategory name below." : "Enter a name for the new subcategory."}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Field>
                <FieldLabel htmlFor="subcategoryName">Subcategory Name</FieldLabel>
                <Input
                  id="subcategoryName"
                  value={subcategoryName}
                  onChange={(e) => setSubcategoryName(e.target.value)}
                  placeholder="e.g., Classic Pizzas, Specialty Pizzas"
                />
              </Field>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSubcategoryDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveSubcategory} disabled={!subcategoryName.trim()}>
                {editingSubcategory.subcategory ? "Save Changes" : "Add Subcategory"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                {itemToDelete?.type === "category"
                  ? "This will delete the category and all its subcategories. This action cannot be undone."
                  : "This will delete the subcategory. This action cannot be undone."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  )
}
