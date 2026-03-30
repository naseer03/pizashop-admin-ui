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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Search, Plus, Pencil, Trash2, Users, UserCheck, UserX } from "lucide-react"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"

interface Employee {
  id: string
  name: string
  email: string
  role: string
  status: "active" | "inactive"
  phone: string
  joinDate: string
}

const initialEmployees: Employee[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john.doe@pizzahub.com",
    role: "admin",
    status: "active",
    phone: "+1 234 567 8901",
    joinDate: "2023-01-15",
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane.smith@pizzahub.com",
    role: "manager",
    status: "active",
    phone: "+1 234 567 8902",
    joinDate: "2023-03-20",
  },
  {
    id: "3",
    name: "Mike Johnson",
    email: "mike.j@pizzahub.com",
    role: "chef",
    status: "active",
    phone: "+1 234 567 8903",
    joinDate: "2023-05-10",
  },
  {
    id: "4",
    name: "Sarah Wilson",
    email: "sarah.w@pizzahub.com",
    role: "cashier",
    status: "active",
    phone: "+1 234 567 8904",
    joinDate: "2023-06-25",
  },
  {
    id: "5",
    name: "Tom Brown",
    email: "tom.b@pizzahub.com",
    role: "chef",
    status: "inactive",
    phone: "+1 234 567 8905",
    joinDate: "2023-04-12",
  },
  {
    id: "6",
    name: "Emily Davis",
    email: "emily.d@pizzahub.com",
    role: "cashier",
    status: "active",
    phone: "+1 234 567 8906",
    joinDate: "2023-08-01",
  },
  {
    id: "7",
    name: "Chris Lee",
    email: "chris.l@pizzahub.com",
    role: "delivery",
    status: "active",
    phone: "+1 234 567 8907",
    joinDate: "2023-09-15",
  },
  {
    id: "8",
    name: "Anna Martinez",
    email: "anna.m@pizzahub.com",
    role: "delivery",
    status: "inactive",
    phone: "+1 234 567 8908",
    joinDate: "2023-07-20",
  },
]

const roles = [
  { value: "admin", label: "Admin", color: "bg-primary/10 text-primary border-primary/20" },
  { value: "manager", label: "Manager", color: "bg-chart-3/10 text-chart-3 border-chart-3/20" },
  { value: "chef", label: "Chef", color: "bg-chart-4/10 text-chart-4 border-chart-4/20" },
  { value: "cashier", label: "Cashier", color: "bg-chart-2/10 text-chart-2 border-chart-2/20" },
  { value: "delivery", label: "Delivery", color: "bg-chart-5/10 text-chart-5 border-chart-5/20" },
]

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees)
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "cashier",
    status: "active" as "active" | "inactive",
    phone: "",
  })

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === "all" || emp.role === roleFilter
    return matchesSearch && matchesRole
  })

  const activeCount = employees.filter((e) => e.status === "active").length
  const inactiveCount = employees.filter((e) => e.status === "inactive").length

  const handleAddEmployee = () => {
    const newEmployee: Employee = {
      id: Date.now().toString(),
      name: formData.name,
      email: formData.email,
      role: formData.role,
      status: formData.status,
      phone: formData.phone,
      joinDate: new Date().toISOString().split("T")[0],
    }
    setEmployees([...employees, newEmployee])
    setIsAddDialogOpen(false)
    resetForm()
  }

  const handleEditEmployee = () => {
    if (!editingEmployee) return
    setEmployees((emps) =>
      emps.map((emp) =>
        emp.id === editingEmployee.id
          ? {
              ...emp,
              name: formData.name,
              email: formData.email,
              role: formData.role,
              status: formData.status,
              phone: formData.phone,
            }
          : emp
      )
    )
    setEditingEmployee(null)
    resetForm()
  }

  const handleDeleteEmployee = (id: string) => {
    setEmployees((emps) => emps.filter((emp) => emp.id !== id))
  }

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      role: "cashier",
      status: "active",
      phone: "",
    })
  }

  const openEditDialog = (emp: Employee) => {
    setEditingEmployee(emp)
    setFormData({
      name: emp.name,
      email: emp.email,
      role: emp.role,
      status: emp.status,
      phone: emp.phone,
    })
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const getRoleStyle = (role: string) => {
    return roles.find((r) => r.value === role)?.color || ""
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Employees</h1>
            <p className="text-muted-foreground">
              Manage your team members and their roles
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={resetForm}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Employee</DialogTitle>
                <DialogDescription>
                  Add a new team member to your staff.
                </DialogDescription>
              </DialogHeader>
              <EmployeeForm
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleAddEmployee}
                submitLabel="Add Employee"
              />
            </DialogContent>
          </Dialog>
        </div>

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
                      <Badge variant="outline" className={getRoleStyle(emp.role)}>
                        {roles.find((r) => r.value === emp.role)?.label}
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
                          onOpenChange={(open) => !open && setEditingEmployee(null)}
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
                          <DialogContent>
                            <DialogHeader>
<DialogTitle>Edit Employee</DialogTitle>
                        <DialogDescription>
                          Update employee information and role.
                        </DialogDescription>
                      </DialogHeader>
                            <EmployeeForm
                              formData={formData}
                              setFormData={setFormData}
                              onSubmit={handleEditEmployee}
                              submitLabel="Save Changes"
                            />
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteEmployee(emp.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

function EmployeeForm({
  formData,
  setFormData,
  onSubmit,
  submitLabel,
}: {
  formData: {
    name: string
    email: string
    role: string
    status: "active" | "inactive"
    phone: string
  }
  setFormData: React.Dispatch<
    React.SetStateAction<{
      name: string
      email: string
      role: string
      status: "active" | "inactive"
      phone: string
    }>
  >
  onSubmit: () => void
  submitLabel: string
}) {
  return (
    <FieldGroup className="mt-4">
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
        <FieldLabel htmlFor="role">Role</FieldLabel>
        <Select
          value={formData.role}
          onValueChange={(value) => setFormData({ ...formData, role: value })}
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
      <DialogFooter className="mt-4">
        <Button onClick={onSubmit} className="w-full">
          {submitLabel}
        </Button>
      </DialogFooter>
    </FieldGroup>
  )
}
