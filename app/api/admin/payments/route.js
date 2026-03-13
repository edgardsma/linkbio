import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

const PLAN_PRICES = { STARTER: 19.9, PRO: 39.9, PREMIUM: 79.9 }

export async function GET(request) {
  const session = await getServerSession(authOptions)

  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  const subs = await prisma.subscription.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { name: true, email: true, username: true } },
    },
  })

  // Return subscriptions as payment-like records
  const payments = subs.map((s) => ({
    id: s.id,
    user: s.user,
    plan: s.plan,
    status: s.status,
    amount: PLAN_PRICES[s.plan] || 0,
    stripeCustomerId: s.stripeCustomerId,
    stripePriceId: s.stripePriceId,
    currentPeriodEnd: s.currentPeriodEnd,
    cancelAtPeriodEnd: s.cancelAtPeriodEnd,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  }))

  return NextResponse.json({ payments, total: payments.length })
}
