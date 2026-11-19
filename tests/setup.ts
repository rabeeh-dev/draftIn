import '@testing-library/jest-dom/vitest'
import { beforeEach } from 'vitest'
import {
  TEST_FIXTURE_DRAFTS,
  TEST_FIXTURE_ADMIN_USERS,
  TEST_FIXTURE_AUDIT_LOGS,
} from './test-fixtures'

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
})

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: async () => {},
  },
})

beforeEach(() => {
  if (!localStorage.getItem('draftin_drafts_v1')) {
    localStorage.setItem('draftin_drafts_v1', JSON.stringify(TEST_FIXTURE_DRAFTS))
  }
  if (!localStorage.getItem('draftin_admin_users_v1')) {
    localStorage.setItem('draftin_admin_users_v1', JSON.stringify(TEST_FIXTURE_ADMIN_USERS))
  }
  if (!localStorage.getItem('draftin_admin_audit_logs_v1')) {
    localStorage.setItem('draftin_admin_audit_logs_v1', JSON.stringify(TEST_FIXTURE_AUDIT_LOGS))
  }
})
