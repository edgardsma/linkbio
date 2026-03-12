import { prisma } from '@/lib/prisma'
import { verifyWebhookSignature } from '@/lib/pagarme'

export async function POST(request) {
  const body = await request.text()
  const signature = request.headers.get('x-hub-signature') || ''

  if (!verifyWebhookSignature(body, signature.replace('sha256=', ''))) {
    console.error('[pagarme/webhook] Assinatura inválida')
    return Response.json({ error: 'Assinatura inválida' }, { status: 401 })
  }

  let event
  try {
    event = JSON.parse(body)
  } catch {
    return Response.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const type = event.type
  const data = event.data

  console.log(`[pagarme/webhook] Evento: ${type}`)

  try {
    if (type === 'order.paid') {
      await handleOrderPaid(data)
    } else if (type === 'order.canceled' || type === 'order.payment_failed') {
      await handleOrderFailed(data)
    }
  } catch (error) {
    console.error('[pagarme/webhook] Erro ao processar:', error)
    return Response.json({ error: 'Erro ao processar evento' }, { status: 500 })
  }

  return Response.json({ received: true })
}

async function handleOrderPaid(order) {
  const email = order.customer?.email
  if (!email) return

  const user = await prisma.user.findUnique({ where: { email }, include: { subscription: true } })
  if (!user) return

  // Extrair plano da descrição do item
  const description = order.items?.[0]?.description || ''
  const plan = description.toLowerCase().includes('business') ? 'business' : 'pro'
  const isAnnual = description.toLowerCase().includes('anual')

  const periodEnd = new Date()
  periodEnd.setDate(periodEnd.getDate() + (isAnnual ? 365 : 30))

  if (user.subscription) {
    await prisma.subscription.update({
      where: { userId: user.id },
      data: { status: 'active', plan, currentPeriodEnd: periodEnd, cancelAtPeriodEnd: false },
    })
  } else {
    await prisma.subscription.create({
      data: { userId: user.id, status: 'active', plan, currentPeriodEnd: periodEnd },
    })
  }

  console.log(`[pagarme/webhook] Assinatura ativada: ${email} → ${plan}`)
}

async function handleOrderFailed(order) {
  const email = order.customer?.email
  if (!email) return

  const user = await prisma.user.findUnique({ where: { email }, include: { subscription: true } })
  if (!user?.subscription) return

  await prisma.subscription.update({
    where: { userId: user.id },
    data: { status: 'past_due' },
  })
}
