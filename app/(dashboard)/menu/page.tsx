"use client"

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Image from "next/image"
import { Search, Plus, Pencil, Trash2, Pizza } from "lucide-react"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import type { ApiCategory, ApiMenuItem } from "@/lib/api/menu"
import {
  apiCreateMenuItem,
  apiDeleteMenuItem,
  apiListCategories,
  apiListMenuItems,
  apiPatchMenuItemAvailability,
  apiUpdateMenuItem,
} from "@/lib/api/menu"
import {
  emptyMenuForm,
  menuItemToRow,
  menuRowToForm,
  buildMenuItemMultipartBody,
  type MenuFormValues,
  type MenuRow,
} from "@/lib/menu/map-api"
import { isUnauthorizedApiError } from "@/lib/api/client"
import { toast } from "@/hooks/use-toast"

export default function MenuPage() {
  const [categories, setCategories] = useState<ApiCategory[]>([])
  const [allItems, setAllItems] = useState<ApiMenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingRow, setEditingRow] = useState<MenuRow | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<MenuRow | null>(null)
  const [deletePending, setDeletePending] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)

  const [formData, setFormData] = useState<MenuFormValues>(() =>
    emptyMenuForm(""),
  )

  const formDataRef = useRef(formData)
  const uploadFileRef = useRef<File | null>(null)
  formDataRef.current = formData
  uploadFileRef.current = uploadFile

  const refresh = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    const catRes = await apiListCategories()
    if (!catRes.ok) {
      if (!isUnauthorizedApiError(catRes)) setLoadError(catRes.message)
      setLoading(false)
      return
    }
    setCategories(catRes.data)

    const itemRes = await apiListMenuItems({ per_page: 100 })
    if (!itemRes.ok) {
      if (!isUnauthorizedApiError(itemRes)) setLoadError(itemRes.message)
      setLoading(false)
      return
    }
    setAllItems(itemRes.data)
    setLoading(false)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    if (!categories.length) return
    setFormData((f) => {
      if (f.categoryId) return f
      const first = categories[0]
      const id = String(first.id)
      return {
        ...f,
        categoryId: id,
        sizesEnabled:
          first.has_sizes === true ? true : f.sizesEnabled,
      }
    })
  }, [categories])

  const defaultCategoryId = categories[0] ? String(categories[0].id) : ""

  const menuRows = useMemo(() => {
    const rows = allItems.map((it) => menuItemToRow(it, categories))
    return rows.filter((row) => {
      const matchesSearch =
        !searchQuery.trim() ||
        row.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory =
        categoryFilter === "all" || String(row.categoryId) === categoryFilter
      return matchesSearch && matchesCategory
    })
  }, [allItems, categories, searchQuery, categoryFilter])

  const filterOptions = useMemo(
    () => [
      { value: "all", label: "All Categories" },
      ...categories.map((c) => ({ value: String(c.id), label: c.name })),
    ],
    [categories],
  )

  const resetForm = useCallback(() => {
    setFormData(emptyMenuForm(defaultCategoryId))
    setUploadFile(null)
    setActionError(null)
  }, [defaultCategoryId])

  async function handleAddItem() {
    if (!categories.length) return
    setActionError(null)
    setSaving(true)
    const payload = buildMenuItemMultipartBody(
      formDataRef.current,
      categories,
      uploadFileRef.current,
    )
    const res = await apiCreateMenuItem(payload)
    setSaving(false)
    if (!res.ok) {
      if (!isUnauthorizedApiError(res)) setActionError(res.message)
      return
    }
    toast({ title: "Saved", description: "New menu item was added." })
    setIsAddDialogOpen(false)
    resetForm()
    await refresh()
  }

  async function handleEditItem() {
    if (!editingRow || !categories.length) return
    setActionError(null)
    setSaving(true)
    const payload = buildMenuItemMultipartBody(
      formDataRef.current,
      categories,
      uploadFileRef.current,
    )
    const res = await apiUpdateMenuItem(editingRow.id, payload)
    setSaving(false)
    if (!res.ok) {
      if (!isUnauthorizedApiError(res)) setActionError(res.message)
      return
    }
    toast({ title: "Saved", description: "Menu item was updated." })
    setEditingRow(null)
    resetForm()
    await refresh()
  }

  async function handleToggleAvailability(row: MenuRow) {
    const next = !row.available
    const res = await apiPatchMenuItemAvailability(row.id, next)
    if (!res.ok) {
      if (!isUnauthorizedApiError(res)) setLoadError(res.message)
      return
    }
    await refresh()
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    const idToRemove = deleteTarget.id
    setDeletePending(true)
    setLoadError(null)
    const res = await apiDeleteMenuItem(idToRemove)
    setDeletePending(false)
    if (!res.ok) {
      if (!isUnauthorizedApiError(res)) setLoadError(res.message)
      return
    }
    setDeleteTarget(null)
    setAllItems((items) => items.filter((i) => i.id !== idToRemove))
    await refresh()
  }

  function openEditDialog(row: MenuRow) {
    setActionError(null)
    setEditingRow(row)
    setUploadFile(null)
    setFormData(menuRowToForm(row))
  }

  function openAddDialog() {
    setActionError(null)
    resetForm()
    setIsAddDialogOpen(true)
  }

  return (
    <DashboardLayout>
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !deletePending) setDeleteTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete menu item?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget ? (
                <>
                  This will permanently remove{" "}
                  <span className="font-medium text-foreground">
                    {deleteTarget.name}
                  </span>{" "}
                  from the menu. This action cannot be undone.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePending}>
              Cancel
            </AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={deletePending}
              onClick={() => void confirmDelete()}
            >
              {deletePending ? "Deleting…" : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Menu Management
            </h1>
            <p className="text-muted-foreground">
              Menu items from your PizzaHub API (
              <code className="text-xs">/v1/menu-items</code>,{" "}
              <code className="text-xs">/v1/categories</code>)
            </p>
          </div>
          <Dialog
            open={isAddDialogOpen}
            onOpenChange={(o) => {
              setIsAddDialogOpen(o)
              if (!o) resetForm()
            }}
          >
            <DialogTrigger asChild>
              <Button
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={openAddDialog}
                disabled={!categories.length || loading}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add Menu Item</DialogTitle>
                <DialogDescription>
                  Creates a new item via <code>POST /v1/menu-items</code>.
                </DialogDescription>
              </DialogHeader>
              {actionError ? (
                <p className="text-sm text-destructive" role="alert">
                  {actionError}
                </p>
              ) : null}
              <MenuItemForm
                categories={categories}
                formData={formData}
                setFormData={setFormData}
                imageFile={uploadFile}
                setImageFile={setUploadFile}
                allowFileUpload
                onSubmit={() => void handleAddItem()}
                submitLabel={saving ? "Saving…" : "Add Item"}
                disabled={saving}
              />
            </DialogContent>
          </Dialog>
        </div>

        {loadError ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {loadError}{" "}
            <button
              type="button"
              className="underline underline-offset-2"
              onClick={() => void refresh()}
            >
              Retry
            </button>
          </div>
        ) : null}

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative max-w-sm flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search menu items…"
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  disabled={loading}
                />
              </div>
              <Select
                value={categoryFilter}
                onValueChange={setCategoryFilter}
                disabled={loading}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {filterOptions.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Spinner className="h-6 w-6" />
            Loading menu…
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {menuRows.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <div className="relative flex aspect-video items-center justify-center bg-muted">
                  {item.raw.image_url ? (
                    <Image
                      src={item.raw.image_url}
                      alt=""
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <Pizza className="h-12 w-12 text-muted-foreground/50" />
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold text-foreground">
                        {item.name}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {item.description || "No description"}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        item.available
                          ? "border-success/20 bg-success/10 text-success"
                          : "bg-muted text-muted-foreground"
                      }
                    >
                      {item.available ? "Available" : "Unavailable"}
                    </Badge>
                  </div>

                  <div className="mt-4 flex flex-col gap-2">
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="secondary" className="text-xs">
                        {item.category.name}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {item.subcategory.name}
                      </Badge>
                    </div>
                    {item.sizes ? (
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        {item.sizes.small != null ? (
                          <>
                            <span className="text-muted-foreground">S:</span>
                            <span className="font-medium">
                              ${item.sizes.small.toFixed(2)}
                            </span>
                          </>
                        ) : null}
                        {item.sizes.medium != null ? (
                          <>
                            <span className="text-muted-foreground">M:</span>
                            <span className="font-medium">
                              ${item.sizes.medium.toFixed(2)}
                            </span>
                          </>
                        ) : null}
                        {item.sizes.large != null ? (
                          <>
                            <span className="text-muted-foreground">L:</span>
                            <span className="font-medium">
                              ${item.sizes.large.toFixed(2)}
                            </span>
                          </>
                        ) : null}
                        {item.sizes.extraLarge != null ? (
                          <>
                            <span className="text-muted-foreground">XL:</span>
                            <span className="font-medium">
                              ${item.sizes.extraLarge.toFixed(2)}
                            </span>
                          </>
                        ) : null}
                      </div>
                    ) : (
                      <p className="text-lg font-bold text-primary">
                        ${item.basePrice.toFixed(2)}
                      </p>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Available
                    </span>
                    <Switch
                      checked={item.available}
                      onCheckedChange={() => void handleToggleAvailability(item)}
                    />
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Dialog
                      open={editingRow?.id === item.id}
                      onOpenChange={(open) => {
                        if (!open) {
                          setEditingRow(null)
                          resetForm()
                          setActionError(null)
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => openEditDialog(item)}
                        >
                          <Pencil className="mr-1 h-4 w-4" />
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Edit Menu Item</DialogTitle>
                          <DialogDescription>
                            Updates via <code>PUT /v1/menu-items/{"{id}"}</code>.
                          </DialogDescription>
                        </DialogHeader>
                        {actionError ? (
                          <p className="text-sm text-destructive" role="alert">
                            {actionError}
                          </p>
                        ) : null}
                        <MenuItemForm
                          categories={categories}
                          formData={formData}
                          setFormData={setFormData}
                          imageFile={uploadFile}
                          setImageFile={setUploadFile}
                          allowFileUpload
                          onSubmit={() => void handleEditItem()}
                          submitLabel={saving ? "Saving…" : "Save Changes"}
                          disabled={saving}
                        />
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(item)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && menuRows.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">
            No menu items match your filters. Try another category or add an
            item.
          </p>
        ) : null}
      </div>
    </DashboardLayout>
  )
}

function MenuItemForm({
  categories,
  formData,
  setFormData,
  imageFile,
  setImageFile,
  allowFileUpload = true,
  onSubmit,
  submitLabel,
  disabled,
}: {
  categories: ApiCategory[]
  formData: MenuFormValues
  setFormData: React.Dispatch<React.SetStateAction<MenuFormValues>>
  imageFile: File | null
  setImageFile: React.Dispatch<React.SetStateAction<File | null>>
  allowFileUpload?: boolean
  onSubmit: () => void
  submitLabel: string
  disabled?: boolean
}) {
  const formInstanceId = useId()
  const fieldId = (name: string) => `${formInstanceId}-${name}`
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)
  const selectedCategory = categories.find(
    (c) => String(c.id) === formData.categoryId,
  )
  const subcategories = selectedCategory?.subcategories ?? []
  const categoryRequiresSizes = selectedCategory?.has_sizes === true
  const showSizePricing =
    categoryRequiresSizes || formData.sizesEnabled

  useEffect(() => {
    if (!imageFile) {
      setPreviewImageUrl(null)
      return
    }
    const objectUrl = URL.createObjectURL(imageFile)
    setPreviewImageUrl(objectUrl)
    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [imageFile])

  const handleCategoryChange = (value: string) => {
    const nextCat = categories.find((c) => String(c.id) === value)
    const firstSub = nextCat?.subcategories?.[0]
    setFormData({
      ...formData,
      categoryId: value,
      subcategoryId: firstSub ? String(firstSub.id) : "none",
      sizesEnabled:
        nextCat?.has_sizes === true ? true : formData.sizesEnabled,
    })
  }

  const handleImageFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImageFile(file)
    e.target.value = ""
  }

  return (
    <FieldGroup className="mt-4 max-h-[60vh] overflow-y-auto pr-2">
      <Field>
        <FieldLabel htmlFor={fieldId("name")}>Name</FieldLabel>
        <Input
          id={fieldId("name")}
          value={formData.name}
          disabled={disabled}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Item name"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field>
          <FieldLabel>Category</FieldLabel>
          <Select
            value={formData.categoryId}
            onValueChange={handleCategoryChange}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={String(cat.id)}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel>Subcategory</FieldLabel>
          <Select
            value={formData.subcategoryId}
            onValueChange={(value) =>
              setFormData({ ...formData, subcategoryId: value })
            }
            disabled={disabled || subcategories.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder="Optional" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {subcategories.map((sub) => (
                <SelectItem key={sub.id} value={String(sub.id)}>
                  {sub.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      {selectedCategory && !categoryRequiresSizes ? (
        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2">
          <div className="space-y-0.5 pr-2">
            <Label htmlFor={fieldId("sizesEnabled")}>Size-based pricing</Label>
            <p className="text-xs text-muted-foreground">
              Enable when this item uses small / medium / large / extra large prices 
              {/* <code className="text-[10px]">sizes</code>), even if the category
              is usually single-price. */}
            </p>
          </div>
          <Switch
            id={fieldId("sizesEnabled")}
            disabled={disabled}
            checked={formData.sizesEnabled}
            onCheckedChange={(checked) =>
              setFormData({
                ...formData,
                sizesEnabled: checked,
                ...(checked
                  ? {}
                  : {
                      price:
                        formData.price.trim() ||
                        formData.mediumPrice ||
                        formData.smallPrice ||
                        formData.largePrice ||
                        formData.extraLargePrice ||
                        "",
                      smallPrice: "",
                      mediumPrice: "",
                      largePrice: "",
                      extraLargePrice: "",
                    }),
              })
            }
          />
        </div>
      ) : null}

      {showSizePricing ? (
        <div className="space-y-3">
          <FieldLabel>Size pricing</FieldLabel>
          <p className="text-xs text-muted-foreground -mt-1">
            Saved as JSON: small, medium (default), large, extra_large — sent in
            multipart field <code className="text-[10px]">sizes</code>.
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Field>
              <FieldLabel
                htmlFor={fieldId("smallPrice")}
                className="text-xs text-muted-foreground"
              >
                Small ($)
              </FieldLabel>
              <Input
                id={fieldId("smallPrice")}
                type="number"
                step="0.01"
                disabled={disabled}
                value={formData.smallPrice}
                onChange={(e) =>
                  setFormData({ ...formData, smallPrice: e.target.value })
                }
                placeholder="0.00"
              />
            </Field>
            <Field>
              <FieldLabel
                htmlFor={fieldId("mediumPrice")}
                className="text-xs text-muted-foreground"
              >
                Medium ($)
              </FieldLabel>
              <Input
                id={fieldId("mediumPrice")}
                type="number"
                step="0.01"
                disabled={disabled}
                value={formData.mediumPrice}
                onChange={(e) =>
                  setFormData({ ...formData, mediumPrice: e.target.value })
                }
                placeholder="0.00"
              />
            </Field>
            <Field>
              <FieldLabel
                htmlFor={fieldId("largePrice")}
                className="text-xs text-muted-foreground"
              >
                Large ($)
              </FieldLabel>
              <Input
                id={fieldId("largePrice")}
                type="number"
                step="0.01"
                disabled={disabled}
                value={formData.largePrice}
                onChange={(e) =>
                  setFormData({ ...formData, largePrice: e.target.value })
                }
                placeholder="0.00"
              />
            </Field>
            <Field>
              <FieldLabel
                htmlFor={fieldId("extraLargePrice")}
                className="text-xs text-muted-foreground"
              >
                Extra large ($)
              </FieldLabel>
              <Input
                id={fieldId("extraLargePrice")}
                type="number"
                step="0.01"
                disabled={disabled}
                value={formData.extraLargePrice}
                onChange={(e) =>
                  setFormData({ ...formData, extraLargePrice: e.target.value })
                }
                placeholder="0.00"
              />
            </Field>
          </div>
        </div>
      ) : (
        <Field>
          <FieldLabel htmlFor={fieldId("price")}>Base price ($)</FieldLabel>
          <Input
            id={fieldId("price")}
            type="number"
            step="0.01"
            disabled={disabled}
            value={formData.price}
            onChange={(e) =>
              setFormData({ ...formData, price: e.target.value })
            }
            placeholder="0.00"
          />
        </Field>
      )}

      <Field>
        <FieldLabel htmlFor={fieldId("description")}>Description</FieldLabel>
        <Input
          id={fieldId("description")}
          disabled={disabled}
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder="Brief description"
        />
      </Field>

      <Field>
        <FieldLabel htmlFor={fieldId("imageUrl")}>Image URL</FieldLabel>
        <Input
          id={fieldId("imageUrl")}
          type="text"
          disabled={disabled}
          value={formData.imageUrl}
          onChange={(e) =>
            setFormData({ ...formData, imageUrl: e.target.value })
          }
          placeholder="https://example.com/pizza.jpg"
        />
      </Field>

      <Field>
        <FieldLabel htmlFor={fieldId("imageFile")}>Upload Image</FieldLabel>
        <Input
          id={fieldId("imageFile")}
          type="file"
          accept="image/*"
          disabled={disabled || !allowFileUpload}
          onChange={(e) => void handleImageFileChange(e)}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          {allowFileUpload
            ? "Optional: choose a file to send as multipart field `image` (replaces image on edit)."
            : ""}
        </p>
        {previewImageUrl ? (
          <div className="mt-2 relative h-28 w-28 overflow-hidden rounded-md border">
            <Image
              src={previewImageUrl}
              alt="Selected upload preview"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        ) : null}
      </Field>

      <div className="flex items-center justify-between py-2">
        <Label htmlFor={fieldId("available")}>Available</Label>
        <Switch
          id={fieldId("available")}
          disabled={disabled}
          checked={formData.available}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, available: checked })
          }
        />
      </div>

      <DialogFooter className="mt-4">
        <Button
          type="button"
          onClick={onSubmit}
          className="w-full"
          disabled={disabled}
        >
          {submitLabel}
        </Button>
      </DialogFooter>
    </FieldGroup>
  )
}
