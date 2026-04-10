"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
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
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, Plus, Pencil, AlertTriangle, Package, Trash2 } from "lucide-react"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { cn } from "@/lib/utils"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/hooks/use-toast"
import { isUnauthorizedApiError } from "@/lib/api/client"
import {
  apiCreateInventory,
  apiDeleteInventory,
  apiListInventory,
  apiUpdateInventory,
  type ApiInventoryItem,
} from "@/lib/api/inventory"
import { apiListCategories } from "@/lib/api/menu"

interface InventoryItem {
  id: number
  name: string
  stock: number
  unit: string
  reorderLevel: number
  category: string
  lastRestocked: string
}

const defaultUnits = ["kg", "liters", "pieces", "boxes"]
const fallbackCategories = ["dairy", "dough", "sauces", "toppings", "vegetables", "oils"]

function toNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v
  if (typeof v === "string" && v.trim().length > 0) {
    const n = Number(v)
    if (Number.isFinite(n)) return n
  }
  return null
}

function mapInventoryItem(raw: ApiInventoryItem): InventoryItem | null {
  const id = toNumber(raw.id)
  if (id == null) return null
  const stock = toNumber(raw.current_stock) ?? 0
  const reorder = toNumber(raw.reorder_level) ?? toNumber(raw.min_stock_level) ?? 0
  return {
    id,
    name: raw.name?.trim() || `Item #${id}`,
    stock,
    unit: raw.unit?.trim() || "pieces",
    reorderLevel: reorder,
    category: raw.category?.trim() || "other",
    lastRestocked: (raw.updated_at || raw.created_at || "").slice(0, 10),
  }
}

function normalizeUnitCandidates(unit: string): string[] {
  const u = unit.trim().toLowerCase()
  const variants = new Set<string>([u, unit.trim()])
  if (u === "kg") {
    variants.add("kilogram")
    variants.add("kilograms")
  }
  if (u === "liters" || u === "liter" || u === "l") {
    variants.add("liter")
    variants.add("liters")
  }
  if (u === "pieces" || u === "piece" || u === "pcs") {
    variants.add("piece")
    variants.add("pieces")
  }
  if (u === "boxes" || u === "box") {
    variants.add("box")
    variants.add("boxes")
  }
  return Array.from(variants)
}

function normalizeCategoryCandidates(rawCategory: string, mappedCategory: string): string[] {
  const original = rawCategory.trim()
  const mapped = mappedCategory.trim()
  const variants = new Set<string>([
    original,
    mapped,
    original.toLowerCase(),
    mapped.toLowerCase(),
    original.toLowerCase().replace(/\s+/g, "_"),
    original.toLowerCase().replace(/\s+/g, "-"),
  ])
  return Array.from(variants).filter(Boolean)
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [categoryNames, setCategoryNames] = useState<string[]>([])
  const [categoryValueByName, setCategoryValueByName] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [showLowStock, setShowLowStock] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<InventoryItem | null>(null)
  const [deletePending, setDeletePending] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    stock: "",
    unit: "kg",
    reorderLevel: "",
    category: "toppings",
  })

  const refresh = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    const [invRes, catRes] = await Promise.all([
      apiListInventory({ per_page: 100 }),
      apiListCategories(),
    ])

    if (!invRes.ok) {
      if (!isUnauthorizedApiError(invRes)) setLoadError(invRes.message)
      setLoading(false)
      return
    }

    if (!catRes.ok) {
      if (!isUnauthorizedApiError(catRes)) setLoadError(catRes.message)
      setLoading(false)
      return
    }

    const names = catRes.data
      .map((c) => c.name?.trim())
      .filter((name): name is string => Boolean(name))
    const categoryMap: Record<string, string> = {}
    for (const c of catRes.data) {
      const name = c.name?.trim()
      if (!name) continue
      const slug = c.slug?.trim()
      const apiValue = slug && slug.length > 0 ? slug : name.toLowerCase().replace(/\s+/g, "_")
      categoryMap[name] = apiValue
      categoryMap[apiValue] = apiValue
    }
    setCategoryNames(names)
    setCategoryValueByName(categoryMap)
    setInventory(invRes.data.map(mapInventoryItem).filter((i): i is InventoryItem => i !== null))
    setLoading(false)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter
    const matchesLowStock = !showLowStock || item.stock <= item.reorderLevel
    return matchesSearch && matchesCategory && matchesLowStock
  })

  const categories = useMemo(() => {
    const source = categoryNames.length ? categoryNames : fallbackCategories
    const set = new Set(source)
    return [
      { value: "all", label: "All Categories" },
      ...Array.from(set).sort().map((c) => ({ value: c, label: c[0].toUpperCase() + c.slice(1) })),
    ]
  }, [categoryNames])

  const units = useMemo(() => {
    const set = new Set([...defaultUnits, ...inventory.map((i) => i.unit).filter(Boolean)])
    return Array.from(set)
  }, [inventory])

  const lowStockCount = inventory.filter((item) => item.stock <= item.reorderLevel).length

  const handleAddItem = async () => {
    const name = formData.name.trim()
    const stock = Number(formData.stock)
    const reorder = Number(formData.reorderLevel)
    if (!name || !Number.isFinite(stock) || !Number.isFinite(reorder) || !formData.category.trim()) {
      setActionError("Name, stock, reorder level and category are required.")
      return
    }
    setActionError(null)
    setSaving(true)
    const categoryApiValue =
      categoryValueByName[formData.category.trim()] ??
      formData.category.trim().toLowerCase().replace(/\s+/g, "_")

    let createOk = false
    let lastMessage = "Unable to create inventory item."
    const categoryCandidates = normalizeCategoryCandidates(formData.category, categoryApiValue)
    const unitCandidates = normalizeUnitCandidates(formData.unit || "pieces")
    for (const cat of categoryCandidates) {
      for (const unit of unitCandidates) {
        const res = await apiCreateInventory({
          name,
          category: cat,
          unit,
          current_stock: stock,
          min_stock_level: reorder,
          reorder_level: reorder,
        })
        if (res.ok) {
          createOk = true
          break
        }
        if (isUnauthorizedApiError(res)) {
          setSaving(false)
          return
        }
        lastMessage = res.message || lastMessage
      }
      if (createOk) break
    }

    setSaving(false)
    if (!createOk) {
      setActionError(lastMessage)
      return
    }
    setIsAddDialogOpen(false)
    resetForm()
    await refresh()
    toast({ title: "Saved", description: "Inventory item was created." })
  }

  const handleEditItem = async () => {
    if (!editingItem) return
    const name = formData.name.trim()
    const stock = Number(formData.stock)
    const reorder = Number(formData.reorderLevel)
    if (!name || !Number.isFinite(stock) || !Number.isFinite(reorder) || !formData.category.trim()) {
      setActionError("Name, stock, reorder level and category are required.")
      return
    }
    setActionError(null)
    setSaving(true)
    const categoryApiValue =
      categoryValueByName[formData.category.trim()] ??
      formData.category.trim().toLowerCase().replace(/\s+/g, "_")

    let updateOk = false
    let lastMessage = "Unable to update inventory item."
    const categoryCandidates = normalizeCategoryCandidates(formData.category, categoryApiValue)
    const unitCandidates = normalizeUnitCandidates(formData.unit || "pieces")
    for (const cat of categoryCandidates) {
      for (const unit of unitCandidates) {
        const res = await apiUpdateInventory(editingItem.id, {
          name,
          category: cat,
          unit,
          current_stock: stock,
          min_stock_level: reorder,
          reorder_level: reorder,
        })
        if (res.ok) {
          updateOk = true
          break
        }
        if (isUnauthorizedApiError(res)) {
          setSaving(false)
          return
        }
        lastMessage = res.message || lastMessage
      }
      if (updateOk) break
    }

    setSaving(false)
    if (!updateOk) {
      setActionError(lastMessage)
      return
    }
    setEditingItem(null)
    resetForm()
    await refresh()
    toast({ title: "Saved", description: "Inventory item was updated." })
  }

  const handleDeleteItem = async () => {
    if (!deleteTarget) return
    setDeletePending(true)
    setActionError(null)
    const res = await apiDeleteInventory(deleteTarget.id)
    setDeletePending(false)
    if (!res.ok) {
      if (!isUnauthorizedApiError(res)) setActionError(res.message)
      return
    }
    setDeleteTarget(null)
    setInventory((prev) => prev.filter((i) => i.id !== deleteTarget.id))
    toast({ title: "Deleted", description: "Inventory item was removed." })
  }

  const resetForm = () => {
    setActionError(null)
    setFormData({
      name: "",
      stock: "",
      unit: "kg",
      reorderLevel: "",
      category: categories[1]?.value || "other",
    })
  }

  const openEditDialog = (item: InventoryItem) => {
    setActionError(null)
    setEditingItem(item)
    setFormData({
      name: item.name,
      stock: item.stock.toString(),
      unit: item.unit,
      reorderLevel: item.reorderLevel.toString(),
      category: item.category,
    })
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <AlertDialog
          open={deleteTarget !== null}
          onOpenChange={(open) => {
            if (!open && !deletePending) setDeleteTarget(null)
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete inventory item?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone.{" "}
                <span className="font-medium">{deleteTarget?.name ?? "This item"}</span> will be removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deletePending}>Cancel</AlertDialogCancel>
              <Button
                variant="destructive"
                disabled={deletePending}
                onClick={() => void handleDeleteItem()}
              >
                {deletePending ? "Deleting..." : "Delete"}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Page header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Inventory</h1>
            <p className="text-muted-foreground">
              Track and manage your ingredient stock levels
            </p>
          </div>
          <Dialog
            open={isAddDialogOpen}
            onOpenChange={(open) => {
              setIsAddDialogOpen(open)
              if (!open && !saving) resetForm()
            }}
          >
            <DialogTrigger asChild>
              <Button
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={resetForm}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Inventory Item</DialogTitle>
                <DialogDescription>
                  Add a new ingredient to your inventory.
                </DialogDescription>
              </DialogHeader>
              <InventoryForm
                categories={categories.filter((c) => c.value !== "all")}
                units={units}
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleAddItem}
                submitLabel="Add Item"
                submitting={saving}
                actionError={actionError}
              />
            </DialogContent>
          </Dialog>
        </div>

        {loadError && (
          <Card className="border-destructive/40">
            <CardContent className="pt-6 text-sm text-destructive">{loadError}</CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="rounded-lg bg-primary/10 p-3">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold">{inventory.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="rounded-lg bg-success/10 p-3">
                <Package className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">In Stock</p>
                <p className="text-2xl font-bold">
                  {inventory.filter((i) => i.stock > i.reorderLevel).length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className={cn(lowStockCount > 0 && "border-destructive/50")}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="rounded-lg bg-destructive/10 p-3">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Low Stock</p>
                <p className="text-2xl font-bold text-destructive">{lowStockCount}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search inventory..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant={showLowStock ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowLowStock(!showLowStock)}
                  className={showLowStock ? "bg-destructive hover:bg-destructive/90" : ""}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Low Stock Only
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inventory table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Inventory Items ({filteredInventory.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-3 py-8 text-muted-foreground">
                <Spinner className="h-4 w-4" />
                Loading inventory...
              </div>
            ) : filteredInventory.length === 0 ? (
              <div className="py-8 text-sm text-muted-foreground">No inventory items found.</div>
            ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead className="hidden sm:table-cell">Unit</TableHead>
                  <TableHead className="hidden md:table-cell">Reorder Level</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.map((item) => {
                  const isLowStock = item.stock <= item.reorderLevel
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {item.category}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "font-semibold",
                            isLowStock ? "text-destructive" : "text-foreground"
                          )}
                        >
                          {item.stock} {item.unit}
                        </span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{item.unit}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {item.reorderLevel} {item.unit}
                      </TableCell>
                      <TableCell>
                        {isLowStock ? (
                          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                            Low Stock
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                            In Stock
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog
                          open={editingItem?.id === item.id}
                          onOpenChange={(open) => !open && setEditingItem(null)}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditDialog(item)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Inventory Item</DialogTitle>
                              <DialogDescription>
                                Update stock levels and item details.
                              </DialogDescription>
                            </DialogHeader>
                            <InventoryForm
                              categories={categories.filter((c) => c.value !== "all")}
                              units={units}
                              formData={formData}
                              setFormData={setFormData}
                              onSubmit={handleEditItem}
                              submitLabel="Save Changes"
                              submitting={saving}
                              actionError={actionError}
                            />
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(item)}
                          disabled={deletePending || saving}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

function InventoryForm({
  categories,
  units,
  formData,
  setFormData,
  onSubmit,
  submitLabel,
  submitting,
  actionError,
}: {
  categories: Array<{ value: string; label: string }>
  units: string[]
  formData: {
    name: string
    stock: string
    unit: string
    reorderLevel: string
    category: string
  }
  setFormData: React.Dispatch<
    React.SetStateAction<{
      name: string
      stock: string
      unit: string
      reorderLevel: string
      category: string
    }>
  >
  onSubmit: () => Promise<void> | void
  submitLabel: string
  submitting: boolean
  actionError: string | null
}) {
  return (
    <FieldGroup className="mt-4">
      <Field>
        <FieldLabel htmlFor="name">Item Name</FieldLabel>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Ingredient name"
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field>
          <FieldLabel htmlFor="stock">Stock Quantity</FieldLabel>
          <Input
            id="stock"
            type="number"
            step="0.1"
            value={formData.stock}
            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
            placeholder="0"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="unit">Unit</FieldLabel>
          <Select
            value={formData.unit}
            onValueChange={(value) => setFormData({ ...formData, unit: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
            {units.map((unit) => (
              <SelectItem key={unit} value={unit}>
                {unit}
              </SelectItem>
            ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
      <Field>
        <FieldLabel htmlFor="reorderLevel">Reorder Level</FieldLabel>
        <Input
          id="reorderLevel"
          type="number"
          step="0.1"
          value={formData.reorderLevel}
          onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
          placeholder="Minimum stock level"
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="category">Category</FieldLabel>
        <Select
          value={formData.category}
          onValueChange={(value) => setFormData({ ...formData, category: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      {actionError && <p className="text-sm text-destructive">{actionError}</p>}
      <DialogFooter className="mt-4">
        <Button onClick={onSubmit} className="w-full" disabled={submitting}>
          {submitting ? "Saving..." : submitLabel}
        </Button>
      </DialogFooter>
    </FieldGroup>
  )
}
