"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
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
  Cherry, 
  Circle
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
  apiCreateTopping,
  apiDeleteTopping,
  apiListToppings,
  apiUpdateTopping,
} from "@/lib/api/toppings"
import {
  apiCreateCrust,
  apiDeleteCrust,
  apiListCrusts,
  apiUpdateCrust,
} from "@/lib/api/crusts"
import {
  apiGetStore,
  apiPutStore,
  apiGetNotifications,
  apiPutNotifications,
  apiGetBusinessHours,
  apiPutBusinessHours,
  apiGetPayments,
  apiPutPayments,
  type BusinessHourRow,
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
  defaultBusinessHourRows,
  normalizeBusinessHoursFromApi,
  dayLabel,
  buildPaymentsPutBody,
  extractDeliveryFromPayments,
  type SettingsFormState,
} from "@/lib/settings/map"
import { isUnauthorizedApiError } from "@/lib/api/client"
import { toast } from "@/hooks/use-toast"

interface Topping {
  id: string
  name: string
  category: string
  price: number
  available: boolean
}

interface Crust {
  id: string
  name: string
  price: number
  available: boolean
}
 
interface Subcategory {
  id: string
  name: string
}

interface Category {
  id: string
  name: string
  slug?: string
  subcategories: Subcategory[]
}

function apiCategoryToUi(c: ApiCategory): Category {
  return {
    id: String(c.id),
    name: c.name,
    slug: c.slug ? String(c.slug) : undefined,
    subcategories: (c.subcategories ?? []).map((s) => ({
      id: String(s.id),
      name: s.name,
    })),
  }
}

function normalizeToppingCategory(raw: unknown): string {
  const s = String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")

  if (!s) return "veggies"
  if (s === "veggies" || s === "vegetables" || s.includes("veg")) return "veggies"
  if (s === "meats" || s === "meat" || s.includes("meat")) return "meats"
  if (s === "cheese" || s.includes("cheese")) return "cheese"
  if (s === "sauce" || s.includes("sauce")) return "sauce"
  return s
}

function toFiniteNumber(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw
  if (typeof raw === "string") {
    const n = Number.parseFloat(raw)
    return Number.isFinite(n) ? n : null
  }
  if (raw != null && typeof raw === "bigint") return Number(raw)
  return null
}

function toBoolean(raw: unknown): boolean | null {
  if (typeof raw === "boolean") return raw
  if (typeof raw === "number") return raw !== 0
  if (typeof raw === "string") {
    const s = raw.trim().toLowerCase()
    if (s === "true" || s === "1" || s === "yes") return true
    if (s === "false" || s === "0" || s === "no") return false
  }
  return null
}

function mapApiToppingToUi(raw: unknown): Topping | null {
  if (!raw || typeof raw !== "object") return null
  const o = raw as Record<string, unknown>

  const name =
    (o.name ?? o.topping_name ?? o.title ?? o.display_name ?? "").toString().trim()
  if (!name) return null

  const id = o.id ?? o.topping_id ?? o.toppingId ?? o.item_id ?? o.uuid ?? name

  const priceRaw =
    o.price ??
    o.additional_price ??
    o.additionalPrice ??
    o.extra_price ??
    o.extraPrice ??
    o.amount ??
    o.cost
  const price = toFiniteNumber(priceRaw) ?? 0

  const availableRaw =
    o.available ?? o.is_available ?? o.isAvailable ?? o.active ?? o.enabled
  const available = toBoolean(availableRaw) ?? true

  const categoryFromNestedObject =
    o.category && typeof o.category === "object"
      ? (o.category as Record<string, unknown>).name ??
        (o.category as Record<string, unknown>).slug ??
        (o.category as Record<string, unknown>).id
      : null

  const categoryRaw =
    categoryFromNestedObject ??
    o.category ??
    o.topping_category ??
    o.toppingCategory ??
    o.type ??
    o.category_name ??
    o.categoryName ??
    o.category_id
  const category = normalizeToppingCategory(categoryRaw)

  return {
    id: String(id),
    name,
    category,
    price,
    available,
  }
}

function mapApiToppingsToUi(rawData: unknown): Topping[] {
  const arr = Array.isArray(rawData) ? rawData : []
  return arr
    .map(mapApiToppingToUi)
    .filter((t): t is Topping => t != null)
}

function mapApiCrustToUi(raw: unknown): Crust | null {
  if (!raw || typeof raw !== "object") return null
  const o = raw as Record<string, unknown>

  const name =
    (o.name ?? o.crust_name ?? o.title ?? o.display_name ?? "").toString().trim()
  if (!name) return null

  const id = o.id ?? o.crust_id ?? o.crustId ?? o.item_id ?? o.uuid ?? name

  const priceRaw =
    o.price ??
    o.additional_price ??
    o.additionalPrice ??
    o.extra_price ??
    o.extraPrice ??
    o.amount ??
    o.cost
  const price = toFiniteNumber(priceRaw) ?? 0

  const availableRaw =
    o.available ?? o.is_available ?? o.isAvailable ?? o.active ?? o.enabled
  const available = toBoolean(availableRaw) ?? true

  return {
    id: String(id),
    name,
    price,
    available,
  }
}

function mapApiCrustsToUi(rawData: unknown): Crust[] {
  const arr = Array.isArray(rawData) ? rawData : []
  return arr
    .map(mapApiCrustToUi)
    .filter((c): c is Crust => c != null)
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
  const [toppingBusy, setToppingBusy] = useState(false)
  const [crustBusy, setCrustBusy] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{
    type: "category" | "subcategory" | "topping" | "crust"
    categoryId?: string
    subcategoryId?: string
    itemId?: string
  } | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<string[]>([])
    // Toppings state
  const [toppings, setToppings] = useState<Topping[]>([])
  const [toppingDialogOpen, setToppingDialogOpen] = useState(false)
  const [editingTopping, setEditingTopping] = useState<Topping | null>(null)
  const [toppingForm, setToppingForm] = useState({ name: "", category: "", price: "" })
  const toppingCategoryOptions = useMemo(() => {
    const map = new Map<string, string>()
    for (const c of categories) {
      const rawValue = (c.slug ?? c.name) ?? ""
      const value = normalizeToppingCategory(rawValue)
      if (!value) continue
      if (!map.has(value)) map.set(value, c.name)
    }

    return Array.from(map.entries()).map(([value, label]) => ({
      value,
      label,
    }))
  }, [categories])

  useEffect(() => {
    if (!toppingForm.category && toppingCategoryOptions.length > 0) {
      setToppingForm((prev) => ({
        ...prev,
        category: toppingCategoryOptions[0]?.value ?? prev.category,
      }))
    }
  }, [toppingCategoryOptions, toppingForm.category])
  const [toppingFilter, setToppingFilter] = useState<string>("all")

  const resolveToppingCategoryId = useCallback(
    (categoryValue: string): number | null => {
      const match = categories.find((c) => {
        if (c.id === categoryValue) return true
        const fromSlug = normalizeToppingCategory(c.slug)
        if (fromSlug && fromSlug === categoryValue) return true
        const fromName = normalizeToppingCategory(c.name)
        return fromName === categoryValue
      })
      if (!match) return null
      const parsed = Number.parseInt(match.id, 10)
      return Number.isFinite(parsed) ? parsed : null
    },
    [categories],
  )

  // Crusts state
  const [crusts, setCrusts] = useState<Crust[]>([])
  const [crustDialogOpen, setCrustDialogOpen] = useState(false)
  const [editingCrust, setEditingCrust] = useState<Crust | null>(null)
  const [crustForm, setCrustForm] = useState({ name: "", price: "" })
  const [businessHours, setBusinessHours] = useState<BusinessHourRow[]>(() =>
    defaultBusinessHourRows(),
  )

  const loadAll = useCallback(async () => {
    setLoading(true)
    setLoadError(null)

    const [st, no, bh, pay, cat, toppingsRes, crustsRes] = await Promise.all([
      apiGetStore(),
      apiGetNotifications(),
      apiGetBusinessHours(),
      apiGetPayments(),
      apiListCategories(),
      apiListToppings(),
      apiListCrusts(),
    ])

    const batch = [st, no, bh, pay, cat, toppingsRes, crustsRes]
    if (batch.some((r) => isUnauthorizedApiError(r))) {
      setLoading(false)
      return
    }

    let next = DEFAULT_SETTINGS
    if (!st.ok) {
      // General tab depends on store settings; toppings/categories should still load.
      setLoadError(st.message)
      setStoreSnapshot({})
    } else {
      setStoreSnapshot({ ...(st.data as Record<string, unknown>) })
      next = mapStoreToForm(st.data as Record<string, unknown>, DEFAULT_SETTINGS)
    }

    if (no.ok) {
      next = { ...next, ...mapNotificationsToForm(no.data, next) }
    }

    if (bh.ok) {
      setBusinessHours(
        bh.data.length > 0
          ? normalizeBusinessHoursFromApi(bh.data)
          : defaultBusinessHourRows(),
      )
    }

    if (pay.ok) {
      setPaymentsSnapshot(pay.data)
      const ex = extractDeliveryFromPayments(pay.data)
      if (ex.taxRate != null) next = { ...next, taxRate: ex.taxRate }
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

    if (toppingsRes.ok) {
      setToppings(mapApiToppingsToUi(toppingsRes.data))
    } else {
      // Keep the settings page usable even if the toppings endpoint errors.
      setToppings([])
    }

    if (crustsRes.ok) {
      setCrusts(mapApiCrustsToUi(crustsRes.data))
    } else {
      setCrusts([])
    }

    setLoading(false)
  }, [])

  async function refreshToppings() {
    const res = await apiListToppings()
    if (res.ok) setToppings(mapApiToppingsToUi(res.data))
    else if (!isUnauthorizedApiError(res)) setLoadError(res.message)
  }

  async function refreshCrusts() {
    const res = await apiListCrusts()
    if (res.ok) setCrusts(mapApiCrustsToUi(res.data))
    else if (!isUnauthorizedApiError(res)) setLoadError(res.message)
  }

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
    const payBody = buildPaymentsPutBody(
      settings.taxRate,
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
    const payload = businessHours.map((r) => ({
      day: r.day.trim().toLowerCase(),
      open_time: (r.open_time ?? "10:00").slice(0, 5),
      close_time: (r.close_time ?? "18:00").slice(0, 5),
    }))
    const res = await apiPutBusinessHours(payload)
    setSaving(null)
    if (!res.ok) {
      if (!isUnauthorizedApiError(res)) setLoadError(res.message)
      return
    }
    await loadAll()
    toast({ title: "Saved", description: "Business hours were updated." })
  }

  const updateBusinessHour = (index: number, patch: Partial<BusinessHourRow>) => {
    setBusinessHours((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    )
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
    const deleteType = itemToDelete.type
    setDeletePending(true)
    setLoadError(null)
    if (itemToDelete.type === "category" && itemToDelete.categoryId) {
      const res = await apiDeleteCategory(Number(itemToDelete.categoryId))
      setDeletePending(false)
      if (!res.ok) {
        if (!isUnauthorizedApiError(res)) setLoadError(res.message)
        return
      }
    } else if (itemToDelete.type === "subcategory" && itemToDelete.subcategoryId ) {
      const res = await apiDeleteSubcategory(Number(itemToDelete.subcategoryId))
      setDeletePending(false)
      if (!res.ok) {
        if (!isUnauthorizedApiError(res)) setLoadError(res.message)
        return
      }
      
    } 
    else if (itemToDelete.type === "topping" && itemToDelete.itemId) {
      const res = await apiDeleteTopping(itemToDelete.itemId)
      setDeletePending(false)
      if (!res.ok) {
        if (!isUnauthorizedApiError(res)) setLoadError(res.message)
        return
      }
    } else if (itemToDelete.type === "crust" && itemToDelete.itemId) {
      const res = await apiDeleteCrust(itemToDelete.itemId)
      setDeletePending(false)
      if (!res.ok) {
        if (!isUnauthorizedApiError(res)) setLoadError(res.message)
        return
      }
    }
    setDeleteDialogOpen(false)
    setItemToDelete(null)
    if (deleteType === "category" || deleteType === "subcategory") {
      const cat = await apiListCategories()
      if (cat.ok) setCategories(cat.data.map(apiCategoryToUi))
      return
    }
    if (deleteType === "topping") {
      await refreshToppings()
    }
    if (deleteType === "crust") {
      await refreshCrusts()
    }
  }
  // Topping handlers
  const openAddTopping = () => {
    setEditingTopping(null)
    setToppingForm({
      name: "",
      category: toppingCategoryOptions[0]?.value ?? "veggies",
      price: "",
    })
    setToppingDialogOpen(true)
  }

  const openEditTopping = (topping: Topping) => {
    setEditingTopping(topping)
    setToppingForm({ name: topping.name, category: topping.category, price: topping.price.toString() })
    setToppingDialogOpen(true)
  }

  const handleSaveTopping = async () => {
    const name = toppingForm.name.trim()
    if (!name || !toppingForm.category || !toppingForm.price.trim()) return
    const priceNum = Number.parseFloat(toppingForm.price)
    if (!Number.isFinite(priceNum)) return
    const categoryId = resolveToppingCategoryId(toppingForm.category)
    if (!categoryId) {
      setLoadError("Please select a valid topping category.")
      return
    }

    setToppingBusy(true)
    setLoadError(null)

    const payload = {
      name,
      category_id: categoryId,
      price: priceNum,
      is_available: editingTopping?.available ?? true,
      sort_order: 0,
    }

    const res = editingTopping
      ? await apiUpdateTopping(editingTopping.id, payload)
      : await apiCreateTopping(payload)

    setToppingBusy(false)
    if (!res.ok) {
      if (!isUnauthorizedApiError(res)) setLoadError(res.message)
      return
    }

    setToppingDialogOpen(false)
    setEditingTopping(null)
    await refreshToppings()
    toast({
      title: "Saved",
      description: editingTopping ? "Topping was updated." : "Topping was added.",
    })
  }

  const toggleToppingAvailability = async (id: string) => {
    if (toppingBusy) return
    const current = toppings.find((t) => t.id === id)
    if (!current) return
    const nextAvailable = !current.available
    const categoryId = resolveToppingCategoryId(current.category)
    if (!categoryId) {
      setLoadError("Unable to update topping: invalid category.")
      return
    }

    setToppingBusy(true)
    setLoadError(null)

    // Optimistic update
    setToppings((prev) =>
      prev.map((t) => (t.id === id ? { ...t, available: nextAvailable } : t)),
    )

    const res = await apiUpdateTopping(id, {
      name: current.name,
      category_id: categoryId,
      price: current.price,
      is_available: nextAvailable,
      sort_order: 0,
    })

    setToppingBusy(false)
    if (!res.ok) {
      if (!isUnauthorizedApiError(res)) setLoadError(res.message)
      await refreshToppings()
    }
  }

  const filteredToppings = toppingFilter === "all" 
    ? toppings 
    : toppings.filter((t) => t.category === toppingFilter)

  // Crust handlers
  const openAddCrust = () => {
    setEditingCrust(null)
    setCrustForm({ name: "", price: "" })
    setCrustDialogOpen(true)
  }

  const openEditCrust = (crust: Crust) => {
    setEditingCrust(crust)
    setCrustForm({ name: crust.name, price: crust.price.toString() })
    setCrustDialogOpen(true)
  }

  const handleSaveCrust = async () => {
    const name = crustForm.name.trim()
    if (!name) return
    const priceNum = Number.parseFloat(crustForm.price || "0")
    if (!Number.isFinite(priceNum)) return

    setCrustBusy(true)
    setLoadError(null)

    const payload = {
      name,
      price: priceNum,
      is_available: editingCrust?.available ?? true,
      sort_order: 0,
    }

    const res = editingCrust
      ? await apiUpdateCrust(editingCrust.id, payload)
      : await apiCreateCrust(payload)

    setCrustBusy(false)
    if (!res.ok) {
      if (!isUnauthorizedApiError(res)) setLoadError(res.message)
      return
    }

    setCrustDialogOpen(false)
    setEditingCrust(null)
    await refreshCrusts()
    toast({
      title: "Saved",
      description: editingCrust ? "Crust was updated." : "Crust was added.",
    })
  }

  const toggleCrustAvailability = async (id: string) => {
    if (crustBusy) return
    const current = crusts.find((c) => c.id === id)
    if (!current) return
    const nextAvailable = !current.available

    setCrustBusy(true)
    setLoadError(null)

    setCrusts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, available: nextAvailable } : c)),
    )

    const res = await apiUpdateCrust(id, {
      name: current.name,
      price: current.price,
      is_available: nextAvailable,
      sort_order: 0,
    })

    setCrustBusy(false)
    if (!res.ok) {
      if (!isUnauthorizedApiError(res)) setLoadError(res.message)
      await refreshCrusts()
    }
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
            <TabsList className="grid w-full grid-cols-7 lg:w-[820px]">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="hours">Hours</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="toppings">Toppings</TabsTrigger>
              <TabsTrigger value="crusts">Crusts</TabsTrigger>
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
                        </code>
                        . Set open hours per weekday; toggle off for closed days.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border">
                    <div className="grid grid-cols-[1fr_auto_1fr_1fr] gap-2 border-b bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground sm:px-4">
                      <span>Day</span>
                      <span className="text-center">Open</span>
                      <span>Opens</span>
                      <span>Closes</span>
                    </div>
                    {businessHours.map((row, i) => {
                      const openVal = (row.open_time ?? "10:00").slice(0, 5)
                      const closeVal = (row.close_time ?? "18:00").slice(0, 5)
                      const isOpen = row.is_open !== false
                      return (
                        <div
                          key={row.day}
                          className="grid grid-cols-[1fr_auto_1fr_1fr] items-center gap-2 border-b px-3 py-3 last:border-0 sm:px-4"
                        >
                          <span className="font-medium text-foreground">
                            {dayLabel(row.day)}
                          </span>
                          <div className="flex justify-center">
                            <Switch
                              checked={isOpen}
                              onCheckedChange={(checked) =>
                                updateBusinessHour(i, { is_open: Boolean(checked) })
                              }
                            />
                          </div>
                          <Input
                            id={`open-${row.day}`}
                            type="time"
                            disabled={!isOpen}
                            value={openVal}
                            onChange={(e) =>
                              updateBusinessHour(i, { open_time: e.target.value })
                            }
                            className="min-w-0"
                          />
                          <Input
                            id={`close-${row.day}`}
                            type="time"
                            disabled={!isOpen}
                            value={closeVal}
                            onChange={(e) =>
                              updateBusinessHour(i, { close_time: e.target.value })
                            }
                            className="min-w-0"
                          />
                        </div>
                      )
                    })}
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
            {/* Toppings */}
          <TabsContent value="toppings">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Cherry className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle>Pizza Toppings</CardTitle>
                      <CardDescription>
                        Manage available toppings and their prices
                      </CardDescription>
                    </div>
                  </div>
                  <Button onClick={openAddTopping}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Topping
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex flex-wrap gap-2">
                  <Button
                    variant={toppingFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setToppingFilter("all")}
                  >
                    All ({toppings.length})
                  </Button>
                  {toppingCategoryOptions.map((cat) => (
                    <Button
                      key={cat.value}
                      variant={toppingFilter === cat.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setToppingFilter(cat.value)}
                    >
                      {cat.label} ({toppings.filter((t) => t.category === cat.value).length})
                    </Button>
                  ))}
                </div>

                <div className="rounded-lg border">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-4 py-3 text-left text-sm font-medium">Topping</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Category</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Price</th>
                        <th className="px-4 py-3 text-center text-sm font-medium">Available</th>
                        <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredToppings.map((topping) => (
                        <tr key={topping.id} className="border-b last:border-0">
                          <td className="px-4 py-3 font-medium">{topping.name}</td>
                          <td className="px-4 py-3">
                            <Badge variant="secondary">
                              {toppingCategoryOptions.find(
                                (c) => c.value === topping.category,
                              )?.label ?? topping.category}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            {topping.price === 0 ? (
                              <span className="text-muted-foreground">Free</span>
                            ) : (
                              <span>+${topping.price.toFixed(2)}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Switch
                              checked={topping.available}
                              disabled={toppingBusy}
                              onCheckedChange={() => void toggleToppingAvailability(topping.id)}
                            />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditTopping(topping)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setItemToDelete({ type: "topping", itemId: topping.id })
                                  setDeleteDialogOpen(true)
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {toppings.length === 0 && (
                  <div className="py-12 text-center">
                    <Cherry className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <h3 className="mt-4 text-lg font-medium">No toppings yet</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Add your first topping to offer customizations.
                    </p>
                    <Button className="mt-4" onClick={openAddTopping}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Topping
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Crusts */}
          <TabsContent value="crusts">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Circle className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle>Crust Options</CardTitle>
                      <CardDescription>
                        Manage crust types and additional charges
                      </CardDescription>
                    </div>
                  </div>
                  <Button onClick={openAddCrust}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Crust
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {crusts.map((crust) => (
                    <div
                      key={crust.id}
                      className={`rounded-lg border p-4 ${!crust.available ? "opacity-60" : ""}`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{crust.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {crust.price === 0 ? (
                              "No extra charge"
                            ) : (
                              <span>+${crust.price.toFixed(2)}</span>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEditCrust(crust)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setItemToDelete({ type: "crust", itemId: crust.id })
                              setDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Available</span>
                        <Switch
                          checked={crust.available}
                          disabled={crustBusy}
                          onCheckedChange={() => void toggleCrustAvailability(crust.id)}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {crusts.length === 0 && (
                  <div className="py-12 text-center">
                    <Circle className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <h3 className="mt-4 text-lg font-medium">No crust options yet</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Add crust options for your pizzas.
                    </p>
                    <Button className="mt-4" onClick={openAddCrust}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Crust
                    </Button>
                  </div>
                )}
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
         {/* Topping Dialog */}
        <Dialog open={toppingDialogOpen} onOpenChange={setToppingDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingTopping ? "Edit Topping" : "Add New Topping"}
              </DialogTitle>
              <DialogDescription>
                {editingTopping ? "Update the topping details below." : "Add a new topping with category and price."}
              </DialogDescription>
            </DialogHeader>
            <FieldGroup className="py-4">
              <Field>
                <FieldLabel htmlFor="toppingName">Topping Name</FieldLabel>
                <Input
                  id="toppingName"
                  value={toppingForm.name}
                  onChange={(e) => setToppingForm({ ...toppingForm, name: e.target.value })}
                  placeholder="e.g., Pepperoni, Mushrooms"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="toppingCategory">Category</FieldLabel>
                <Select
                  value={toppingForm.category}
                  onValueChange={(value) => setToppingForm({ ...toppingForm, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {toppingCategoryOptions.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="toppingPrice">Additional Price ($)</FieldLabel>
                <Input
                  id="toppingPrice"
                  type="number"
                  step="0.01"
                  value={toppingForm.price}
                  onChange={(e) => setToppingForm({ ...toppingForm, price: e.target.value })}
                  placeholder="0.00"
                />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button variant="outline" onClick={() => setToppingDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => void handleSaveTopping()}
                disabled={
                  toppingBusy ||
                  !toppingForm.name.trim() ||
                  !toppingForm.category ||
                  !toppingForm.price.trim()
                }
              >
                {editingTopping ? "Save Changes" : "Add Topping"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Crust Dialog */}
        <Dialog open={crustDialogOpen} onOpenChange={setCrustDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCrust ? "Edit Crust" : "Add New Crust"}
              </DialogTitle>
              <DialogDescription>
                {editingCrust ? "Update the crust details below." : "Add a new crust option with price."}
              </DialogDescription>
            </DialogHeader>
            <FieldGroup className="py-4">
              <Field>
                <FieldLabel htmlFor="crustName">Crust Name</FieldLabel>
                <Input
                  id="crustName"
                  value={crustForm.name}
                  onChange={(e) => setCrustForm({ ...crustForm, name: e.target.value })}
                  placeholder="e.g., Thin Crust, Deep Dish"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="crustPrice">Additional Price ($)</FieldLabel>
                <Input
                  id="crustPrice"
                  type="number"
                  step="0.01"
                  value={crustForm.price}
                  onChange={(e) => setCrustForm({ ...crustForm, price: e.target.value })}
                  placeholder="0.00 (leave 0 for no extra charge)"
                />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCrustDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => void handleSaveCrust()}
                disabled={crustBusy || !crustForm.name.trim()}
              >
                {editingCrust ? "Save Changes" : "Add Crust"}
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
                  : itemToDelete?.type === "subcategory"
                    ? "This will delete the subcategory. This action cannot be undone."
                    : itemToDelete?.type === "topping"
                      ? "This will delete the topping. This action cannot be undone."
                      : itemToDelete?.type === "crust"
                        ? "This will delete the crust. This action cannot be undone."
                        : "This action cannot be undone."}
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

