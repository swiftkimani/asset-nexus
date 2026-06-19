import type { Row } from "@libsql/client"

export function rowAs<T>(row: Row | undefined): T | undefined {
  return row as unknown as T
}

export function firstRow<T>(rows: Row[]): T | undefined {
  return rows[0] as unknown as T | undefined
}
