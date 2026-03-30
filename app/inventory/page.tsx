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
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, Plus, Pencil, AlertTriangle, Package } from "lucide-react"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { cn } from "@/lib/utils"

interface InventoryItem {
  id: string
  name: string
  stock: number
  unit: string
  reorderLevel: number
  category: string
  lastRestocked: string
}

const initialInventory: InventoryItem[] = [
  {
    id: "1",
    name: "Mozzarella Cheese",
    stock: 5,
    unit: "kg",
    reorderLevel: 10,
    category: "dairy",
    lastRestocked: "2024-01-15",
  },
  {
    id: "2",
    name: "Pizza Dough",
    stock: 45,
    unit: "pieces",
    reorderLevel: 20,
    category: "dough",
    lastRestocked: "2024-01-18",
  },
  {
    id: "3",
    name: "Tomato Sauce",
    stock: 8,
    unit: "liters",
    reorderLevel: 15,
    category: "sauces",
    lastRestocked: "2024-01-16",
  },
  {
    id: "4",
    name: "Pepperoni",
    stock: 3,
    unit: "kg",
    reorderLevel: 5,
    category: "toppings",
    lastRestocked: "2024-01-14",
  },
  {
    id: "5",
    name: "Fresh Basil",
    stock: 0.5,
    unit: "kg",
    reorderLevel: 1,
    category: "vegetables",
    lastRestocked: "2024-01-17",
  },
  {
    id: "6",
    name: "Olive Oil",
    stock: 12,
    unit: "liters",
    reorderLevel: 5,
    category: "oils",
    lastRestocked: "2024-01-10",
  },
  {
    id: "7",
    name: "Bell Peppers",
    stock: 4,
    unit: "kg",
    reorderLevel: 3,
    category: "vegetables",
    lastRestocked: "2024-01-18",
  },
  {
    id: "8",
    name: "Mushrooms",
    stock: 2.5,
    unit: "kg",
    reorderLevel: 4,
    category: "vegetables",
    lastRestocked: "2024-01-17",
  },
  {
    id: "9",
    name: "Italian Sausage",
    stock: 6,
    unit: "kg",
    reorderLevel: 4,
    category: "toppings",
    lastRestocked: "2024-01-15",
  },
  {
    id: "10",
    name: "Parmesan Cheese",
    stock: 3,
    unit: "kg",
    reorderLevel: 2,
    category: "dairy",
    lastRestocked: "2024-01-16",
  },
]

const categories = [
  { value: "all", label: "All Categories" },
  { value: "dairy", label: "Dairy" },
  { value: "dough", label: "Dough" },
  { value: "sauces", label: "Sauces" },
  { value: "toppings", label: "Toppings" },
  { value: "vegetables", label: "Vegetables" },
  { value: "oils", label: "Oils" },
]

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [showLowStock, setShowLowStock] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    stock: "",
    unit: "kg",
    reorderLevel: "",
    category: "toppings",
  })

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter
    const matchesLowStock = !showLowStock || item.stock <= item.reorderLevel
    return matchesSearch && matchesCategory && matchesLowStock
  })

  const lowStockCount = inventory.filter((item) => item.stock <= item.reorderLevel).length

  const handleAddItem = () => {
    const newItem: InventoryItem = {
      id: Date.now().toString(),
      name: formData.name,
      stock: parseFloat(formData.stock),
      unit: formData.unit,
      reorderLevel: parseFloat(formData.reorderLevel),
      category: formData.category,
      lastRestocked: new Date().toISOString().split("T")[0],
    }
    setInventory([...inventory, newItem])
    setIsAddDialogOpen(false)
    resetForm()
  }

  const handleEditItem = () => {
    if (!editingItem) return
    setInventory((items) =>
      items.map((item) =>
        item.id === editingItem.id
          ? {
              ...item,
              name: formData.name,
              stock: parseFloat(formData.stock),
              unit: formData.unit,
              reorderLevel: parseFloat(formData.reorderLevel),
              category: formData.category,
            }
          : item
      )
    )
    setEditingItem(null)
    resetForm()
  }

  const resetForm = () => {
    setFormData({
      name: "",
      stock: "",
      unit: "kg",
      reorderLevel: "",
      category: "toppings",
    })
  }

  const openEditDialog = (item: InventoryItem) => {
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
        {/* Page header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Inventory</h1>
            <p className="text-muted-foreground">
              Track and manage your ingredient stock levels
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
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
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleAddItem}
                submitLabel="Add Item"
              />
            </DialogContent>
          </Dialog>
        </div>

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
                              formData={formData}
                              setFormData={setFormData}
                              onSubmit={handleEditItem}
                              submitLabel="Save Changes"
                            />
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

function InventoryForm({
  formData,
  setFormData,
  onSubmit,
  submitLabel,
}: {
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
  onSubmit: () => void
  submitLabel: string
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
              <SelectItem value="kg">Kilograms (kg)</SelectItem>
              <SelectItem value="liters">Liters</SelectItem>
              <SelectItem value="pieces">Pieces</SelectItem>
              <SelectItem value="boxes">Boxes</SelectItem>
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
            <SelectItem value="dairy">Dairy</SelectItem>
            <SelectItem value="dough">Dough</SelectItem>
            <SelectItem value="sauces">Sauces</SelectItem>
            <SelectItem value="toppings">Toppings</SelectItem>
            <SelectItem value="vegetables">Vegetables</SelectItem>
            <SelectItem value="oils">Oils</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <DialogFooter className="mt-4">
        <Button onClick={onSubmit} className="w-full">
          {submitLabel}
        </Button>
      </DialogFooter>
    </FieldGroup>
  )
}
