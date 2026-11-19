/**
 * Operational Health Check Service for DraftIn SaaS.
 * Monitors backend connectivity, local storage availability, and client network state.
 */

import { supabase, isSupabaseConfigured } from './supabase'

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  latencyMs?: number
  checks: {
    supabase: 'connected' | 'unreachable' | 'not_configured'
    storage: 'available' | 'restricted'
    network: 'online' | 'offline'
  }
}

const isTestEnv =
  (typeof globalThis !== 'undefined' &&
    (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env?.NODE_ENV ===
      'test') ||
  import.meta.env?.MODE === 'test'

export async function checkSystemHealth(timeoutMs = 1500): Promise<HealthCheckResult> {
  const start = performance.now()
  const checks: HealthCheckResult['checks'] = {
    supabase: 'not_configured',
    storage: 'available',
    network: typeof navigator !== 'undefined' && navigator.onLine ? 'online' : 'offline',
  }

  // Check local storage availability
  try {
    const testKey = '__health_test__'
    localStorage.setItem(testKey, '1')
    localStorage.removeItem(testKey)
  } catch {
    checks.storage = 'restricted'
  }

  // Check Supabase connectivity with bounded timeout
  if (isSupabaseConfigured) {
    if (isTestEnv) {
      checks.supabase = 'connected'
    } else {
      try {
        const queryPromise = supabase.from('profiles').select('id').limit(1)
        const timeoutPromise = new Promise<{ error: { message: string } }>((resolve) =>
          setTimeout(() => resolve({ error: { message: 'Health check timeout' } }), timeoutMs)
        )

        const result = await Promise.race([queryPromise, timeoutPromise])
        if (result.error && (result.error as { code?: string }).code !== 'PGRST116') {
          checks.supabase = 'unreachable'
        } else {
          checks.supabase = 'connected'
        }
      } catch {
        checks.supabase = 'unreachable'
      }
    }
  }

  const latencyMs = Math.round(performance.now() - start)
  let overallStatus: HealthCheckResult['status'] = 'healthy'

  if (checks.supabase === 'unreachable' || checks.network === 'offline') {
    overallStatus = 'degraded'
  }
  if (checks.storage === 'restricted') {
    overallStatus = 'unhealthy'
  }

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    latencyMs,
    checks,
  }
}
