'use client'

export default function SubscriptionBadge({ plan, status }) {
  const getBadgeColor = () => {
    if (plan === 'free') {
      return 'bg-gray-100 text-gray-800 border-gray-300'
    } else if (plan === 'starter') {
      return 'bg-blue-100 text-blue-800 border-blue-300'
    } else if (plan === 'pro') {
      return 'bg-purple-100 text-purple-800 border-purple-300'
    } else if (plan === 'premium') {
      return 'bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-900 border-yellow-400'
    }
    return 'bg-gray-100 text-gray-800'
  }

  const getPlanLabel = () => {
    const labels = {
      free: 'Gratuito',
      starter: 'Starter',
      pro: 'Pro',
      premium: 'Premium',
    }
    return labels[plan] || 'Gratuito'
  }

  const getStatusLabel = () => {
    const labels = {
      active: 'Ativo',
      pending: 'Pendente',
      canceled: 'Cancelado',
      past_due: 'Atrasado',
      trialing: 'Teste',
    }
    return labels[status] || status
  }

  return (
    <div className="flex items-center gap-2">
      <span
        className={`px-3 py-1 text-xs font-semibold rounded-full border ${getBadgeColor()}`}
      >
        {getPlanLabel()}
      </span>
      {status && status !== 'active' && (
        <span className="text-xs text-gray-600">• {getStatusLabel()}</span>
      )}
    </div>
  )
}
