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
  condition: string
  accumulated_maintenance_cost: number | null
  depreciation_method: string | null
  useful_life_years: number | null
  salvage_value: number | null
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
  condition: string
  accumulated_maintenance_cost: number | null
  depreciation_method: string | null
  useful_life_years: number | null
  salvage_value: number | null
  created_at: string
  updated_at: string
}

export interface DashboardStats {
  total_employees: number
  total_assets: number
  assigned_assets: number
  available_assets: number
  under_repair_assets: number
  assets_by_category: { name: string; count: number }[]
  assets_by_status: { status: string; count: number }[]
  assignments_by_month: { month: string; count: number }[]
  department_assets: { department: string; count: number }[]
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

export interface DisposalLog {
  id: number
  asset_id: number
  disposal_date: string
  disposal_method: string
  authorized_by: string | null
  reason: string | null
  notes: string | null
  created_at: string
}

export interface WarrantyClaim {
  id: number
  asset_id: number
  claim_number: string | null
  rma_number: string | null
  vendor_contact: string | null
  claim_date: string
  issue_description: string | null
  status: string
  resolution: string | null
  resolved_date: string | null
  notes: string | null
  created_at: string
}

export interface ServiceLog {
  id: number
  asset_id: number
  reported_date: string
  issue_description: string
  vendor: string | null
  cost: number | null
  resolution: string | null
  resolved_date: string | null
  downtime_days: number | null
  service_notes: string | null
  created_at: string
}

export interface MaintenanceSchedule {
  id: number
  asset_id: number
  schedule_name: string
  frequency_days: number
  last_done_date: string | null
  next_due_date: string
  assigned_to: string | null
  notes: string | null
  is_active: number
  created_at: string
}

export interface PurchaseOrder {
  id: number
  po_number: string
  vendor: string
  order_date: string
  total_amount: number | null
  status: string
  approved_by: string | null
  notes: string | null
  created_at: string
}

export interface Vendor {
  id: number
  name: string
  contact_person: string | null
  email: string | null
  phone: string | null
  address: string | null
  rating: number | null
  notes: string | null
  is_active: number
  created_at: string
}

export interface AssetRequest {
  id: number
  requester_name: string
  requester_email: string
  asset_name: string
  category: string | null
  justification: string | null
  status: string
  reviewed_by: string | null
  review_notes: string | null
  created_at: string
  updated_at: string
}

export interface Notification {
  id: number
  user_id: number | null
  title: string
  message: string
  type: string
  link: string | null
  is_read: number
  created_at: string
}

export interface ApiToken {
  id: number
  user_id: number
  name: string
  token_hash: string
  last_used_at: string | null
  expires_at: string | null
  is_active: number
  created_at: string
}

export interface ReportSchedule {
  id: number
  name: string
  report_type: string
  frequency: string
  recipients: string
  format: string
  last_sent_at: string | null
  next_run_at: string
  is_active: number
  created_by: string | null
  created_at: string
}

export interface SavedFilter {
  id: number
  user_email: string
  entity: string
  name: string
  filters: string
  created_at: string
}
