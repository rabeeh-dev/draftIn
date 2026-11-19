/**
 * SaaS Monetization & Subscription Entitlement Types.
 */

export type PlanId = 'free' | 'pro' | 'enterprise'

export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'incomplete'

export interface PlanEntitlements {
  planId: PlanId
  displayName: string
  maxDrafts: number
  hasViralHooks: boolean
  hasTemplates: boolean
  hasAnalytics: boolean
  versionHistoryDays: number
  prioritySupport: boolean
}

export interface UserSubscription {
  id: string
  userId: string
  status: SubscriptionStatus
  planId: PlanId
  currentPeriodEnd?: string | null
  cancelAtPeriodEnd: boolean
}
