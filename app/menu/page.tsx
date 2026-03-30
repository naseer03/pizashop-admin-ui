"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Search, Plus, Pencil, Trash2, Pizza } from "lucide-react"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { DialogDescription } from "@/components/ui/dialog"

interface SizePrice {
  small?: number
  medium?: number
  large?: number
}

interface MenuItem {
  id: string
  name: string
  category: string
  subcategory: string
  price: number
  sizes?: SizePrice
  available: boolean
  description: string
}

interface Subcategory {
  value: string
  label: string
}

interface CategoryConfig {
  value: string
  label: string
  subcategories: Subcategory[]
  hasSizes: boolean
}

const categoryConfig: CategoryConfig[] = [
  {
    value: "pizzas",
    label: "Pizzas",
    subcategories: [
      { value: "classic", label: "Classic Pizzas" },
      { value: "specialty", label: "Specialty Pizzas" },
      { value: "gourmet", label: "Gourmet Pizzas" },
    ],
    hasSizes: true,
  },
  {
    value: "sides",
    label: "Sides",
    subcategories: [
      { value: "breadsticks", label: "Bread Sticks" },
      { value: "wings", label: "Wings" },
      { value: "salads", label: "Salads" },
    ],
    hasSizes: false,
  },
  {
    value: "drinks",
    label: "Drinks",
    subcategories: [
      { value: "soft-drinks", label: "Soft Drinks" },
      { value: "juices", label: "Juices" },
      { value: "shakes", label: "Shakes" },
    ],
    hasSizes: true,
  },
  {
    value: "desserts",
    label: "Desserts",
    subcategories: [
      { value: "cakes", label: "Cakes" },
      { value: "ice-cream", label: "Ice Cream" },
      { value: "pastries", label: "Pastries" },
    ],
    hasSizes: false,
  },
]

const initialMenuItems: MenuItem[] = [
  {
    id: "1",
    name: "Margherita Pizza",
    category: "pizzas",
    subcategory: "classic",
    price: 14.99,
    sizes: { small: 10.99, medium: 14.99, large: 18.99 },
    available: true,
    description: "Classic tomato, mozzarella, and fresh basil",
  },
  {
    id: "2",
    name: "Pepperoni Pizza",
    category: "pizzas",
    subcategory: "classic",
    price: 16.99,
    sizes: { small: 12.99, medium: 16.99, large: 20.99 },
    available: true,
    description: "Loaded with premium pepperoni",
  },
  {
    id: "3",
    name: "BBQ Chicken Pizza",
    category: "pizzas",
    subcategory: "specialty",
    price: 18.99,
    sizes: { small: 14.99, medium: 18.99, large: 22.99 },
    available: true,
    description: "Grilled chicken with tangy BBQ sauce",
  },
  {
    id: "4",
    name: "Veggie Supreme",
    category: "pizzas",
    subcategory: "specialty",
    price: 17.99,
    sizes: { small: 13.99, medium: 17.99, large: 21.99 },
    available: false,
    description: "Bell peppers, mushrooms, onions, olives",
  },
  {
    id: "5",
    name: "Truffle Mushroom Pizza",
    category: "pizzas",
    subcategory: "gourmet",
    price: 24.99,
    sizes: { small: 18.99, medium: 24.99, large: 29.99 },
    available: true,
    description: "Wild mushrooms with truffle oil",
  },
  {
    id: "6",
    name: "Garlic Bread",
    category: "sides",
    subcategory: "breadsticks",
    price: 5.99,
    available: true,
    description: "Crispy bread with garlic butter",
  },
  {
    id: "7",
    name: "Chicken Wings",
    category: "sides",
    subcategory: "wings",
    price: 9.99,
    available: true,
    description: "6 pieces with choice of sauce",
  },
  {
    id: "8",
    name: "Caesar Salad",
    category: "sides",
    subcategory: "salads",
    price: 8.99,
    available: true,
    description: "Fresh romaine with caesar dressing",
  },
  {
    id: "9",
    name: "Coca-Cola",
    category: "drinks",
    subcategory: "soft-drinks",
    price: 2.99,
    sizes: { small: 1.99, medium: 2.99, large: 3.99 },
    available: true,
    description: "Refreshing cola",
  },
  {
    id: "10",
    name: "Fresh Lemonade",
    category: "drinks",
    subcategory: "juices",
    price: 4.99,
    sizes: { small: 3.49, medium: 4.99, large: 5.99 },
    available: true,
    description: "Fresh squeezed lemonade",
  },
  {
    id: "11",
    name: "Tiramisu",
    category: "desserts",
    subcategory: "cakes",
    price: 7.99,
    available: true,
    description: "Classic Italian dessert",
  },
  {
    id: "12",
    name: "Chocolate Brownie",
    category: "desserts",
    subcategory: "pastries",
    price: 6.99,
    available: false,
    description: "Warm brownie with vanilla ice cream",
  },
]

const categories = [
  { value: "all", label: "All Categories" },
  ...categoryConfig.map((c) => ({ value: c.value, label: c.label })),
]

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(initialMenuItems)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    category: "pizzas",
    subcategory: "classic",
    price: "",
    smallPrice: "",
    mediumPrice: "",
    largePrice: "",
    description: "",
    available: true,
  })

  const filteredItems = menuItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const handleToggleAvailability = (id: string) => {
    setMenuItems((items) =>
      items.map((item) =>
        item.id === id ? { ...item, available: !item.available } : item
      )
    )
  }

  const handleAddItem = () => {
    const categoryInfo = categoryConfig.find((c) => c.value === formData.category)
    const hasSizes = categoryInfo?.hasSizes ?? false

    const newItem: MenuItem = {
      id: Date.now().toString(),
      name: formData.name,
      category: formData.category,
      subcategory: formData.subcategory,
      price: hasSizes ? parseFloat(formData.mediumPrice) : parseFloat(formData.price),
      sizes: hasSizes
        ? {
            small: parseFloat(formData.smallPrice),
            medium: parseFloat(formData.mediumPrice),
            large: parseFloat(formData.largePrice),
          }
        : undefined,
      description: formData.description,
      available: formData.available,
    }
    setMenuItems([...menuItems, newItem])
    setIsAddDialogOpen(false)
    resetForm()
  }

  const handleEditItem = () => {
    if (!editingItem) return
    const categoryInfo = categoryConfig.find((c) => c.value === formData.category)
    const hasSizes = categoryInfo?.hasSizes ?? false

    setMenuItems((items) =>
      items.map((item) =>
        item.id === editingItem.id
          ? {
              ...item,
              name: formData.name,
              category: formData.category,
              subcategory: formData.subcategory,
              price: hasSizes ? parseFloat(formData.mediumPrice) : parseFloat(formData.price),
              sizes: hasSizes
                ? {
                    small: parseFloat(formData.smallPrice),
                    medium: parseFloat(formData.mediumPrice),
                    large: parseFloat(formData.largePrice),
                  }
                : undefined,
              description: formData.description,
              available: formData.available,
            }
          : item
      )
    )
    setEditingItem(null)
    resetForm()
  }

  const handleDeleteItem = (id: string) => {
    setMenuItems((items) => items.filter((item) => item.id !== id))
  }

  const resetForm = () => {
    setFormData({
      name: "",
      category: "pizzas",
      subcategory: "classic",
      price: "",
      smallPrice: "",
      mediumPrice: "",
      largePrice: "",
      description: "",
      available: true,
    })
  }

  const openEditDialog = (item: MenuItem) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      category: item.category,
      subcategory: item.subcategory,
      price: item.price.toString(),
      smallPrice: item.sizes?.small?.toString() ?? "",
      mediumPrice: item.sizes?.medium?.toString() ?? "",
      largePrice: item.sizes?.large?.toString() ?? "",
      description: item.description,
      available: item.available,
    })
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Menu Management</h1>
            <p className="text-muted-foreground">
              Add, edit, and manage your pizza menu items
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
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add Menu Item</DialogTitle>
                <DialogDescription>
                  Fill in the details to add a new item to your menu.
                </DialogDescription>
              </DialogHeader>
              <MenuItemForm
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleAddItem}
                submitLabel="Add Item"
                categoryConfig={categoryConfig}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search menu items..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
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
            </div>
          </CardContent>
        </Card>

        {/* Menu items grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredItems.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <div className="aspect-video bg-muted flex items-center justify-center">
                <Pizza className="h-12 w-12 text-muted-foreground/50" />
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{item.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {item.description}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      item.available
                        ? "bg-success/10 text-success border-success/20"
                        : "bg-muted text-muted-foreground"
                    }
                  >
                    {item.available ? "Available" : "Unavailable"}
                  </Badge>
                </div>

                <div className="mt-4 flex flex-col gap-2">
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary" className="text-xs">
                      {categoryConfig.find((c) => c.value === item.category)?.label}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {categoryConfig
                        .find((c) => c.value === item.category)
                        ?.subcategories.find((s) => s.value === item.subcategory)?.label}
                    </Badge>
                  </div>
                  {item.sizes ? (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">S:</span>
                      <span className="font-medium">${item.sizes.small?.toFixed(2)}</span>
                      <span className="text-muted-foreground">M:</span>
                      <span className="font-medium">${item.sizes.medium?.toFixed(2)}</span>
                      <span className="text-muted-foreground">L:</span>
                      <span className="font-medium">${item.sizes.large?.toFixed(2)}</span>
                    </div>
                  ) : (
                    <p className="text-lg font-bold text-primary">
                      ${item.price.toFixed(2)}
                    </p>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Available</span>
                  <Switch
                    checked={item.available}
                    onCheckedChange={() => handleToggleAvailability(item.id)}
                  />
                </div>

                <div className="mt-4 flex gap-2">
                  <Dialog
                    open={editingItem?.id === item.id}
                    onOpenChange={(open) => !open && setEditingItem(null)}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openEditDialog(item)}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Edit Menu Item</DialogTitle>
                        <DialogDescription>
                          Update the details for this menu item.
                        </DialogDescription>
                      </DialogHeader>
                      <MenuItemForm
                        formData={formData}
                        setFormData={setFormData}
                        onSubmit={handleEditItem}
                        submitLabel="Save Changes"
                        categoryConfig={categoryConfig}
                      />
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDeleteItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}

function MenuItemForm({
  formData,
  setFormData,
  onSubmit,
  submitLabel,
  categoryConfig,
}: {
  formData: {
    name: string
    category: string
    subcategory: string
    price: string
    smallPrice: string
    mediumPrice: string
    largePrice: string
    description: string
    available: boolean
  }
  setFormData: React.Dispatch<
    React.SetStateAction<{
      name: string
      category: string
      subcategory: string
      price: string
      smallPrice: string
      mediumPrice: string
      largePrice: string
      description: string
      available: boolean
    }>
  >
  onSubmit: () => void
  submitLabel: string
  categoryConfig: CategoryConfig[]
}) {
  const selectedCategory = categoryConfig.find((c) => c.value === formData.category)
  const subcategories = selectedCategory?.subcategories ?? []
  const hasSizes = selectedCategory?.hasSizes ?? false

  const handleCategoryChange = (value: string) => {
    const newCategory = categoryConfig.find((c) => c.value === value)
    setFormData({
      ...formData,
      category: value,
      subcategory: newCategory?.subcategories[0]?.value ?? "",
    })
  }

  return (
    <FieldGroup className="mt-4 max-h-[60vh] overflow-y-auto pr-2">
      <Field>
        <FieldLabel htmlFor="name">Name</FieldLabel>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Item name"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field>
          <FieldLabel htmlFor="category">Category</FieldLabel>
          <Select value={formData.category} onValueChange={handleCategoryChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categoryConfig.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel htmlFor="subcategory">Subcategory</FieldLabel>
          <Select
            value={formData.subcategory}
            onValueChange={(value) => setFormData({ ...formData, subcategory: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select subcategory" />
            </SelectTrigger>
            <SelectContent>
              {subcategories.map((sub) => (
                <SelectItem key={sub.value} value={sub.value}>
                  {sub.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      {hasSizes ? (
        <div className="space-y-3">
          <FieldLabel>Size Pricing</FieldLabel>
          <div className="grid grid-cols-3 gap-3">
            <Field>
              <FieldLabel htmlFor="smallPrice" className="text-xs text-muted-foreground">
                Small ($)
              </FieldLabel>
              <Input
                id="smallPrice"
                type="number"
                step="0.01"
                value={formData.smallPrice}
                onChange={(e) => setFormData({ ...formData, smallPrice: e.target.value })}
                placeholder="0.00"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="mediumPrice" className="text-xs text-muted-foreground">
                Medium ($)
              </FieldLabel>
              <Input
                id="mediumPrice"
                type="number"
                step="0.01"
                value={formData.mediumPrice}
                onChange={(e) => setFormData({ ...formData, mediumPrice: e.target.value })}
                placeholder="0.00"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="largePrice" className="text-xs text-muted-foreground">
                Large ($)
              </FieldLabel>
              <Input
                id="largePrice"
                type="number"
                step="0.01"
                value={formData.largePrice}
                onChange={(e) => setFormData({ ...formData, largePrice: e.target.value })}
                placeholder="0.00"
              />
            </Field>
          </div>
        </div>
      ) : (
        <Field>
          <FieldLabel htmlFor="price">Price ($)</FieldLabel>
          <Input
            id="price"
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            placeholder="0.00"
          />
        </Field>
      )}

      <Field>
        <FieldLabel htmlFor="description">Description</FieldLabel>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Brief description"
        />
      </Field>

      <div className="flex items-center justify-between py-2">
        <Label htmlFor="available">Available</Label>
        <Switch
          id="available"
          checked={formData.available}
          onCheckedChange={(checked) => setFormData({ ...formData, available: checked })}
        />
      </div>

      <DialogFooter className="mt-4">
        <Button onClick={onSubmit} className="w-full">
          {submitLabel}
        </Button>
      </DialogFooter>
    </FieldGroup>
  )
}
