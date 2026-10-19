import { cache } from "react"
import { generateRentDues } from "./data"

/**
 * Ensures that rent dues up to next month are continuously generated.
 * Wrapped with React cache() to prevent redundant calls during the same request lifecycle.
 */
export const ensureRentDues = cache(async (userId: string): Promise<number> => {
  return generateRentDues(userId)
})
