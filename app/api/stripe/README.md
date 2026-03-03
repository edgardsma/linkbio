# API de Stripe

Endpoints para integração com pagamentos via Stripe.

## Endpoints

### POST /api/stripe/checkout

Criar uma sessão de checkout para assinatura.

**Request:**
- Method: POST
- Content-Type: application/json
- Auth: Obrigatório

**Body:**
```json
{
  "priceId": "price_xxx",
  "userId": "clxxx"
}
```

**Response (200):**
```json
{
  "url": "https://checkout.stripe.com/c/pay/...",
  "sessionId": "cs_xxx"
}
```

### POST /api/stripe/portal

Criar um link para o portal do cliente Stripe.

**Request:**
- Method: POST
- Content-Type: application/json
- Auth: Obrigatório

**Body:**
```json
{
  "customerId": "cus_xxx"
}
```

**Response (200):**
```json
{
  "url": "https://billing.stripe.com/..."
}
```

### POST /api/stripe/webhooks

Webhook para receber eventos do Stripe.

**Request:**
- Method: POST
- Content-Type: application/json
- Headers: `Stripe-Signature`

**Eventos Tratados:**
- `checkout.session.completed`
- `invoice.paid`
- `customer.subscription.updated`
- `customer.subscription.deleted`

## Implementação Pendente

Para implementar a integração completa com Stripe:

1. Instalar o Stripe SDK: `npm install stripe`
2. Configurar chaves no `.env`:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `STRIPE_PUBLISHABLE_KEY`
3. Criar produtos e preços no Dashboard do Stripe
4. Implementar endpoints de checkout e portal
5. Implementar webhook handler
6. Atualizar plano do usuário após pagamento

## Configuração de Preços

| Plano | Price ID | Preço |
|-------|----------|-------|
| STARTER | price_xxx | R$ 19,90/mês |
| PRO | price_xxx | R$ 49,90/mês |
| PREMIUM | price_xxx | R$ 99,90/mês |

## Exemplo de Código

```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request: Request) {
  const { priceId, userId } = await request.json();

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXTAUTH_URL}/dashboard?success=true`,
    cancel_url: `${process.env.NEXTAUTH_URL}/dashboard?canceled=true`,
    client_reference_id: userId,
  });

  return Response.json({ url: session.url });
}
```

## Documentação Stripe

- [Stripe Checkout](https://stripe.com/docs/payments/checkout)
- [Stripe Subscriptions](https://stripe.com/docs/billing/subscriptions)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
