"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
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
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Plus, Pencil, Shield, Trash2, Users } from "lucide-react"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/hooks/use-toast"
import { isUnauthorizedApiError } from "@/lib/api/client"
import {
  apiCreateRole,
  apiDeleteRole,
  apiListPermissions,
  apiListRoles,
  apiUpdateRole,
  apiUpdateRolePermissions,
  type ApiPermission,
  type ApiRole,
} from "@/lib/api/roles"

interface PermissionOption {
  id: number
  name: string
  description: string
}

interface Role {
  id: number
  name: string
  description: string
  permissions: number[]
  userCount: number
}

function toNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v
  if (typeof v === "string" && v.trim().length > 0) {
    const n = Number(v)
    if (Number.isFinite(n)) return n
  }
  return null
}

function mapPermission(p: ApiPermission, idx: number): PermissionOption | null {
  const id = toNumber(p.id) ?? toNumber(p.permission_id)
  if (id == null) return null
  const name =
    (typeof p.name === "string" && p.name.trim()) ||
    (typeof p.code === "string" && p.code.trim()) ||
    `Permission ${id}`
  const description =
    (typeof p.description === "string" && p.description) ||
    (typeof p.code === "string" ? p.code : `Permission #${idx + 1}`)
  return { id, name, description }
}

function mapRole(r: ApiRole): Role | null {
  const id = toNumber(r.id)
  if (id == null) return null

  let permissionIds: number[] = []
  if (Array.isArray(r.permission_ids)) {
    permissionIds = r.permission_ids.map(toNumber).filter((n): n is number => n != null)
  } else if (Array.isArray(r.permissions)) {
    permissionIds = r.permissions
      .map((p) => toNumber(p?.id) ?? toNumber((p as { permission_id?: unknown })?.permission_id))
      .filter((n): n is number => n != null)
  }

  const userCount =
    toNumber(r.user_count) ??
    toNumber(r.users_count) ??
    toNumber(r.employee_count) ??
    toNumber(r.employees_count) ??
    0

  return {
    id,
    name: r.name ?? `Role #${id}`,
    description: r.description ?? "",
    permissions: permissionIds,
    userCount,
  }
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<PermissionOption[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null)
  const [deletePending, setDeletePending] = useState(false)
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    permissions: [] as number[],
  })

  const refresh = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    const [roleRes, permRes] = await Promise.all([apiListRoles(), apiListPermissions()])

    if (!roleRes.ok) {
      if (!isUnauthorizedApiError(roleRes)) setLoadError(roleRes.message)
      setLoading(false)
      return
    }

    if (!permRes.ok) {
      if (!isUnauthorizedApiError(permRes)) setLoadError(permRes.message)
      setLoading(false)
      return
    }

    setRoles(roleRes.data.map(mapRole).filter((r): r is Role => r !== null))
    setPermissions(permRes.data.map(mapPermission).filter((p): p is PermissionOption => p !== null))
    setLoading(false)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const permissionById = useMemo(() => {
    return new Map(permissions.map((p) => [p.id, p]))
  }, [permissions])

  const handleAddRole = async () => {
    const trimmedName = formData.name.trim()
    if (!trimmedName) {
      setActionError("Role name is required.")
      return
    }
    setActionError(null)
    setSaving(true)
    const res = await apiCreateRole({
      name: trimmedName,
      description: formData.description.trim() || null,
      permission_ids: formData.permissions,
    })
    setSaving(false)
    if (!res.ok) {
      if (!isUnauthorizedApiError(res)) setActionError(res.message)
      return
    }
    setIsAddDialogOpen(false)
    resetForm()
    await refresh()
    toast({ title: "Saved", description: "Role was created." })
  }

  const handleEditRole = async () => {
    if (!editingRole) return
    const trimmedName = formData.name.trim()
    if (!trimmedName) {
      setActionError("Role name is required.")
      return
    }
    setActionError(null)
    setSaving(true)
    const roleRes = await apiUpdateRole(editingRole.id, {
      name: trimmedName,
      description: formData.description.trim() || null,
    })
    if (!roleRes.ok) {
      setSaving(false)
      if (!isUnauthorizedApiError(roleRes)) setActionError(roleRes.message)
      return
    }
    const permRes = await apiUpdateRolePermissions(editingRole.id, formData.permissions)
    setSaving(false)
    if (!permRes.ok) {
      if (!isUnauthorizedApiError(permRes)) setActionError(permRes.message)
      return
    }
    setEditingRole(null)
    resetForm()
    await refresh()
    toast({ title: "Saved", description: "Role was updated." })
  }

  const resetForm = () => {
    setActionError(null)
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

  const togglePermission = (permId: number) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter((p) => p !== permId)
        : [...prev.permissions, permId],
    }))
  }

  const handleDeleteRole = async () => {
    if (!deleteTarget) return
    setActionError(null)
    setDeletePending(true)
    const res = await apiDeleteRole(deleteTarget.id)
    setDeletePending(false)
    if (!res.ok) {
      if (!isUnauthorizedApiError(res)) setActionError(res.message)
      return
    }
    setDeleteTarget(null)
    await refresh()
    toast({ title: "Deleted", description: "Role was deleted." })
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
              <AlertDialogTitle>Delete role?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently remove{" "}
                <span className="font-medium">{deleteTarget?.name ?? "this role"}</span>.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deletePending}>Cancel</AlertDialogCancel>
              <Button
                variant="destructive"
                disabled={deletePending}
                onClick={() => void handleDeleteRole()}
              >
                {deletePending ? "Deleting..." : "Delete"}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Page header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Roles & Permissions</h1>
            <p className="text-muted-foreground">
              Manage user roles and their access permissions
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
                Create Role
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[96vw] max-w-4xl max-h-[88vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Role</DialogTitle>
                <DialogDescription>
                  Define a new role with specific permissions.
                </DialogDescription>
              </DialogHeader>
              <RoleForm
                permissions={permissions}
                formData={formData}
                setFormData={setFormData}
                togglePermission={togglePermission}
                onSubmit={handleAddRole}
                submitLabel="Create Role"
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

        {loading ? (
          <Card>
            <CardContent className="flex items-center gap-3 py-10 text-muted-foreground">
              <Spinner className="h-4 w-4" />
              Loading roles and permissions...
            </CardContent>
          </Card>
        ) : (
          <>

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
                  <div className="flex items-center gap-1">
                    <Dialog
                      open={editingRole?.id === role.id}
                      onOpenChange={(open) => {
                        if (!open && !saving) {
                          setEditingRole(null)
                          resetForm()
                        }
                      }}
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
                      <DialogContent className="w-[96vw] max-w-4xl max-h-[88vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Edit Role</DialogTitle>
                          <DialogDescription>
                            Update role name and permissions.
                          </DialogDescription>
                        </DialogHeader>
                        <RoleForm
                          permissions={permissions}
                          formData={formData}
                          setFormData={setFormData}
                          togglePermission={togglePermission}
                          onSubmit={handleEditRole}
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
                      onClick={() => setDeleteTarget(role)}
                      disabled={deletePending || saving}
                      aria-label={`Delete ${role.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
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
                      const perm = permissionById.get(permId)
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
                  {permissions.map((perm) => (
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
          </>
        )}
      </div>
    </DashboardLayout>
  )
}

function RoleForm({
  permissions,
  formData,
  setFormData,
  togglePermission,
  onSubmit,
  submitLabel,
  submitting,
  actionError,
}: {
  permissions: PermissionOption[]
  formData: {
    name: string
    description: string
    permissions: number[]
  }
  setFormData: React.Dispatch<
    React.SetStateAction<{
      name: string
      description: string
      permissions: number[]
    }>
  >
  togglePermission: (permId: number) => void
  onSubmit: () => Promise<void> | void
  submitLabel: string
  submitting: boolean
  actionError: string | null
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {permissions.map((perm) => (
            <div
              key={perm.id}
              className="flex items-start gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
            >
              <Checkbox
                id={`permission-${perm.id}`}
                checked={formData.permissions.includes(perm.id)}
                onCheckedChange={() => togglePermission(perm.id)}
              />
              <div className="flex-1">
                <label
                  htmlFor={`permission-${perm.id}`}
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
      {actionError && <p className="text-sm text-destructive">{actionError}</p>}
      <DialogFooter className="mt-4">
        <Button onClick={onSubmit} className="w-full sm:w-auto" disabled={submitting}>
          {submitting ? "Saving..." : submitLabel}
        </Button>
      </DialogFooter>
    </FieldGroup>
  )
}
