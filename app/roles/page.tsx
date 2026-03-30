"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Plus, Pencil, Shield, Users } from "lucide-react"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"

interface Permission {
  id: string
  name: string
  description: string
}

interface Role {
  id: string
  name: string
  description: string
  permissions: string[]
  userCount: number
}

const allPermissions: Permission[] = [
  { id: "create_order", name: "Create Order", description: "Create new customer orders" },
  { id: "manage_orders", name: "Manage Orders", description: "Update and manage order status" },
  { id: "manage_menu", name: "Manage Menu", description: "Add, edit, and delete menu items" },
  { id: "view_reports", name: "View Reports", description: "Access sales and analytics reports" },
  { id: "manage_users", name: "Manage Users", description: "Add and manage employee accounts" },
  { id: "inventory_control", name: "Inventory Control", description: "Manage stock and inventory" },
  { id: "manage_roles", name: "Manage Roles", description: "Create and modify user roles" },
  { id: "view_customers", name: "View Customers", description: "Access customer information" },
  { id: "process_payments", name: "Process Payments", description: "Handle payment transactions" },
  { id: "system_settings", name: "System Settings", description: "Configure system settings" },
]

const initialRoles: Role[] = [
  {
    id: "1",
    name: "Admin",
    description: "Full system access with all permissions",
    permissions: allPermissions.map((p) => p.id),
    userCount: 2,
  },
  {
    id: "2",
    name: "Manager",
    description: "Manage operations and staff",
    permissions: [
      "create_order",
      "manage_orders",
      "manage_menu",
      "view_reports",
      "inventory_control",
      "view_customers",
      "process_payments",
    ],
    userCount: 3,
  },
  {
    id: "3",
    name: "Cashier",
    description: "Handle orders and payments",
    permissions: ["create_order", "manage_orders", "view_customers", "process_payments"],
    userCount: 5,
  },
  {
    id: "4",
    name: "Chef",
    description: "Kitchen operations and inventory",
    permissions: ["manage_orders", "inventory_control"],
    userCount: 4,
  },
  {
    id: "5",
    name: "Delivery",
    description: "Delivery order management",
    permissions: ["manage_orders", "view_customers"],
    userCount: 6,
  },
]

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>(initialRoles)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    permissions: [] as string[],
  })

  const handleAddRole = () => {
    const newRole: Role = {
      id: Date.now().toString(),
      name: formData.name,
      description: formData.description,
      permissions: formData.permissions,
      userCount: 0,
    }
    setRoles([...roles, newRole])
    setIsAddDialogOpen(false)
    resetForm()
  }

  const handleEditRole = () => {
    if (!editingRole) return
    setRoles((r) =>
      r.map((role) =>
        role.id === editingRole.id
          ? {
              ...role,
              name: formData.name,
              description: formData.description,
              permissions: formData.permissions,
            }
          : role
      )
    )
    setEditingRole(null)
    resetForm()
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      permissions: [],
    })
  }

  const openEditDialog = (role: Role) => {
    setEditingRole(role)
    setFormData({
      name: role.name,
      description: role.description,
      permissions: [...role.permissions],
    })
  }

  const togglePermission = (permId: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter((p) => p !== permId)
        : [...prev.permissions, permId],
    }))
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Roles & Permissions</h1>
            <p className="text-muted-foreground">
              Manage user roles and their access permissions
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={resetForm}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Role
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Role</DialogTitle>
                <DialogDescription>
                  Define a new role with specific permissions.
                </DialogDescription>
              </DialogHeader>
              <RoleForm
                formData={formData}
                setFormData={setFormData}
                togglePermission={togglePermission}
                onSubmit={handleAddRole}
                submitLabel="Create Role"
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Roles grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {roles.map((role) => (
            <Card key={role.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{role.name}</CardTitle>
                      <CardDescription className="mt-1">{role.description}</CardDescription>
                    </div>
                  </div>
                  <Dialog
                    open={editingRole?.id === role.id}
                    onOpenChange={(open) => !open && setEditingRole(null)}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEditDialog(role)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Edit Role</DialogTitle>
                        <DialogDescription>
                          Update role name and permissions.
                        </DialogDescription>
                      </DialogHeader>
                      <RoleForm
                        formData={formData}
                        setFormData={setFormData}
                        togglePermission={togglePermission}
                        onSubmit={handleEditRole}
                        submitLabel="Save Changes"
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <Users className="h-4 w-4" />
                  <span>{role.userCount} users</span>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Permissions</p>
                  <div className="flex flex-wrap gap-1.5">
                    {role.permissions.slice(0, 4).map((permId) => {
                      const perm = allPermissions.find((p) => p.id === permId)
                      return (
                        <Badge
                          key={permId}
                          variant="secondary"
                          className="text-xs"
                        >
                          {perm?.name}
                        </Badge>
                      )
                    })}
                    {role.permissions.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{role.permissions.length - 4} more
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Permissions Matrix */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Permission Matrix</CardTitle>
            <CardDescription>
              Overview of all permissions assigned to each role
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 pr-4 font-medium text-muted-foreground">
                      Permission
                    </th>
                    {roles.map((role) => (
                      <th
                        key={role.id}
                        className="text-center py-3 px-2 font-medium text-muted-foreground min-w-[80px]"
                      >
                        {role.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allPermissions.map((perm) => (
                    <tr key={perm.id} className="border-b last:border-0">
                      <td className="py-3 pr-4">
                        <div>
                          <p className="font-medium text-foreground">{perm.name}</p>
                          <p className="text-xs text-muted-foreground">{perm.description}</p>
                        </div>
                      </td>
                      {roles.map((role) => (
                        <td key={role.id} className="text-center py-3 px-2">
                          {role.permissions.includes(perm.id) ? (
                            <div className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-success/20">
                              <div className="h-2 w-2 rounded-full bg-success" />
                            </div>
                          ) : (
                            <div className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted">
                              <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

function RoleForm({
  formData,
  setFormData,
  togglePermission,
  onSubmit,
  submitLabel,
}: {
  formData: {
    name: string
    description: string
    permissions: string[]
  }
  setFormData: React.Dispatch<
    React.SetStateAction<{
      name: string
      description: string
      permissions: string[]
    }>
  >
  togglePermission: (permId: string) => void
  onSubmit: () => void
  submitLabel: string
}) {
  return (
    <FieldGroup className="mt-4">
      <Field>
        <FieldLabel htmlFor="name">Role Name</FieldLabel>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Supervisor"
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="description">Description</FieldLabel>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Brief description of this role"
        />
      </Field>
      <div>
        <FieldLabel className="mb-3">Permissions</FieldLabel>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {allPermissions.map((perm) => (
            <div
              key={perm.id}
              className="flex items-start gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
            >
              <Checkbox
                id={perm.id}
                checked={formData.permissions.includes(perm.id)}
                onCheckedChange={() => togglePermission(perm.id)}
              />
              <div className="flex-1">
                <label
                  htmlFor={perm.id}
                  className="text-sm font-medium cursor-pointer"
                >
                  {perm.name}
                </label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {perm.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <DialogFooter className="mt-4">
        <Button onClick={onSubmit} className="w-full sm:w-auto">
          {submitLabel}
        </Button>
      </DialogFooter>
    </FieldGroup>
  )
}
