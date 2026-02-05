/**
 * Pagination types and defaults
 */

export interface PaginationOptions {
  limit?: number
  offset?: number
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
  hasMore: boolean
  limit: number
  offset: number
}

export const DEFAULT_PAGINATION_LIMIT = 1000
export const MAX_PAGINATION_LIMIT = 10000

/**
 * Validate and normalize pagination options
 */
export function normalizePaginationOptions(options?: PaginationOptions): Required<PaginationOptions> {
  const limit = Math.min(
    options?.limit ?? DEFAULT_PAGINATION_LIMIT,
    MAX_PAGINATION_LIMIT
  )
  const offset = Math.max(0, options?.offset ?? 0)
  
  return { limit, offset }
}

/**
 * Create a paginated result
 */
export function createPaginatedResult<T>(
  items: T[],
  total: number,
  options: Required<PaginationOptions>
): PaginatedResult<T> {
  return {
    items,
    total,
    hasMore: options.offset + items.length < total,
    limit: options.limit,
    offset: options.offset
  }
}
