import { makeExecutableSchema } from "@graphql-tools/schema"
import { resolvers } from "./resolvers"

const typeDefs = `
  type Asset {
    id: ID
    asset_id: String
    asset_unique_id: String
    asset_name: String
    brand: String
    model: String
    serial_number: String
    status: String
    category: String
    purchase_cost: Float
    purchase_date: String
    vendor: String
    warranty_expiry: String
    asset_location: String
    condition: String
  }

  type Employee {
    id: ID
    employee_id: String
    name: String
    email: String
    department: String
    designation: String
    employment_status: String
  }

  type Assignment {
    id: ID
    assignment_id: String
    asset_id: Int
    employee_id: Int
    assigned_date: String
    returned_date: String
    assignment_status: String
    asset_name: String
    employee_name: String
  }

  type Query {
    assets(search: String, status: String, category: String, skip: Int, limit: Int): [Asset]
    asset(id: ID!): Asset
    employees(search: String, department: String, skip: Int, limit: Int): [Employee]
    employee(id: ID!): Employee
    assignments(status: String, skip: Int, limit: Int): [Assignment]
    dashboard: DashboardStats
  }

  type DashboardStats {
    total_assets: Int
    total_employees: Int
    assigned_assets: Int
    available_assets: Int
    under_repair_assets: Int
  }
`

export const schema = makeExecutableSchema({ typeDefs, resolvers })
