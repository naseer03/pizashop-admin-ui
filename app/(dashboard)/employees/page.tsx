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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Search, Plus, Pencil, Trash2, Users, UserCheck, UserX } from "lucide-react"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/hooks/use-toast"
import { isUnauthorizedApiError } from "@/lib/api/client"
import {
  apiCreateEmployee,
  apiDeactivateEmployee,
  apiPermanentDeleteEmployee,
  apiListEmployees,
  apiPatchEmployeeStatus,
  apiUpdateEmployee,
  type ApiEmployee,
} from "@/lib/api/employees"
import { apiListRoles, type ApiRole } from "@/lib/api/roles"

interface Employee {
  id: number
  name: string
  email: string
  roleId: number
  roleName: string
  status: "active" | "inactive"
  phone: string
  joinDate: string
  hourlyRate: number
  dateOfBirth: string
  address: string
  emergencyContactName: string
  emergencyContactPhone: string
  schedule: Array<Record<string, unknown>>
}

interface RoleOption {
  value: string
  id: number
  label: string
  color: string
}

const ROLE_COLORS = [
  "bg-primary/10 text-primary border-primary/20",
  "bg-chart-2/10 text-chart-2 border-chart-2/20",
  "bg-chart-3/10 text-chart-3 border-chart-3/20",
  "bg-chart-4/10 text-chart-4 border-chart-4/20",
  "bg-chart-5/10 text-chart-5 border-chart-5/20",
]

function toNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v
  if (typeof v === "string" && v.trim().length > 0) {
    const n = Number(v)
    if (Number.isFinite(n)) return n
  }
  return null
}

function splitName(fullName: string): { first: string; last: string } {
  const name = fullName.trim().replace(/\s+/g, " ")
  if (!name) return { first: "", last: "" }
  const parts = name.split(" ")
  if (parts.length === 1) return { first: parts[0], last: "-" }
  return { first: parts[0], last: parts.slice(1).join(" ") }
}

function mapRoleOption(role: ApiRole, idx: number): RoleOption | null {
  const id = toNumber(role.id)
  if (id == null) return null
  return {
    id,
    value: String(id),
    label: role.name?.trim() || `Role ${id}`,
    color: ROLE_COLORS[idx % ROLE_COLORS.length],
  }
}

function mapEmployee(e: ApiEmployee, roleById: Map<number, RoleOption>): Employee | null {
  const id = toNumber(e.id)
  if (id == null) return null
  const roleId = toNumber(e.role_id) ?? toNumber(e.role?.id) ?? 0
  const first = e.first_name?.trim() ?? ""
  const last = e.last_name?.trim() ?? ""
  const name = (e.name?.trim() || `${first} ${last}`.trim() || `Employee #${id}`).trim()
  const roleName = roleById.get(roleId)?.label || e.role?.name?.trim() || "Unknown"
  const rawStatus = e.status?.toLowerCase() ?? "active"
  const status: "active" | "inactive" = rawStatus === "inactive" ? "inactive" : "active"
  const joinDateRaw = (e.hire_date || e.created_at || "").slice(0, 10)
  const dateOfBirthRaw = (e.date_of_birth || "").slice(0, 10)
  return {
    id,
    name,
    email: e.email?.trim() || "",
    roleId,
    roleName,
    status,
    phone: e.phone?.trim() || "",
    joinDate: joinDateRaw || new Date().toISOString().split("T")[0],
    hourlyRate: toNumber(e.hourly_rate) ?? 0,
    dateOfBirth: dateOfBirthRaw,
    address: e.address?.trim() || "",
    emergencyContactName: e.emergency_contact_name?.trim() || "",
    emergencyContactPhone: e.emergency_contact_phone?.trim() || "",
    schedule: Array.isArray(e.schedule) ? e.schedule : [],
  }
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [roles, setRoles] = useState<RoleOption[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null)
  const [deletePending, setDeletePending] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    roleId: "",
    status: "active" as "active" | "inactive",
    phone: "",
    hourlyRate: "0",
    hireDate: new Date().toISOString().slice(0, 10),
    dateOfBirth: "",
    address: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    password: "",
  })

  const roleById = useMemo(() => {
    return new Map(roles.map((r) => [r.id, r]))
  }, [roles])

  const refresh = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    const [roleRes, empRes] = await Promise.all([
      apiListRoles(),
      apiListEmployees({ per_page: 100 }),
    ])

    if (!roleRes.ok) {
      if (!isUnauthorizedApiError(roleRes)) setLoadError(roleRes.message)
      setLoading(false)
      return
    }
    if (!empRes.ok) {
      if (!isUnauthorizedApiError(empRes)) setLoadError(empRes.message)
      setLoading(false)
      return
    }

    const mappedRoles = roleRes.data.map(mapRoleOption).filter((r): r is RoleOption => r !== null)
    const roleMap = new Map(mappedRoles.map((r) => [r.id, r]))
    const mappedEmployees = empRes.data
      .map((e) => mapEmployee(e, roleMap))
      .filter((e): e is Employee => e !== null)

    setRoles(mappedRoles)
    setEmployees(mappedEmployees)
    setLoading(false)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === "all" || String(emp.roleId) === roleFilter
    return matchesSearch && matchesRole
  })

  const activeCount = employees.filter((e) => e.status === "active").length
  const inactiveCount = employees.filter((e) => e.status === "inactive").length

  const handleAddEmployee = async () => {
    const trimmedName = formData.name.trim()
    const trimmedEmail = formData.email.trim()
    const roleId = Number(formData.roleId)
    const hourlyRate = Number(formData.hourlyRate || "0")
    if (!trimmedName || !trimmedEmail || !Number.isFinite(roleId) || roleId <= 0) {
      setActionError("Name, email and role are required.")
      return
    }
    if (!Number.isFinite(hourlyRate) || hourlyRate < 0) {
      setActionError("Hourly rate must be a valid positive number.")
      return
    }
    setActionError(null)
    setSaving(true)
    const { first, last } = splitName(trimmedName)
    const res = await apiCreateEmployee({
      first_name: first,
      last_name: last,
      email: trimmedEmail,
      phone: formData.phone.trim() || null,
      role_id: roleId,
      hourly_rate: hourlyRate,
      hire_date: formData.hireDate || new Date().toISOString().slice(0, 10),
      date_of_birth: formData.dateOfBirth || new Date().toISOString().slice(0, 10),
      address: formData.address.trim(),
      emergency_contact_name: formData.emergencyContactName.trim(),
      emergency_contact_phone: formData.emergencyContactPhone.trim(),
      schedule: [],
      password: formData.password.trim(),
    })
    if (!res.ok) {
      setSaving(false)
      if (!isUnauthorizedApiError(res)) setActionError(res.message)
      return
    }
    if (formData.status === "inactive") {
      const list = await apiListEmployees({ per_page: 1, search: trimmedEmail })
      if (list.ok) {
        const created = list.data
          .map((e) => mapEmployee(e, roleById))
          .find((e): e is Employee => e !== null && e.email.toLowerCase() === trimmedEmail.toLowerCase())
        if (created) await apiPatchEmployeeStatus(created.id, "inactive")
      }
    }
    setSaving(false)
    setIsAddDialogOpen(false)
    resetForm()
    await refresh()
    toast({ title: "Saved", description: "Employee was created." })
  }

  const handleEditEmployee = async () => {
    if (!editingEmployee) return
    const trimmedName = formData.name.trim()
    const trimmedEmail = formData.email.trim()
    const roleId = Number(formData.roleId)
    const hourlyRate = Number(formData.hourlyRate || "0")
    if (!trimmedName || !trimmedEmail || !Number.isFinite(roleId) || roleId <= 0) {
      setActionError("Name, email and role are required.")
      return
    }
    if (!Number.isFinite(hourlyRate) || hourlyRate < 0) {
      setActionError("Hourly rate must be a valid positive number.")
      return
    }
    setActionError(null)
    setSaving(true)
    const { first, last } = splitName(trimmedName)
    const updatePayload: Parameters<typeof apiUpdateEmployee>[1] = {
      first_name: first,
      last_name: last,
      email: trimmedEmail,
      phone: formData.phone.trim() || null,
      role_id: roleId,
      hourly_rate: hourlyRate,
      hire_date: formData.hireDate || editingEmployee.joinDate,
      date_of_birth: formData.dateOfBirth || editingEmployee.dateOfBirth || "",
      address: formData.address.trim() || editingEmployee.address,
      emergency_contact_name:
        formData.emergencyContactName.trim() || editingEmployee.emergencyContactName,
      emergency_contact_phone:
        formData.emergencyContactPhone.trim() || editingEmployee.emergencyContactPhone,
      schedule: editingEmployee.schedule,
    }
    const nextPassword = formData.password.trim()
    if (nextPassword) updatePayload.password = nextPassword

    const res = await apiUpdateEmployee(editingEmployee.id, updatePayload)
    if (!res.ok) {
      setSaving(false)
      if (!isUnauthorizedApiError(res)) setActionError(res.message)
      return
    }
    const statusRes = await apiPatchEmployeeStatus(editingEmployee.id, formData.status)
    setSaving(false)
    if (!statusRes.ok) {
      if (!isUnauthorizedApiError(statusRes)) setActionError(statusRes.message)
      return
    }
    setEditingEmployee(null)
    resetForm()
    await refresh()
    toast({ title: "Saved", description: "Employee was updated." })
  }

  const handleDeleteEmployee = async (mode: "deactivate" | "permanent") => {
    if (!deleteTarget) return
    const empName = deleteTarget.name
    const targetId = deleteTarget.id
    setDeletePending(true)
    setActionError(null)
    const res =
      mode === "deactivate"
        ? await apiDeactivateEmployee(targetId)
        : await apiPermanentDeleteEmployee(targetId)
    setDeletePending(false)
    if (!res.ok) {
      if (!isUnauthorizedApiError(res)) {
        setActionError(res.message || "Request failed.")
      }
      return
    }
    setDeleteTarget(null)
    await refresh()
    toast({
      title: mode === "deactivate" ? "Deactivated" : "Deleted",
      description:
        mode === "deactivate"
          ? `${empName} was deactivated.`
          : `${empName} was permanently removed.`,
    })
  }

  const resetForm = () => {
    setActionError(null)
    setFormData({
      name: "",
      email: "",
      roleId: roles[0] ? String(roles[0].id) : "",
      status: "active",
      phone: "",
      hourlyRate: "0",
      hireDate: new Date().toISOString().slice(0, 10),
      dateOfBirth: "",
      address: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      password: "",
    })
  }

  const openEditDialog = (emp: Employee) => {
    setActionError(null)
    setEditingEmployee(emp)
    setFormData({
      name: emp.name,
      email: emp.email,
      roleId: String(emp.roleId),
      status: emp.status,
      phone: emp.phone,
      hourlyRate: String(emp.hourlyRate),
      hireDate: emp.joinDate,
      dateOfBirth: emp.dateOfBirth,
      address: emp.address,
      emergencyContactName: emp.emergencyContactName,
      emergencyContactPhone: emp.emergencyContactPhone,
      password: "",
    })
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  useEffect(() => {
    if (roles.length && !formData.roleId) {
      setFormData((f) => ({ ...f, roleId: String(roles[0].id) }))
    }
  }, [roles, formData.roleId])

  const getRoleStyle = (roleId: number) => {
    return roleById.get(roleId)?.color || ""
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
              <AlertDialogTitle>Deactivate or delete employee?</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    <span className="font-medium text-foreground">
                      {deleteTarget?.name ?? "Employee"}
                    </span>
                  </p>
                  {/* <p> */}
                    {/* <strong className="text-foreground">Deactivate</strong> calls{" "}
                    <code className="rounded bg-muted px-1 text-xs">
                      DELETE /v1/employees/{"{id}"}
                    </code> */}
                    {/* . The record is deactivated (may still appear as inactive).
                  </p>
                  <p> */}
                    {/* <strong className="text-foreground">Delete permanently</strong> calls{" "}
                    <code className="rounded bg-muted px-1 text-xs">
                      DELETE /v1/employees/{"{id}"}/permanent
                    </code>
                    . This cannot be undone.
                  </p> */}
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
              <AlertDialogCancel disabled={deletePending} className="mt-0">
                Cancel
              </AlertDialogCancel>
              <Button
                variant="secondary"
                disabled={deletePending}
                onClick={() => void handleDeleteEmployee("deactivate")}
              >
                {deletePending ? "Working…" : "Deactivate"}
              </Button>
              <Button
                variant="destructive"
                disabled={deletePending}
                onClick={() => void handleDeleteEmployee("permanent")}
              >
                {deletePending ? "Working…" : "Delete permanently"}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Page header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Employees</h1>
            <p className="text-muted-foreground">
              Manage your team members and their roles
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
                Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Employee</DialogTitle>
                <DialogDescription>
                  Add a new team member to your staff.
                </DialogDescription>
              </DialogHeader>
              <EmployeeForm
                roles={roles}
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleAddEmployee}
                submitLabel="Add Employee"
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
        {actionError && !isAddDialogOpen && !editingEmployee && (
          <Card className="border-destructive/40">
            <CardContent className="pt-6 text-sm text-destructive">{actionError}</CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="rounded-lg bg-primary/10 p-3">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Employees</p>
                <p className="text-2xl font-bold">{employees.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="rounded-lg bg-success/10 p-3">
                <UserCheck className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{activeCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="rounded-lg bg-muted p-3">
                <UserX className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Inactive</p>
                <p className="text-2xl font-bold">{inactiveCount}</p>
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
                  placeholder="Search employees..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {roles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Employees table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              All Employees ({filteredEmployees.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-3 py-8 text-muted-foreground">
                <Spinner className="h-4 w-4" />
                Loading employees...
              </div>
            ) : filteredEmployees.length === 0 ? (
              <div className="py-8 text-sm text-muted-foreground">No employees found.</div>
            ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {getInitials(emp.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{emp.name}</p>
                          <p className="text-xs text-muted-foreground md:hidden">
                            {emp.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{emp.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getRoleStyle(emp.roleId)}>
                        {emp.roleName}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          emp.status === "active"
                            ? "bg-success/10 text-success border-success/20"
                            : "bg-muted text-muted-foreground"
                        }
                      >
                        {emp.status.charAt(0).toUpperCase() + emp.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Dialog
                          open={editingEmployee?.id === emp.id}
                          onOpenChange={(open) => {
                            if (!open && !saving) {
                              setEditingEmployee(null)
                              resetForm()
                            }
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditDialog(emp)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-2xl">
                            <DialogHeader>
<DialogTitle>Edit Employee</DialogTitle>
                        <DialogDescription>
                          Update employee information and role.
                        </DialogDescription>
                      </DialogHeader>
                            <EmployeeForm
                              roles={roles}
                              formData={formData}
                              setFormData={setFormData}
                              onSubmit={handleEditEmployee}
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
                          onClick={() => setDeleteTarget(emp)}
                          disabled={deletePending || saving}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

function EmployeeForm({
  roles,
  formData,
  setFormData,
  onSubmit,
  submitLabel,
  submitting,
  actionError,
}: {
  roles: RoleOption[]
  formData: {
    name: string
    email: string
    roleId: string
    status: "active" | "inactive"
    phone: string
    hourlyRate: string
    hireDate: string
    dateOfBirth: string
    address: string
    emergencyContactName: string
    emergencyContactPhone: string
    password: string
  }
  setFormData: React.Dispatch<
    React.SetStateAction<{
      name: string
      email: string
      roleId: string
      status: "active" | "inactive"
      phone: string
      hourlyRate: string
      hireDate: string
      dateOfBirth: string
      address: string
      emergencyContactName: string
      emergencyContactPhone: string
      password: string
    }>
  >
  onSubmit: () => Promise<void> | void
  submitLabel: string
  submitting: boolean
  actionError: string | null
}) {
  return (
    <FieldGroup className="mt-4 grid gap-4 md:grid-cols-2">
      <Field>
        <FieldLabel htmlFor="name">Full Name</FieldLabel>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="John Doe"
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="email">Email</FieldLabel>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="john@pizzahub.com"
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="phone">Phone</FieldLabel>
        <Input
          id="phone"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder="+1 234 567 8901"
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="hourlyRate">Hourly Rate</FieldLabel>
        <Input
          id="hourlyRate"
          type="number"
          min="0"
          step="0.01"
          value={formData.hourlyRate}
          onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
          placeholder="0"
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="hireDate">Hire Date</FieldLabel>
        <Input
          id="hireDate"
          type="date"
          value={formData.hireDate}
          onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="dateOfBirth">Date of Birth</FieldLabel>
        <Input
          id="dateOfBirth"
          type="date"
          value={formData.dateOfBirth}
          onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="address">Address</FieldLabel>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="Street, city, state"
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="emergencyContactName">Emergency Contact Name</FieldLabel>
        <Input
          id="emergencyContactName"
          value={formData.emergencyContactName}
          onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
          placeholder="Contact person"
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="emergencyContactPhone">Emergency Contact Phone</FieldLabel>
        <Input
          id="emergencyContactPhone"
          value={formData.emergencyContactPhone}
          onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
          placeholder="+1 234 567 8901"
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="password">Password</FieldLabel>
        <Input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          placeholder="Set employee login password"
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="role">Role</FieldLabel>
        <Select
          value={formData.roleId}
          onValueChange={(value) => setFormData({ ...formData, roleId: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {roles.map((role) => (
              <SelectItem key={role.value} value={role.value}>
                {role.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field>
        <FieldLabel htmlFor="status">Status</FieldLabel>
        <Select
          value={formData.status}
          onValueChange={(value: "active" | "inactive") =>
            setFormData({ ...formData, status: value })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      {actionError && <p className="text-sm text-destructive md:col-span-2">{actionError}</p>}
      <DialogFooter className="mt-4 md:col-span-2">
        <Button onClick={onSubmit} className="w-full" disabled={submitting}>
          {submitting ? "Saving..." : submitLabel}
        </Button>
      </DialogFooter>
    </FieldGroup>
  )
}
