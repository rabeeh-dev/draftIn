/**
 * IndexedDB persistence layer for DraftIn SaaS.
 * Provides non-blocking, multi-megabyte offline storage for drafts and versions.
 * Automatically falls back to synchronous LocalStorage if IndexedDB is unavailable (e.g. in test env or private browsing).
 */

import type { Draft } from '@/types'

const DB_NAME = 'draftin_db'
const DB_VERSION = 1
const DRAFTS_STORE = 'drafts'

function isIndexedDBAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined'
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isIndexedDBAvailable()) {
      reject(new Error('IndexedDB not supported in this environment'))
      return
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(DRAFTS_STORE)) {
        const store = db.createObjectStore(DRAFTS_STORE, { keyPath: 'id' })
        store.createIndex('userId', 'userId', { unique: false })
        store.createIndex('updatedAt', 'updatedAt', { unique: false })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB'))
  })
}

export const idbService = {
  async saveDrafts(drafts: Draft[], userId?: string | null): Promise<void> {
    if (!isIndexedDBAvailable()) return

    try {
      const db = await openDatabase()
      const tx = db.transaction(DRAFTS_STORE, 'readwrite')
      const store = tx.objectStore(DRAFTS_STORE)

      for (const draft of drafts) {
        store.put({
          ...draft,
          userId: userId || 'anonymous',
        })
      }

      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
      })
    } catch {
      // Graceful fallback: LocalStorage is maintained by draftService
    }
  },

  async getDrafts(userId?: string | null): Promise<Draft[]> {
    if (!isIndexedDBAvailable()) return []

    try {
      const db = await openDatabase()
      const tx = db.transaction(DRAFTS_STORE, 'readonly')
      const store = tx.objectStore(DRAFTS_STORE)

      return new Promise<Draft[]>((resolve, reject) => {
        const request = store.getAll()
        request.onsuccess = () => {
          const records = request.result as (Draft & { userId?: string })[]
          const filtered = userId
            ? records.filter((r) => r.userId === userId)
            : records
          resolve(filtered)
        }
        request.onerror = () => reject(request.error)
      })
    } catch {
      return []
    }
  },

  async deleteDraft(draftId: string): Promise<void> {
    if (!isIndexedDBAvailable()) return

    try {
      const db = await openDatabase()
      const tx = db.transaction(DRAFTS_STORE, 'readwrite')
      tx.objectStore(DRAFTS_STORE).delete(draftId)
    } catch {
      // Ignore
    }
  },
}
