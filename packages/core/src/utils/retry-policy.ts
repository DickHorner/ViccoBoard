/**
 * Retry policy for network operations with exponential backoff
 */

export interface RetryPolicyOptions {
  /**
   * Maximum number of retry attempts (default: 3)
   */
  maxAttempts?: number
  
  /**
   * Initial delay in milliseconds before first retry (default: 100)
   */
  initialDelay?: number
  
  /**
   * Multiplier for exponential backoff (default: 2)
   */
  backoffMultiplier?: number
  
  /**
   * Maximum delay cap in milliseconds (default: 5000)
   */
  maxDelay?: number
  
  /**
   * Predicate to determine if error should trigger a retry
   * Returns true if retry should be attempted
   */
  shouldRetry?: (error: unknown) => boolean
  
  /**
   * Callback invoked before each retry attempt
   */
  onRetry?: (attempt: number, delay: number, error: unknown) => void
}

export class RetryPolicy {
  private readonly maxAttempts: number
  private readonly initialDelay: number
  private readonly backoffMultiplier: number
  private readonly maxDelay: number
  private readonly shouldRetry: (error: unknown) => boolean
  private readonly onRetry?: (attempt: number, delay: number, error: unknown) => void

  constructor(options: RetryPolicyOptions = {}) {
    this.maxAttempts = Math.max(1, options.maxAttempts ?? 3)
    this.initialDelay = Math.max(0, options.initialDelay ?? 100)
    this.backoffMultiplier = Math.max(1, options.backoffMultiplier ?? 2)
    this.maxDelay = Math.max(this.initialDelay, options.maxDelay ?? 5000)
    this.shouldRetry = options.shouldRetry ?? this.defaultShouldRetry
    this.onRetry = options.onRetry
  }

  /**
   * Default retry predicate: retry on network errors and 5xx status codes
   */
  private defaultShouldRetry(error: unknown): boolean {
    // Network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return true
    }
    
    // HTTP errors with status code
    if (typeof error === 'object' && error !== null) {
      const statusCode = (error as any).status || (error as any).statusCode
      if (typeof statusCode === 'number') {
        // Retry on 5xx server errors and 429 (too many requests)
        return statusCode >= 500 || statusCode === 429
      }
    }
    
    return false
  }

  /**
   * Calculate delay for given attempt number (1-based)
   */
  private calculateDelay(attempt: number): number {
    const delay = this.initialDelay * Math.pow(this.backoffMultiplier, attempt - 1)
    return Math.min(delay, this.maxDelay)
  }

  /**
   * Execute operation with retry logic
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: unknown = null
    
    for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error
        
        // Check if we should retry
        const isLastAttempt = attempt === this.maxAttempts
        if (isLastAttempt || !this.shouldRetry(error)) {
          throw error
        }
        
        // Calculate delay and wait
        const delay = this.calculateDelay(attempt)
        
        // Notify callback
        if (this.onRetry) {
          this.onRetry(attempt, delay, error)
        }
        
        // Wait before next attempt
        await this.sleep(delay)
      }
    }
    
    // Should never reach here, but TypeScript needs it
    throw lastError
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Create a retry policy with custom options
   */
  static create(options: RetryPolicyOptions = {}): RetryPolicy {
    return new RetryPolicy(options)
  }

  /**
   * Predefined policy for network requests
   */
  static forNetworkRequests(): RetryPolicy {
    return new RetryPolicy({
      maxAttempts: 3,
      initialDelay: 100,
      backoffMultiplier: 2,
      maxDelay: 5000,
      onRetry: (attempt, delay, error) => {
        console.warn(`[RetryPolicy] Retry attempt ${attempt} after ${delay}ms due to:`, error)
      }
    })
  }

  /**
   * Predefined policy for database operations
   */
  static forDatabaseOperations(): RetryPolicy {
    return new RetryPolicy({
      maxAttempts: 2,
      initialDelay: 50,
      backoffMultiplier: 2,
      maxDelay: 200,
      shouldRetry: (error) => {
        // Retry on database lock errors
        if (error instanceof Error) {
          return error.message.includes('lock') || error.message.includes('busy')
        }
        return false
      },
      onRetry: (attempt, delay, error) => {
        console.warn(`[RetryPolicy] Database retry attempt ${attempt} after ${delay}ms due to:`, error)
      }
    })
  }
}
