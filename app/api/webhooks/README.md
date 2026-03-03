# API de Webhooks

Endpoints para receber e processar webhooks de terceiros (Stripe, etc.).

## Webhooks Suportados

### Stripe Webhooks

**Endpoint:** `POST /api/webhooks/stripe`

**Eventos Tratados:**

| Evento | Descrição |
|--------|-----------|
| `checkout.session.completed` | Checkout finalizado com sucesso |
| `invoice.paid` | Fatura paga |
| `invoice.payment_failed` | Falha no pagamento |
| `customer.subscription.created` | Assinatura criada |
| `customer.subscription.updated` | Assinatura atualizada |
| `customer.subscription.deleted` | Assinatura cancelada |
| `customer.subscription.paused` | Assinatura pausada |

### Outros Webhooks (Futuros)

- Email providers (SendGrid, Mailgun)
- Analytics (Google Analytics)
- CRM (HubSpot, Salesforce)

## Requisição de Webhook

**Headers:**
```
Content-Type: application/json
Stripe-Signature: t=timestamp,v1=signature
```

**Body Exemplo:**
```json
{
  "id": "evt_xxx",
  "object": "event",
  "api_version": "2020-08-27",
  "created": 1679877600,
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_xxx",
      "object": "checkout.session",
      "amount_total": 1990,
      "currency": "brl",
      "customer": "cus_xxx",
      "subscription": "sub_xxx",
      "client_reference_id": "user_id_here"
    }
  }
}
```

## Implementação Pendente

Para implementar:

1. Criar `app/api/webhooks/stripe/route.js` ou `route.ts`
2. Configurar `STRIPE_WEBHOOK_SECRET` no `.env`
3. Validar assinatura do webhook
4. Processar eventos relevantes
5. Atualizar banco de dados
6. Retornar status 200

## Exemplo de Código

```typescript
import Stripe from 'stripe';
import { headers } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: Request) {
  const body = await request.text();
  const signature = headers().get('stripe-signature') || '';

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    return Response.json({ error: 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id;

      // Atualizar plano do usuário
      await prisma.subscription.update({
        where: { userId },
        data: {
          stripeCustomerId: session.customer as string,
          status: 'active',
        },
      });
      break;

    case 'customer.subscription.updated':
      const subscription = event.data.object as Stripe.Subscription;
      // Atualizar detalhes da assinatura
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return Response.json({ received: true });
}
```

## Configuração no Stripe

1. Acesse o Dashboard do Stripe
2. Vá em Developers > Webhooks
3. Adicione um webhook endpoint
4. URL: `https://seu-dominio.com/api/webhooks/stripe`
5. Selecione os eventos que deseja receber
6. Copie o `Signing Secret` e adicione ao `.env`

## Boas Práticas

1. **Validar assinatura** para evitar webhooks falsos
2. **Processar eventos assincronamente** para não bloquear
3. **Retornar 200 rápido** e processar depois
4. **Usar idempotência** para evitar processamento duplicado
5. **Log todos os eventos** para debug
6. **Implementar retry** em caso de falha

## Debugging

```typescript
// Log de todos os eventos
console.log('Webhook received:', event.type, event.id);

// Log de dados (com cuidado com dados sensíveis)
console.log('Webhook data:', JSON.stringify(event.data.object, null, 2));
```

## Monitoramento

- Monitorar webhooks que falharam no Dashboard do Stripe
- Implementar alertas para eventos críticos
- Criar dashboard para visualizar eventos recebidos

## Documentação Stripe

- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks/guide)
