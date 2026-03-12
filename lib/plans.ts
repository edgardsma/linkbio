/**
 * Feature Gating por Plano - LinkBio Brasil
 */

export enum Plan {
  FREE = 'free',
  PRO = 'pro',
  BUSINESS = 'business',
}

export interface PlanLimits {
  maxLinks: number
  maxLeads: number
  analytics: boolean
  advancedAnalytics: boolean
  embeds: boolean
  customDomain: boolean
  leadCapture: boolean
  leadExport: boolean
  aiTools: boolean
  products: boolean
  whatsappBusiness: boolean
  hotmartCard: boolean
  kiwifyCard: boolean
  removeWatermark: boolean
  prioritySupport: boolean
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  [Plan.FREE]: {
    maxLinks: 5,
    maxLeads: 0,
    analytics: false,
    advancedAnalytics: false,
    embeds: false,
    customDomain: false,
    leadCapture: false,
    leadExport: false,
    aiTools: false,
    products: false,
    whatsappBusiness: false,
    hotmartCard: false,
    kiwifyCard: false,
    removeWatermark: false,
    prioritySupport: false,
  },
  [Plan.PRO]: {
    maxLinks: 50,
    maxLeads: 1000,
    analytics: true,
    advancedAnalytics: true,
    embeds: true,
    customDomain: false,
    leadCapture: true,
    leadExport: true,
    aiTools: true,
    products: false,
    whatsappBusiness: true,
    hotmartCard: true,
    kiwifyCard: true,
    removeWatermark: true,
    prioritySupport: false,
  },
  [Plan.BUSINESS]: {
    maxLinks: Infinity,
    maxLeads: Infinity,
    analytics: true,
    advancedAnalytics: true,
    embeds: true,
    customDomain: true,
    leadCapture: true,
    leadExport: true,
    aiTools: true,
    products: true,
    whatsappBusiness: true,
    hotmartCard: true,
    kiwifyCard: true,
    removeWatermark: true,
    prioritySupport: true,
  },
}

export const PLAN_PRICES = {
  [Plan.FREE]: { monthly: 0, annual: 0, label: 'Grátis' },
  [Plan.PRO]: { monthly: 1990, annual: 19900, label: 'Pro' }, // centavos
  [Plan.BUSINESS]: { monthly: 4990, annual: 49900, label: 'Business' },
}

export function getUserPlan(
  subscription?: { plan: string; status: string } | null
): Plan {
  if (!subscription || subscription.status !== 'active') return Plan.FREE
  const plan = subscription.plan?.toLowerCase()
  if (plan === 'business') return Plan.BUSINESS
  if (plan === 'pro') return Plan.PRO
  return Plan.FREE
}

export function canUseFeature(
  plan: Plan,
  feature: keyof PlanLimits
): boolean {
  const limit = PLAN_LIMITS[plan][feature]
  return typeof limit === 'boolean' ? limit : (limit as number) > 0
}

export function getMaxLinks(plan: Plan): number {
  return PLAN_LIMITS[plan].maxLinks
}

export function getMaxLeads(plan: Plan): number {
  return PLAN_LIMITS[plan].maxLeads
}

/** Tipos de link disponíveis por plano */
export const EMBED_TYPES = [
  'youtube', 'spotify', 'tiktok', 'threads', 'soundcloud', 'twitch', 'kwai',
]

export const PREMIUM_LINK_TYPES = [
  ...EMBED_TYPES,
  'leadform',
  'hotmart',
  'kiwify',
  'whatsapp_business',
]

export function isEmbedType(type: string): boolean {
  return EMBED_TYPES.includes(type)
}

export function isPremiumLinkType(type: string): boolean {
  return PREMIUM_LINK_TYPES.includes(type)
}
