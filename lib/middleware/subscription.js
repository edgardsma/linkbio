import { getUserSubscription, hasActiveSubscription, hasFeatureAccess, hasReachedLinkLimit } from '@/lib/subscription'

/**
 * Middleware para verificar se o usuário tem assinatura ativa
 * Use para proteger rotas premium
 */
export async function requireSubscription(req, res, next) {
  try {
    const userId = req.session?.user?.id

    if (!userId) {
      return res.status(401).json({ error: 'Não autorizado' })
    }

    const isActive = await hasActiveSubscription(userId)

    if (!isActive) {
      return res.status(403).json({
        error: 'Assinatura premium necessária',
        message: 'Esta funcionalidade requer uma assinatura ativa',
        redirect: '/dashboard/plans',
      })
    }

    next()
  } catch (error) {
    console.error('Erro no middleware de assinatura:', error)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

/**
 * Middleware para verificar acesso a features específicas
 */
export async function requireFeature(feature) {
  return async (req, res, next) => {
    try {
      const userId = req.session?.user?.id

      if (!userId) {
        return res.status(401).json({ error: 'Não autorizado' })
      }

      const hasAccess = await hasFeatureAccess(userId, feature)

      if (!hasAccess) {
        return res.status(403).json({
          error: 'Recurso não disponível no seu plano',
          message: `A funcionalidade ${feature} não está disponível no seu plano atual`,
          redirect: '/dashboard/plans',
        })
      }

      next()
    } catch (error) {
      console.error('Erro no middleware de features:', error)
      return res.status(500).json({ error: 'Erro interno do servidor' })
    }
  }
}

/**
 * Middleware para verificar limite de links
 * Use em APIs que criam novos links
 */
export async function requireLinkCapacity(req, res, next) {
  try {
    const userId = req.session?.user?.id

    if (!userId) {
      return res.status(401).json({ error: 'Não autorizado' })
    }

    const reached = await hasReachedLinkLimit(userId)

    if (reached) {
      const sub = await getUserSubscription(userId)
      const maxLinks = sub?.plan ? getMaxLinksForPlan(sub.plan) : 3

      return res.status(403).json({
        error: 'Limite de links atingido',
        message: `Você atingiu o limite de ${maxLinks} links no plano ${sub?.plan || 'gratuito'}`,
        redirect: '/dashboard/plans',
      })
    }

    next()
  } catch (error) {
    console.error('Erro no middleware de limite de links:', error)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

/**
 * Helper para obter limite de links por plano
 */
function getMaxLinksForPlan(plan) {
  const limits = {
    free: 3,
    starter: 5,
    pro: Infinity,
    premium: Infinity,
  }
  return limits[plan] || 3
}

/**
 * Middleware para verificar plano específico
 */
export async function requirePlan(planId) {
  return async (req, res, next) => {
    try {
      const userId = req.session?.user?.id

      if (!userId) {
        return res.status(401).json({ error: 'Não autorizado' })
      }

      const sub = await getUserSubscription(userId)
      const currentPlan = sub?.plan || 'free'

      // Verificar hierarquia de planos
      const planHierarchy = ['free', 'starter', 'pro', 'premium']
      const currentIndex = planHierarchy.indexOf(currentPlan)
      const requiredIndex = planHierarchy.indexOf(planId)

      if (currentIndex < requiredIndex) {
        return res.status(403).json({
          error: 'Plano insuficiente',
          message: `Esta funcionalidade requer o plano ${planId}`,
          redirect: '/dashboard/plans',
        })
      }

      next()
    } catch (error) {
      console.error('Erro no middleware de plano:', error)
      return res.status(500).json({ error: 'Erro interno do servidor' })
    }
  }
}
