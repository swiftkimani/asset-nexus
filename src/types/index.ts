export interface User {
  id: number
  name: string
  email: string
  password_hash: string
  role: string
  created_at: string
}

export interface Employee {
  id: number
  employee_id: string
  name: string
  email: string
  phone: string | null
  designation: string | null
  department: string | null
  reporting_person: string | null
  office_location: string | null
  joining_date: string | null
  employment_status: string
  notes: string | null
  is_deleted: number
  created_at: string
  updated_at: string
}

export interface AssetCategory {
  id: number
  name: string
  description: string | null
  created_at: string
}

export interface Asset {
  id: number
  asset_id: string
  asset_unique_id: string
  asset_name: string
  category_id: number | null
  brand: string | null
  model: string | null
  serial_number: string | null
  purchase_date: string | null
  purchase_cost: number | null
  vendor: string | null
  warranty_expiry: string | null
  asset_location: string | null
  status: string
  is_deleted: number
  created_at: string
  updated_at: string
}

export interface AssetAssignment {
  id: number
  assignment_id: string
  asset_id: number
  employee_id: number
  assigned_date: string
  returned_date: string | null
  assignment_status: string
  notes: string | null
  created_at: string
}

export interface AssignmentOut {
  id: number
  assignment_id: string
  asset_id: number
  employee_id: number
  assigned_date: string
  returned_date: string | null
  assignment_status: string
  notes: string | null
  asset_name: string | null
  asset_unique_id: string | null
  employee_name: string | null
  employee_code: string | null
}

export interface AssetOut {
  id: number
  asset_id: string
  asset_unique_id: string
  asset_name: string
  category: string | null
  brand: string | null
  model: string | null
  serial_number: string | null
  purchase_date: string | null
  purchase_cost: number | null
  vendor: string | null
  warranty_expiry: string | null
  asset_location: string | null
  status: string
  created_at: string
  updated_at: string
}

export interface DashboardStats {
  total_employees: number
  total_assets: number
  assigned_assets: number
  available_assets: number
  under_repair_assets: number
}

export interface RecentAssignment {
  assignment_id: string
  asset_name: string | null
  asset_unique_id: string | null
  employee_name: string | null
  assigned_date: string
  status: string
}

export interface UserOut {
  id: number
  name: string
  email: string
  role: string
  created_at: string
}
