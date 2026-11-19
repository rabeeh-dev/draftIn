/**
 * Enterprise Structured Logger for DraftIn SaaS.
 * Provides sanitized logging with automatic redaction of sensitive credentials,
 * tokens, passwords, and private draft text content.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  userId?: string
  action?: string
  module?: string
  error?: Error | unknown
  [key: string]: unknown
}

const REDACTED_KEYS = new Set([
  'password',
  'token',
  'access_token',
  'refresh_token',
  'secret',
  'authorization',
  'cookie',
  'content',
  'text',
  'raw_user_meta_data',
])

function sanitizeData(data: unknown, depth = 0): unknown {
  if (depth > 4) return '[Max Depth]'
  if (data === null || data === undefined) return data
  if (typeof data === 'string') {
    // Redact Bearer tokens
    return data.replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [REDACTED]')
  }
  if (typeof data !== 'object') return data

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeData(item, depth + 1))
  }

  const sanitized: Record<string, unknown> = {}
  for (const [key, val] of Object.entries(data as Record<string, unknown>)) {
    if (REDACTED_KEYS.has(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]'
    } else {
      sanitized[key] = sanitizeData(val, depth + 1)
    }
  }
  return sanitized
}

class Logger {
  private formatLog(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString()
    const sanitizedContext = context ? sanitizeData(context) : undefined
    return {
      timestamp,
      level,
      message,
      ...(sanitizedContext as object),
    }
  }

  debug(message: string, context?: LogContext): void {
    if (import.meta.env?.DEV) {
      console.debug(`[DEBUG] ${message}`, this.formatLog('debug', message, context))
    }
  }

  info(message: string, context?: LogContext): void {
    console.info(`[INFO] ${message}`, this.formatLog('info', message, context))
  }

  warn(message: string, context?: LogContext): void {
    console.warn(`[WARN] ${message}`, this.formatLog('warn', message, context))
  }

  error(message: string, context?: LogContext): void {
    console.error(`[ERROR] ${message}`, this.formatLog('error', message, context))
  }
}

export const logger = new Logger()
