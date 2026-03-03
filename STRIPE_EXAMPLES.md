# Exemplos de Uso - Integração Stripe

Este documento contém exemplos práticos de como usar a integração com Stripe no projeto LinkBio Brasil.

## 📋 Índice

- [Configuração Inicial](#configuração-inicial)
- [Exemplos de Backend](#exemplos-de-backend)
- [Exemplos de Frontend](#exemplos-de-frontend)
- [Exemplos de Webhook](#exemplos-de-webhook)
- [Exemplos de Testes](#exemplos-de-testes)
- [Casos de Uso Avançados](#casos-de-uso-avançados)

---

## 🔧 Configuração Inicial

### 1. Configurar Variáveis de Ambiente

```bash
# .env
STRIPE_SECRET_KEY=sk_test_51xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_51xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Price IDs
STRIPE_PRICE_STARTER_MONTHLY=price_starter_monthly_id
STRIPE_PRICE_STARTER_ANNUAL=price_starter_annual_id
STRIPE_PRICE_PRO_MONTHLY=price_pro_monthly_id
STRIPE_PRICE_PRO_ANNUAL=price_pro_annual_id
STRIPE_PRICE_PREMIUM_MONTHLY=price_premium_monthly_id
STRIPE_PRICE_PREMIUM_ANNUAL=price_premium_annual_id
```

### 2. Criar Cliente Stripe

```javascript
import stripe from '@/lib/stripe'

// Criar novo cliente
const customer = await stripe.customers.create({
  email: 'usuario@exemplo.com',
  name: 'João Silva',
  metadata: {
    userId: 'user_123',
    username: 'joaosilva',
  },
})

console.log('Customer ID:', customer.id)
```

---

## 🖥️ Exemplos de Backend

### Criar Sessão de Checkout

```javascript
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import stripe from '@/lib/stripe'
import prisma from '@/lib/prisma'

export async function POST(request) {
  const session = await getServerSession()
  const { plan, billingCycle } = await request.json()

  // Buscar usuário
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { subscription: true },
  })

  // Criar ou recuperar customer
  let customerId = user.subscription?.stripeCustomerId
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: { userId: user.id },
    })
    customerId = customer.id
  }

  // Criar sessão de checkout
  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: `price_${plan}_${billingCycle}`,
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXTAUTH_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXTAUTH_URL}/dashboard/plans`,
    metadata: {
      userId: user.id,
      plan: plan,
      billingCycle: billingCycle,
    },
  })

  return NextResponse.json({ url: checkoutSession.url })
}
```

### Verificar Limites de Links

```javascript
import { hasReachedLinkLimit } from '@/lib/subscription'

export async function POST(request) {
  const session = await getServerSession()

  // Verificar se atingiu limite
  const reached = await hasReachedLinkLimit(session.user.id)

  if (reached) {
    return NextResponse.json(
      {
        error: 'Limite de links atingido',
        message: 'Faça upgrade para adicionar mais links',
        upgradeUrl: '/dashboard/plans',
      },
      { status: 403 }
    )
  }

  // Criar link...
}
```

### Verificar Acesso a Feature

```javascript
import { hasFeatureAccess } from '@/lib/subscription'

// Middleware para proteger rotas premium
async function requireCustomDomain(req, res, next) {
  const hasAccess = await hasFeatureAccess(req.user.id, 'customDomain')

  if (!hasAccess) {
    return res.status(403).json({
      error: 'Feature não disponível',
      message: 'Domínio personalizado requer plano Premium',
      requiredPlan: 'premium',
    })
  }

  next()
}
```

### Obter Informações da Assinatura

```javascript
import { getUserSubscription, getUserPlanInfo } from '@/lib/subscription'

export async function GET() {
  const session = await getServerSession()

  // Informações básicas
  const subscription = await getUserSubscription(session.user.id)
  console.log('Plano:', subscription.plan)
  console.log('Status:', subscription.status)
  console.log('É Premium:', subscription.isPremium)

  // Informações completas do plano
  const planInfo = await getUserPlanInfo(session.user.id)
  console.log('Nome do Plano:', planInfo.name)
  console.log('Preço:', planInfo.monthly.price)
  console.log('Features:', planInfo.features)

  return Response.json(planInfo)
}
```

### Criar Portal de Faturamento

```javascript
import stripe from '@/lib/stripe'

export async function POST(request) {
  const session = await getServerSession()
  const { returnUrl } = await request.json()

  const subscription = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
  })

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: returnUrl || `${process.env.NEXTAUTH_URL}/dashboard/billing`,
  })

  return NextResponse.json({ url: portalSession.url })
}
```

---

## 🎨 Exemplos de Frontend

### Usar Hook de Assinatura

```javascript
'use client'

import { useSubscription } from '@/hooks/useSubscription'
import { useState } from 'react'

export default function PricingPage() {
  const {
    subscription,
    loading,
    hasSubscription,
    plan,
    redirectToCheckout,
    openBillingPortal,
  } = useSubscription()

  const [selectedPlan, setSelectedPlan] = useState('pro')

  if (loading) {
    return <div>Carregando...</div>
  }

  return (
    <div>
      <h1>Planos</h1>

      <p>Plano atual: {plan}</p>

      {hasSubscription ? (
        <button onClick={openBillingPortal}>
          Gerenciar Assinatura
        </button>
      ) : (
        <button onClick={() => redirectToCheckout(selectedPlan, 'monthly')}>
          Assinar Plano Pro
        </button>
      )}
    </div>
  )
}
```

### Componente de Badge de Assinatura

```javascript
import SubscriptionBadge from '@/components/SubscriptionBadge'

export default function UserCard({ user }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2>{user.name}</h2>
      <p>{user.email}</p>

      <div className="mt-4">
        <SubscriptionBadge
          plan={user.subscription?.plan || 'free'}
          status={user.subscription?.status || 'active'}
        />
      </div>
    </div>
  )
}
```

### Alerta de Limite de Links

```javascript
import SubscriptionLimitAlert from '@/components/SubscriptionLimitAlert'

export default function LinkManager({ user, linkCount }) {
  const maxLinks = user.plan === 'free' ? 3 : user.plan === 'starter' ? 5 : Infinity

  return (
    <div>
      <SubscriptionLimitAlert
        plan={user.plan}
        maxLinks={maxLinks}
        currentLinks={linkCount}
        onUpgrade={() => (window.location.href = '/dashboard/plans')}
      />

      <LinkList links={user.links} />
    </div>
  )
}
```

### Tabela de Preços Interativa

```javascript
'use client'

import { useState } from 'react'
import PricingPlans from '@/components/PricingPlans'

export default function PlansPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-4">
        <h1 className="text-4xl font-bold text-center mb-8">
          Escolha o plano ideal
        </h1>

        <PricingPlans />
      </div>
    </div>
  )
}
```

### Verificar Acesso a Features no Frontend

```javascript
'use client'

import { useSubscription } from '@/hooks/useSubscription'

export default function FeatureCard({ feature, children }) {
  const { plan } = useSubscription()

  const hasAccess = {
    customDomain: plan === 'premium',
    apiAccess: plan === 'premium',
    advancedAnalytics: ['pro', 'premium'].includes(plan),
    allThemes: ['pro', 'premium'].includes(plan),
  }

  if (!hasAccess[feature]) {
    return (
      <div className="relative opacity-50">
        {children}

        <div className="absolute inset-0 flex items-center justify-center bg-white/50">
          <div className="bg-purple-600 text-white px-4 py-2 rounded-lg">
            Recurso Premium
          </div>
        </div>
      </div>
    )
  }

  return children
}

// Uso
<FeatureCard feature="advancedAnalytics">
  <AnalyticsDashboard />
</FeatureCard>
```

---

## 🔄 Exemplos de Webhook

### Processar Webhook do Stripe

```javascript
import Stripe from 'stripe'
import { headers } from 'next/headers'
import prisma from '@/lib/prisma'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(request) {
  const body = await request.text()
  const signature = headers().get('stripe-signature')

  let event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    return Response.json({ error: 'Invalid signature' }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object)
      break

    case 'customer.subscription.created':
      await handleSubscriptionCreated(event.data.object)
      break

    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object)
      break

    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object)
      break

    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(event.data.object)
      break

    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object)
      break
  }

  return Response.json({ received: true })
}

async function handleSubscriptionCreated(subscription) {
  const { userId, plan } = subscription.metadata

  await prisma.subscription.create({
    data: {
      userId,
      stripeCustomerId: subscription.customer,
      stripePriceId: subscription.items.data[0].price.id,
      status: 'active',
      plan,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
  })

  // Enviar email de confirmação
  // await sendSubscriptionConfirmationEmail(userId, plan)
}
```

### Handler Personalizado para Upgrade

```javascript
async function handleSubscriptionUpdated(subscription) {
  const customerId = subscription.customer
  const oldSubscription = await prisma.subscription.findFirst({
    where: { stripeCustomerId: customerId },
  })

  const newPriceId = subscription.items.data[0].price.id
  const oldPriceId = oldSubscription?.stripePriceId

  // Detectou upgrade
  if (oldPriceId !== newPriceId) {
    const newPlan = getPlanFromPriceId(newPriceId)

    // Atualizar plano
    await prisma.subscription.update({
      where: { id: oldSubscription.id },
      data: {
        plan: newPlan,
        stripePriceId: newPriceId,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
    })

    // Enviar notificação de upgrade
    // await sendUpgradeNotification(oldSubscription.userId, newPlan)
  }
}
```

---

## 🧪 Exemplos de Testes

### Testar Checkout

```bash
# Criar checkout session
curl -X POST http://localhost:3000/api/stripe/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "plan": "pro",
    "billingCycle": "monthly"
  }'

# Resposta esperada
{
  "url": "https://checkout.stripe.com/c/pay/...",
  "sessionId": "cs_test_..."
}
```

### Testar Portal de Faturamento

```bash
# Criar portal session
curl -X POST http://localhost:3000/api/stripe/portal

# Resposta esperada
{
  "url": "https://billing.stripe.com/session/...",
  "hasSubscription": true
}
```

### Testar Webhook Localmente

```bash
# Iniciar webhook listener
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Você receberá um webhook secret de teste
# Atualize seu .env com: STRIPE_WEBHOOK_SECRET=whsec_...

# Testar eventos
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
stripe trigger invoice.payment_succeeded
```

### Testar com Cartões de Teste

```javascript
// No checkout do Stripe, use estes números de cartão:

// Pagamento bem-sucedido
Card: 4242 4242 4242 4242
Expiry: Any future date
CVC: Any 3 digits

// Pagamento recusado
Card: 4000 0000 0000 0002

// Cartão expirado
Card: 4000 0000 0000 0069

// Pagamento requer autenticação
Card: 4000 0025 0000 3155
```

---

## 🚀 Casos de Uso Avançados

### 1. Upgrade Automático ao Atingir Limite

```javascript
import { hasReachedLinkLimit } from '@/lib/subscription'

export async function createLinkHandler(request) {
  const session = await getServerSession()
  const userId = session.user.id

  // Verificar limite
  const reached = await hasReachedLinkLimit(userId)

  if (reached) {
    // Sugerir upgrade automaticamente
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    })

    if (user.subscription?.plan === 'free') {
      // Criar checkout para upgrade
      const checkout = await createCheckoutSession(user, 'starter', 'monthly')
      return Response.json({
        upgradeRequired: true,
        currentPlan: 'free',
        suggestedPlan: 'starter',
        checkoutUrl: checkout.url,
      })
    }
  }

  // Criar link normalmente
  const link = await createLink(userId, data)
  return Response.json(link)
}
```

### 2. Cancelamento com Data Específica

```javascript
import stripe from '@/lib/stripe'

export async function POST(request) {
  const { cancelDate } = await request.json()
  const session = await getServerSession()

  const subscription = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
  })

  const stripeSubscriptions = await stripe.subscriptions.list({
    customer: subscription.stripeCustomerId,
    limit: 1,
  })

  const stripeSubscription = stripeSubscriptions.data[0]

  // Cancelar em data específica
  await stripe.subscriptions.update(stripeSubscription.id, {
    cancel_at: Math.floor(new Date(cancelDate).getTime() / 1000),
  })

  return Response.json({ success: true })
}
```

### 3. Aplicar Cupom de Desconto

```javascript
export async function POST(request) {
  const { couponCode, plan, billingCycle } = await request.json()

  // Verificar cupom
  try {
    await stripe.coupons.retrieve(couponCode)
  } catch (error) {
    return Response.json(
      { error: 'Cupom inválido ou expirado' },
      { status: 400 }
    )
  }

  // Criar checkout com cupom
  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    discounts: [{ coupon: couponCode }],
    success_url: `${process.env.NEXTAUTH_URL}/dashboard?success=true`,
    cancel_url: `${process.env.NEXTAUTH_URL}/dashboard/plans`,
  })

  return Response.json({ url: checkoutSession.url })
}
```

### 4. Notificação de Pagamento em Atraso

```javascript
async function handlePaymentFailed(invoice) {
  const customerId = invoice.customer
  const subscription = await prisma.subscription.findFirst({
    where: { stripeCustomerId: customerId },
    include: { user: true },
  })

  // Atualizar status
  await prisma.subscription.update({
    where: { id: subscription.id },
    data: { status: 'past_due' },
  })

  // Enviar notificação
  await sendEmail({
    to: subscription.user.email,
    subject: 'Pagamento não processado',
    body: 'Seu pagamento não foi processado. Por favor, atualize suas informações de pagamento.',
  })

  // Enviar notificação push
  await sendPushNotification(subscription.user.id, {
    title: 'Pagamento em atraso',
    body: 'Seu pagamento não foi processado. Atualize suas informações.',
  })
}
```

### 5. Trial Gratuito com Conversão Automática

```javascript
// Criar plano com trial
const checkoutSession = await stripe.checkout.sessions.create({
  customer: customerId,
  mode: 'subscription',
  line_items: [{ price: priceId, quantity: 1 }],
  subscription_data: {
    trial_period_days: 14, // 14 dias de teste
    trial_settings: {
      end_behavior: {
        missing_payment_method: 'cancel',
      },
    },
  },
  success_url: `${process.env.NEXTAUTH_URL}/dashboard?trial=true`,
})

// No webhook, detectar início do trial
async function handleTrialStarted(subscription) {
  if (subscription.status === 'trialing') {
    await prisma.subscription.update({
      where: { userId },
      data: {
        status: 'trialing',
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
    })

    // Enviar email de boas-vindas ao trial
    await sendTrialWelcomeEmail(userId, 14)
  }
}
```

### 6. Análise de Receita e Métricas

```javascript
import stripe from '@/lib/stripe'

export async function GET() {
  // Receita total do mês
  const charges = await stripe.charges.list({
    created: { gte: Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60 },
    limit: 100,
  })

  const totalRevenue = charges.data.reduce(
    (sum, charge) => sum + charge.amount,
    0
  )

  // Assinaturas ativas por plano
  const subscriptions = await stripe.subscriptions.list({
    status: 'active',
    limit: 100,
  })

  const subscriptionsByPlan = subscriptions.data.reduce((acc, sub) => {
    const plan = getPlanFromPriceId(sub.items.data[0].price.id)
    acc[plan] = (acc[plan] || 0) + 1
    return acc
  }, {})

  return Response.json({
    totalRevenue: totalRevenue / 100, // Converter centavos para reais
    currency: 'BRL',
    subscriptionsByPlan,
    totalSubscriptions: subscriptions.data.length,
  })
}
```

---

## 📞 Suporte

Para mais informações:

- [Documentação do Stripe](https://stripe.com/docs/api)
- [STRIPE_SETUP.md](./STRIPE_SETUP.md) - Configuração completa
- [STRIPE_INTEGRATION.md](./STRIPE_INTEGRATION.md) - Resumo da implementação

---

**Exemplos atualizados em: Março 2026**
