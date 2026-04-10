"use client"

import { useCallback, useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
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
import {
  Store,
  Bell,
  CreditCard,
  Clock,
  Save,
  FolderTree,
  Plus,
  Pencil,
  Trash2,
  ChevronRight,
} from "lucide-react"
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
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Spinner } from "@/components/ui/spinner"
import type { ApiCategory } from "@/lib/api/menu"
import { apiListCategories } from "@/lib/api/menu"
import {
  apiGetStore,
  apiPutStore,
  apiGetNotifications,
  apiPutNotifications,
  apiGetBusinessHours,
  apiPutBusinessHours,
  apiGetPayments,
  apiPutPayments,
} from "@/lib/api/settings"
import {
  apiCreateCategory,
  apiUpdateCategory,
  apiDeleteCategory,
  apiCreateSubcategory,
  apiUpdateSubcategory,
  apiDeleteSubcategory,
} from "@/lib/api/categories-crud"
import {
  DEFAULT_SETTINGS,
  mapStoreToForm,
  mapNotificationsToForm,
  formNotificationsToApi,
  mergeStorePut,
  formGeneralToStorePatch,
  formPaymentsToStorePatch,
  hoursFromApi,
  formHoursToApiPayload,
  buildPaymentsPutBody,
  extractDeliveryFromPayments,
  type SettingsFormState,
} from "@/lib/settings/map"
import { isUnauthorizedApiError } from "@/lib/api/client"
import { toast } from "@/hooks/use-toast"

interface Subcategory {
  id: string
  name: string
}

interface Category {
  id: string
  name: string
  subcategories: Subcategory[]
}

function apiCategoryToUi(c: ApiCategory): Category {
  return {
    id: String(c.id),
    name: c.name,
    subcategories: (c.subcategories ?? []).map((s) => ({
      id: String(s.id),
      name: s.name,
    })),
  }
}

export default function SettingsPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [storeSnapshot, setStoreSnapshot] = useState<Record<string, unknown>>({})
  const [paymentsSnapshot, setPaymentsSnapshot] = useState<unknown>(null)
  const [settings, setSettings] = useState<SettingsFormState>(DEFAULT_SETTINGS)

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving, setSaving] = useState<
    null | "general" | "notifications" | "payments" | "hours"
  >(null)

  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [subcategoryDialogOpen, setSubcategoryDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editingSubcategory, setEditingSubcategory] = useState<{
    categoryId: string
    subcategory: Subcategory | null
  }>({ categoryId: "", subcategory: null })
  const [categoryName, setCategoryName] = useState("")
  const [subcategoryName, setSubcategoryName] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletePending, setDeletePending] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{
    type: "category" | "subcategory"
    categoryId: string
    subcategoryId?: string
  } | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<string[]>([])

  const loadAll = useCallback(async () => {
    setLoading(true)
    setLoadError(null)

    const [st, no, bh, pay, cat] = await Promise.all([
      apiGetStore(),
      apiGetNotifications(),
      apiGetBusinessHours(),
      apiGetPayments(),
      apiListCategories(),
    ])

    const batch = [st, no, bh, pay, cat]
    if (batch.some((r) => isUnauthorizedApiError(r))) {
      setLoading(false)
      return
    }

    if (!st.ok) {
      setLoadError(st.message)
      setLoading(false)
      return
    }

    setStoreSnapshot({ ...(st.data as Record<string, unknown>) })
    let next = mapStoreToForm(st.data as Record<string, unknown>, DEFAULT_SETTINGS)

    if (no.ok) {
      next = { ...next, ...mapNotificationsToForm(no.data, next) }
    }

    if (bh.ok && bh.data.length > 0) {
      const { open, close } = hoursFromApi(bh.data)
      next = { ...next, openTime: open, closeTime: close }
    }

    if (pay.ok) {
      setPaymentsSnapshot(pay.data)
      const ex = extractDeliveryFromPayments(pay.data)
      if (ex.deliveryFee != null) next = { ...next, deliveryFee: ex.deliveryFee }
      if (ex.minOrder != null)
        next = { ...next, minOrderDelivery: ex.minOrder }
    } else {
      setPaymentsSnapshot(null)
    }

    setSettings(next)

    if (cat.ok) {
      const ui = cat.data.map(apiCategoryToUi)
      setCategories(ui)
      setExpandedCategories((prev) => {
        if (prev.length) return prev
        return ui.slice(0, 1).map((c) => c.id)
      })
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    void loadAll()
  }, [loadAll])

  async function handleSaveGeneral() {
    setSaving("general")
    setLoadError(null)
    const patch = formGeneralToStorePatch(settings)
    const body = mergeStorePut(storeSnapshot, patch)
    const res = await apiPutStore(body)
    setSaving(null)
    if (!res.ok) {
      if (!isUnauthorizedApiError(res)) setLoadError(res.message)
      return
    }
    setStoreSnapshot(body)
    await loadAll()
    toast({ title: "Saved", description: "General settings were updated." })
  }

  async function handleSaveNotifications() {
    setSaving("notifications")
    setLoadError(null)
    const res = await apiPutNotifications(formNotificationsToApi(settings))
    setSaving(null)
    if (!res.ok) {
      if (!isUnauthorizedApiError(res)) setLoadError(res.message)
      return
    }
    await loadAll()
    toast({ title: "Saved", description: "Notification preferences were updated." })
  }

  async function handleSavePayments() {
    setSaving("payments")
    setLoadError(null)
    const storePatch = mergeStorePut(
      storeSnapshot,
      formPaymentsToStorePatch(settings),
    )
    const resStore = await apiPutStore(storePatch)
    if (!resStore.ok) {
      setSaving(null)
      if (!isUnauthorizedApiError(resStore)) setLoadError(resStore.message)
      return
    }
    setStoreSnapshot(storePatch)

    const payBody = buildPaymentsPutBody(
      paymentsSnapshot,
      settings.deliveryFee,
      settings.minOrderDelivery,
    )
    const resPay = await apiPutPayments(payBody)
    setSaving(null)
    if (!resPay.ok) {
      if (!isUnauthorizedApiError(resPay)) setLoadError(resPay.message)
      return
    }
    setPaymentsSnapshot(payBody)
    await loadAll()
    toast({ title: "Saved", description: "Payment settings were updated." })
  }

  async function handleSaveHours() {
    setSaving("hours")
    setLoadError(null)
    const payload = formHoursToApiPayload(settings.openTime, settings.closeTime)
    const res = await apiPutBusinessHours(payload)
    setSaving(null)
    if (!res.ok) {
      if (!isUnauthorizedApiError(res)) setLoadError(res.message)
      return
    }
    await loadAll()
    toast({ title: "Saved", description: "Business hours were updated." })
  }

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId],
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

  async function handleSaveCategory() {
    if (!categoryName.trim()) return
    setLoadError(null)
    if (editingCategory) {
      const res = await apiUpdateCategory(Number(editingCategory.id), {
        name: categoryName.trim(),
      })
      if (!res.ok) {
        if (!isUnauthorizedApiError(res)) setLoadError(res.message)
        return
      }
    } else {
      const res = await apiCreateCategory({
        name: categoryName.trim(),
        display_order: 0,
      })
      if (!res.ok) {
        if (!isUnauthorizedApiError(res)) setLoadError(res.message)
        return
      }
    }
    setCategoryDialogOpen(false)
    setCategoryName("")
    setEditingCategory(null)
    const cat = await apiListCategories()
    if (cat.ok) setCategories(cat.data.map(apiCategoryToUi))
    toast({ title: "Saved", description: "Category was saved." })
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

  async function handleSaveSubcategory() {
    if (!subcategoryName.trim()) return
    setLoadError(null)
    if (editingSubcategory.subcategory) {
      const res = await apiUpdateSubcategory(
        Number(editingSubcategory.subcategory.id),
        { name: subcategoryName.trim() },
      )
      if (!res.ok) {
        if (!isUnauthorizedApiError(res)) setLoadError(res.message)
        return
      }
    } else {
      const res = await apiCreateSubcategory(
        Number(editingSubcategory.categoryId),
        { name: subcategoryName.trim(), display_order: 0 },
      )
      if (!res.ok) {
        if (!isUnauthorizedApiError(res)) setLoadError(res.message)
        return
      }
    }
    setSubcategoryDialogOpen(false)
    setSubcategoryName("")
    setEditingSubcategory({ categoryId: "", subcategory: null })
    const cat = await apiListCategories()
    if (cat.ok) setCategories(cat.data.map(apiCategoryToUi))
    toast({ title: "Saved", description: "Subcategory was saved." })
  }

  const confirmDelete = (
    type: "category" | "subcategory",
    categoryId: string,
    subcategoryId?: string,
  ) => {
    setItemToDelete({ type, categoryId, subcategoryId })
    setDeleteDialogOpen(true)
  }

  async function handleDelete() {
    if (!itemToDelete) return
    setDeletePending(true)
    setLoadError(null)
    if (itemToDelete.type === "category") {
      const res = await apiDeleteCategory(Number(itemToDelete.categoryId))
      setDeletePending(false)
      if (!res.ok) {
        if (!isUnauthorizedApiError(res)) setLoadError(res.message)
        return
      }
    } else if (itemToDelete.subcategoryId) {
      const res = await apiDeleteSubcategory(Number(itemToDelete.subcategoryId))
      setDeletePending(false)
      if (!res.ok) {
        if (!isUnauthorizedApiError(res)) setLoadError(res.message)
        return
      }
    }
    setDeleteDialogOpen(false)
    setItemToDelete(null)
    const cat = await apiListCategories()
    if (cat.ok) setCategories(cat.data.map(apiCategoryToUi))
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">
            Store, notifications, payments, hours, and categories from the PizzaHub
            API.
          </p>
        </div>

        {loadError ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {loadError}{" "}
            <button
              type="button"
              className="underline underline-offset-2"
              onClick={() => void loadAll()}
            >
              Retry
            </button>
          </div>
        ) : null}

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Spinner className="h-6 w-6" />
            Loading settings…
          </div>
        ) : (
          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 lg:w-[620px]">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="hours">Hours</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
            </TabsList>

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
                        <code className="text-xs">GET/PUT /v1/settings/store</code>
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
                            <SelectItem value="America/New_York">
                              Eastern Time
                            </SelectItem>
                            <SelectItem value="America/Chicago">
                              Central Time
                            </SelectItem>
                            <SelectItem value="America/Denver">
                              Mountain Time
                            </SelectItem>
                            <SelectItem value="America/Los_Angeles">
                              Pacific Time
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                    </div>
                  </FieldGroup>
                  <Button
                    className="mt-6"
                    onClick={() => void handleSaveGeneral()}
                    disabled={saving === "general"}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {saving === "general" ? "Saving…" : "Save Changes"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

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
                        <code className="text-xs">
                          GET/PUT /v1/settings/notifications
                        </code>
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
                  <Button
                    className="mt-6"
                    onClick={() => void handleSaveNotifications()}
                    disabled={saving === "notifications"}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {saving === "notifications" ? "Saving…" : "Save Changes"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

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
                        Tax on store settings; delivery fields on{" "}
                        <code className="text-xs">/v1/settings/payments</code>
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
                        Minimum order for free delivery ($)
                      </FieldLabel>
                      <Input
                        id="minOrderDelivery"
                        type="number"
                        step="1"
                        value={settings.minOrderDelivery}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            minOrderDelivery: e.target.value,
                          })
                        }
                      />
                    </Field>
                  </FieldGroup>
                  <Button
                    className="mt-6"
                    onClick={() => void handleSavePayments()}
                    disabled={saving === "payments"}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {saving === "payments" ? "Saving…" : "Save Changes"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

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
                        <code className="text-xs">
                          GET/PUT /v1/settings/business-hours
                        </code>{" "}
                        — same open/close applied to every day.
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
                      <span className="font-medium text-foreground">
                        {settings.openTime}
                      </span>{" "}
                      to{" "}
                      <span className="font-medium text-foreground">
                        {settings.closeTime}
                      </span>{" "}
                      daily (all days).
                    </p>
                  </div>
                  <Button
                    className="mt-6"
                    onClick={() => void handleSaveHours()}
                    disabled={saving === "hours"}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {saving === "hours" ? "Saving…" : "Save Changes"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

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
                          <code className="text-xs">/v1/categories</code> and
                          subcategories
                        </CardDescription>
                      </div>
                    </div>
                    <Button onClick={openAddCategory}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Category
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <div key={category.id} className="rounded-lg border">
                        <div className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => toggleCategory(category.id)}
                              className="rounded p-1 hover:bg-muted"
                            >
                              <ChevronRight
                                className={`h-4 w-4 text-muted-foreground transition-transform ${
                                  expandedCategories.includes(category.id)
                                    ? "rotate-90"
                                    : ""
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
                              <Plus className="mr-1 h-4 w-4" />
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
                              onClick={() =>
                                confirmDelete("category", category.id)
                              }
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>

                        {expandedCategories.includes(category.id) &&
                          category.subcategories.length > 0 && (
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
                                        onClick={() =>
                                          openEditSubcategory(category.id, sub)
                                        }
                                      >
                                        <Pencil className="h-3.5 w-3.5" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() =>
                                          confirmDelete(
                                            "subcategory",
                                            category.id,
                                            sub.id,
                                          )
                                        }
                                      >
                                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                        {expandedCategories.includes(category.id) &&
                          category.subcategories.length === 0 && (
                            <div className="border-t bg-muted/30 px-4 py-4 text-center">
                              <p className="text-sm text-muted-foreground">
                                No subcategories yet.{" "}
                                <button
                                  type="button"
                                  onClick={() =>
                                    openAddSubcategory(category.id)
                                  }
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
                        <h3 className="mt-4 text-lg font-medium">
                          No categories yet
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Create your first category to organize your menu items.
                        </p>
                        <Button className="mt-4" onClick={openAddCategory}>
                          <Plus className="mr-2 h-4 w-4" />
                          Add Category
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        <Dialog
          open={categoryDialogOpen}
          onOpenChange={setCategoryDialogOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? "Edit Category" : "Add New Category"}
              </DialogTitle>
              <DialogDescription>
                {editingCategory
                  ? "Update the category name below."
                  : "Enter a name for the new menu category."}
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
              <Button
                variant="outline"
                onClick={() => setCategoryDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => void handleSaveCategory()}
                disabled={!categoryName.trim()}
              >
                {editingCategory ? "Save Changes" : "Add Category"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={subcategoryDialogOpen}
          onOpenChange={setSubcategoryDialogOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingSubcategory.subcategory
                  ? "Edit Subcategory"
                  : "Add New Subcategory"}
              </DialogTitle>
              <DialogDescription>
                {editingSubcategory.subcategory
                  ? "Update the subcategory name below."
                  : "Enter a name for the new subcategory."}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Field>
                <FieldLabel htmlFor="subcategoryName">
                  Subcategory Name
                </FieldLabel>
                <Input
                  id="subcategoryName"
                  value={subcategoryName}
                  onChange={(e) => setSubcategoryName(e.target.value)}
                  placeholder="e.g., Classic Pizzas, Specialty Pizzas"
                />
              </Field>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setSubcategoryDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => void handleSaveSubcategory()}
                disabled={!subcategoryName.trim()}
              >
                {editingSubcategory.subcategory
                  ? "Save Changes"
                  : "Add Subcategory"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog
          open={deleteDialogOpen}
          onOpenChange={(open) => {
            if (!open && !deletePending) {
              setDeleteDialogOpen(false)
              setItemToDelete(null)
            }
          }}
        >
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
              <AlertDialogCancel disabled={deletePending}>
                Cancel
              </AlertDialogCancel>
              <Button
                variant="destructive"
                disabled={deletePending}
                onClick={() => void handleDelete()}
              >
                {deletePending ? "Deleting…" : "Delete"}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  )
}
