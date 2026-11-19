/**
 * Entitlements & Plan Quota Service.
 * Decouples billing/subscription provider mechanics from core editor business logic.
 */

import type { PlanId, PlanEntitlements } from '../types/billing.types'

export const PLAN_ENTITLEMENTS: Record<PlanId, PlanEntitlements> = {
  free: {
    planId: 'free',
    displayName: 'Free Creator',
    maxDrafts: 25,
    hasViralHooks: false,
    hasTemplates: false,
    hasAnalytics: false,
    versionHistoryDays: 7,
    prioritySupport: false,
  },
  pro: {
    planId: 'pro',
    displayName: 'Pro Writer',
    maxDrafts: Infinity,
    hasViralHooks: true,
    hasTemplates: true,
    hasAnalytics: true,
    versionHistoryDays: 365,
    prioritySupport: true,
  },
  enterprise: {
    planId: 'enterprise',
    displayName: 'Enterprise Studio',
    maxDrafts: Infinity,
    hasViralHooks: true,
    hasTemplates: true,
    hasAnalytics: true,
    versionHistoryDays: 730,
    prioritySupport: true,
  },
}

export const entitlementsService = {
  getEntitlements(planId: PlanId = 'free'): PlanEntitlements {
    return PLAN_ENTITLEMENTS[planId] || PLAN_ENTITLEMENTS.free
  },

  canCreateDraft(currentDraftCount: number, planId: PlanId = 'free'): boolean {
    const entitlements = this.getEntitlements(planId)
    return currentDraftCount < entitlements.maxDrafts
  },

  hasFeatureAccess(
    feature: 'viralHooks' | 'templates' | 'analytics',
    planId: PlanId = 'free'
  ): boolean {
    const entitlements = this.getEntitlements(planId)
    if (feature === 'viralHooks') return entitlements.hasViralHooks
    if (feature === 'templates') return entitlements.hasTemplates
    if (feature === 'analytics') return entitlements.hasAnalytics
    return false
  },
}
