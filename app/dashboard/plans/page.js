import PricingPlans from '@/components/PricingPlans'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/prisma'

export const metadata = {
  title: 'Planos - LinkBio Brasil',
  description: 'Escolha o plano ideal para você',
}

export default async function PlansPage() {
  const session = await getServerSession(authOptions)

  let userPlan = 'free'
  let currentLinksCount = 0

  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        subscription: true,
        links: true,
      },
    })

    if (user) {
      userPlan = user.subscription?.plan || 'free'
      currentLinksCount = user.links.length
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Planos</h1>
          <p className="text-gray-600 mt-1">
            {userPlan === 'free'
              ? 'Comece gratuitamente e atualize quando precisar'
              : `Plano atual: ${
                  userPlan === 'starter'
                    ? 'Starter'
                    : userPlan === 'pro'
                    ? 'Pro'
                    : 'Premium'
                } • ${currentLinksCount} link${currentLinksCount !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {/* Planos */}
      <PricingPlans />
    </div>
  )
}
