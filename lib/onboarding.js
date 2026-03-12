/**
 * Onboarding - Sistema de acompanhamento de novos usuários
 *
 * Calcula status das etapas de onboarding baseando-se nos dados do usuário
 */

export async function getOnboardingStatus(params) {
  const { user } = params

  const steps = [
    // 1. Foto de perfil
    {
      id: 'profile_image',
      title: 'Adicionar foto de perfil',
      description: 'Personalize sua página com uma foto',
      icon: '📸',
      completed: !!user.image,
      action: '/profile',
    },
    // 2. Primeiro link
    {
      id: 'first_link',
      title: 'Adicionar primeiro link',
      description: 'Comece adicionando seu Instagram ou WhatsApp',
      icon: '🔗',
      completed: (user.links?.length || 0) > 0,
      action: '/dashboard',
    },
    // 3. Escolher template
    {
      id: 'choose_template',
      title: 'Escolher template visual',
      description: 'Dê um visual profissional à sua página',
      icon: '🎨',
      completed: !!user.themeId,
      action: '/templates',
    },
    // 4. Compartilhar perfil
    {
      id: 'share_profile',
      title: 'Compartilhar seu perfil',
      description: 'Copie e compartilhe seu link nas redes sociais',
      icon: '📤',
      completed: false, // Não rastreável no backend, usuário clica manualmente
      action: `/profile`,
    },
    // 5. Conectar rede social
    {
      id: 'connect_social',
      title: 'Conectar rede social',
      description: 'Facilite o login com Google ou GitHub',
      icon: '🔐',
      completed: (user.accounts?.length || 0) > 0,
      action: '/auth/login',
    },
    // 6. Ativar plano Pro
    {
      id: 'upgrade_pro',
      title: 'Ativar plano Pro',
      description: 'Desbloqueie recursos avançados e remova limites',
      icon: '⭐',
      completed: user.subscription?.plan !== 'free',
      action: '/pricing',
    },
  ]

  const completedCount = steps.filter(s => s.completed).length
  const totalCount = steps.length
  const isComplete = completedCount === totalCount

  // Só pode fechar o checklist após completar pelo menos 50% ou se for plano Pro
  const canDismiss = completedCount >= 3 || user.subscription?.plan !== 'free'

  return {
    steps,
    completedCount,
    totalCount,
    isComplete,
    canDismiss,
  }
}

/**
 * Marca que o usuário ignorou o onboarding
 * (salva no User.onboardingDismissed)
 */
export async function dismissOnboarding(userId) {
  const { prisma } = await import('@/lib/prisma.js')
  await prisma.user.update({
    where: { id: userId },
    data: { onboardingDismissed: true },
  })
}

/**
 * Verifica se deve mostrar o onboarding
 */
export function shouldShowOnboarding(status, dismissed) {
  if (status.isComplete) return false
  if (dismissed) return false
  // Mostra sempre que não estiver completo, usuário pode fechar se canDismiss = true
  return true
}

/**
 * Porcentagem de conclusão (para barra de progresso)
 */
export function getOnboardingProgress(status) {
  return Math.round((status.completedCount / status.totalCount) * 100)
}
