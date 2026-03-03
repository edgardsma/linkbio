import prisma from './prisma'
import { PLANS, isPremiumPlan, getMaxLinksForPlan, canAddMoreLinks } from './stripe'

/**
 * Busca a assinatura de um usuário
 */
export async function getUserSubscription(userId) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    })

    if (!user) {
      return null
    }

    return {
      userId: user.id,
      subscription: user.subscription,
      plan: user.subscription?.plan || 'free',
      status: user.subscription?.status || 'active',
      isPremium: isPremiumPlan(user.subscription?.plan || 'free'),
      currentPeriodEnd: user.subscription?.currentPeriodEnd,
      cancelAtPeriodEnd: user.subscription?.cancelAtPeriodEnd || false,
    }
  } catch (error) {
    console.error('Erro ao buscar assinatura do usuário:', error)
    return null
  }
}

/**
 * Verifica se o usuário tem uma assinatura ativa
 */
export async function hasActiveSubscription(userId) {
  const sub = await getUserSubscription(userId)

  if (!sub) {
    return false
  }

  return (
    sub.status === 'active' ||
    sub.status === 'trialing' ||
    (sub.status === 'past_due' && sub.currentPeriodEnd > new Date())
  )
}

/**
 * Verifica se o usuário atingiu o limite de links
 */
export async function hasReachedLinkLimit(userId) {
  try {
    const [subscription, linkCount] = await Promise.all([
      getUserSubscription(userId),
      prisma.link.count({ where: { userId, isActive: true } }),
    ])

    const maxLinks = getMaxLinksForPlan(subscription?.plan || 'free')

    return linkCount >= maxLinks
  } catch (error) {
    console.error('Erro ao verificar limite de links:', error)
    return true // Retornar true por segurança
  }
}

/**
 * Verifica se o usuário pode adicionar mais links
 */
export async function canUserAddLinks(userId) {
  const hasReached = await hasReachedLinkLimit(userId)
  return !hasReached
}

/**
 * Obtém o plano atual do usuário
 */
export async function getUserPlan(userId) {
  const sub = await getUserSubscription(userId)
  return sub?.plan || 'free'
}

/**
 * Obtém informações completas do plano do usuário
 */
export async function getUserPlanInfo(userId) {
  const sub = await getUserSubscription(userId)
  const plan = sub?.plan || 'free'

  return {
    ...PLANS[plan],
    current: true,
    status: sub?.status || 'active',
    currentPeriodEnd: sub?.currentPeriodEnd,
    cancelAtPeriodEnd: sub?.cancelAtPeriodEnd || false,
  }
}

/**
 * Verifica se o usuário tem acesso a uma feature específica
 */
export async function hasFeatureAccess(userId, feature) {
  const plan = await getUserPlan(userId)

  switch (feature) {
    case 'customDomain':
      return plan === 'premium'
    case 'apiAccess':
      return plan === 'premium'
    case 'advancedAnalytics':
      return ['pro', 'premium'].includes(plan)
    case 'unlimitedLinks':
      return ['pro', 'premium'].includes(plan)
    case 'customThemes':
      return ['pro', 'premium'].includes(plan)
    case 'premiumThemes':
      return plan === 'premium'
    default:
      return false
  }
}

/**
 * Atualiza o plano do usuário (para uso em webhooks)
 */
export async function updateUserSubscription(userId, data) {
  try {
    return await prisma.subscription.update({
      where: { userId },
      data,
    })
  } catch (error) {
    console.error('Erro ao atualizar assinatura:', error)
    throw error
  }
}

/**
 * Cria uma assinatura para o usuário
 */
export async function createUserSubscription(userId, data) {
  try {
    return await prisma.subscription.create({
      data: {
        userId,
        ...data,
      },
    })
  } catch (error) {
    console.error('Erro ao criar assinatura:', error)
    throw error
  }
}

/**
 * Verifica se uma assinatura deve ser cancelada ao final do período
 */
export function isSubscriptionCanceled(subscription) {
  if (!subscription) {
    return false
  }

  return subscription.cancelAtPeriodEnd === true && subscription.status === 'active'
}

/**
 * Calcula dias restantes até o cancelamento ou renovação
 */
export function getDaysRemaining(subscription) {
  if (!subscription || !subscription.currentPeriodEnd) {
    return null
  }

  const now = new Date()
  const periodEnd = new Date(subscription.currentPeriodEnd)
  const diffTime = periodEnd - now
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return Math.max(0, diffDays)
}
