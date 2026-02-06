/**
 * Safe JSON parsing utilities
 * Prevents application crashes from malformed JSON data in database
 */

export interface CorruptionLogEntry {
  context: string;
  data: string;
  error: string;
  timestamp: Date;
}

// In-memory corruption log for debugging (could be persisted later)
const corruptionLog: CorruptionLogEntry[] = [];

/**
 * Get all corruption log entries
 */
export function getCorruptionLog(): readonly CorruptionLogEntry[] {
  return [...corruptionLog];
}

/**
 * Clear corruption log
 */
export function clearCorruptionLog(): void {
  corruptionLog.length = 0;
}

/**
 * Log corrupted data for recovery/debugging
 */
function logCorruption(entry: Omit<CorruptionLogEntry, 'timestamp'>): void {
  const logEntry: CorruptionLogEntry = {
    ...entry,
    timestamp: new Date()
  };
  
  corruptionLog.push(logEntry);
  
  // Keep only last 100 corruption entries
  if (corruptionLog.length > 100) {
    corruptionLog.shift();
  }
  
  // Log to console for immediate visibility
  console.error(`[JSON Parse Error] ${entry.context}:`, entry.error);
  console.error('Corrupted data:', entry.data.substring(0, 200));
}

/**
 * Safely parse JSON with fallback to default value
 * 
 * @param json - JSON string to parse
 * @param defaultValue - Value to return if parsing fails
 * @param context - Description of what's being parsed (for error logging)
 * @returns Parsed object or default value
 * 
 * @example
 * const config = safeJsonParse(record.configuration, {}, 'GradeCategory.configuration');
 */
export function safeJsonParse<T>(
  json: string | null | undefined,
  defaultValue: T,
  context: string
): T {
  // Handle null/undefined
  if (json === null || json === undefined || json === '') {
    return defaultValue;
  }

  try {
    return JSON.parse(json) as T;
  } catch (error) {
    logCorruption({
      context,
      data: json,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return defaultValue;
  }
}

/**
 * Safely stringify object to JSON
 * Handles circular references and undefined values
 * 
 * @param value - Object to stringify
 * @param context - Description of what's being stringified
 * @param defaultValue - String to return if stringification fails (default: '{}')
 * @returns JSON string or default value
 */
export function safeJsonStringify(
  value: unknown,
  context: string,
  defaultValue: string = '{}'
): string {
  try {
    return JSON.stringify(value);
  } catch (error) {
    console.error(`[JSON Stringify Error] ${context}:`, error);
    
    // Try to create a safe representation
    try {
      // Remove circular references using a replacer
      const seen = new WeakSet();
      const sanitized = JSON.stringify(value, (key, val) => {
        if (typeof val === 'object' && val !== null) {
          if (seen.has(val)) {
            return '[Circular Reference]';
          }
          seen.add(val);
        }
        return val;
      });
      return sanitized;
    } catch {
      // If that also fails, return default
      return defaultValue;
    }
  }
}

/**
 * Validate JSON structure matches expected schema
 * Useful for validating imported/loaded data
 * 
 * @param json - JSON string
 * @param validator - Function that validates the parsed object
 * @param context - Description for error messages
 * @returns Validated object or throws error
 */
export function parseAndValidate<T>(
  json: string,
  validator: (obj: unknown) => obj is T,
  context: string
): T {
  const parsed = JSON.parse(json);
  
  if (!validator(parsed)) {
    throw new Error(`${context}: Failed validation`);
  }
  
  return parsed;
}
