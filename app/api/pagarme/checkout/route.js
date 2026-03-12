import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { createPixOrder, createBoletoOrder } from '@/lib/pagarme'

export async function POST(request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return Response.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const {
    method, // 'pix' | 'boleto'
    plan,   // 'pro' | 'business'
    billingCycle, // 'monthly' | 'annual'
    customerName,
    customerDocument, // CPF
    customerAddress,  // obrigatório para boleto
  } = await request.json()

  if (!['pix', 'boleto'].includes(method)) {
    return Response.json({ error: 'Método de pagamento inválido' }, { status: 400 })
  }

  if (!customerDocument || !customerName) {
    return Response.json({ error: 'Nome e CPF são obrigatórios' }, { status: 400 })
  }

  // Tabela de preços em centavos
  const PRICES = {
    pro: { monthly: 1990, annual: 19900 },
    business: { monthly: 4990, annual: 49900 },
  }

  const amount = PRICES[plan]?.[billingCycle === 'annual' ? 'annual' : 'monthly']
  if (!amount) {
    return Response.json({ error: 'Plano ou ciclo inválido' }, { status: 400 })
  }

  const description = `LinkBio Brasil - Plano ${plan.toUpperCase()} ${billingCycle === 'annual' ? 'Anual' : 'Mensal'}`

  try {
    if (method === 'pix') {
      const result = await createPixOrder({
        amount,
        description,
        customerName,
        customerEmail: session.user.email,
        customerDocument: customerDocument.replace(/\D/g, ''),
        expiresInMinutes: 30,
      })
      return Response.json(result)
    }

    if (method === 'boleto') {
      if (!customerAddress) {
        return Response.json({ error: 'Endereço é obrigatório para boleto' }, { status: 400 })
      }
      const result = await createBoletoOrder({
        amount,
        description,
        customerName,
        customerEmail: session.user.email,
        customerDocument: customerDocument.replace(/\D/g, ''),
        customerAddress,
        dueDays: 3,
      })
      return Response.json(result)
    }
  } catch (error) {
    if (error.message === 'PAGARME_API_KEY não configurada') {
      return Response.json({ error: 'Pagar.me não configurado. Adicione PAGARME_API_KEY no .env' }, { status: 503 })
    }
    console.error('[pagarme/checkout] Erro:', error)
    return Response.json({ error: error.message || 'Erro ao criar pedido' }, { status: 500 })
  }
}
