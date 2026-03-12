> **Versão:** 1.0.0 | **Atualizado em:** 12/03/2026

---

# Webhooks do Stripe - Documentação de Implementação

## Visão Geral

Esta documentação descreve a implementação completa de webhooks do Stripe para o LinkBio Brasil, incluindo eventos processados, estrutura de código e boas práticas.

---

## Estrutura de Arquivos

```
C:\Projetos\linkbio-brasil\
├── app/api/webhooks/stripe/
│   └── route.js                    # Handler principal do webhook
├── app/api/subscription/
│   ├── checkout/route.js           # Criar checkout session
│   ├── portal/route.js             # Acessar portal do cliente
│   └── cancel/route.js             # Cancelar assinatura
├── lib/
│   ├── stripe-helpers.js           # Funções auxiliares Stripe
│   ├── stripe-config.js            # Configuração de preços e planos
│   └── webhook-logger.js          # Sistema de logging
├── docs/
│   └── STRIPE_SETUP.md            # Guia completo de configuração
└── scripts/
    └── test-stripe-webhook.js     # Script de teste
```

---

## Eventos Processados

### 1. checkout.session.completed

**Trigger**: Usuário completa o checkout com sucesso

**Ações Realizadas**:
- Busca usuário pelo customer ID ou email
- Obtém detalhes da subscription do Stripe
- Cria ou atualiza assinatura no banco
- Define status como 'active'
- Registra customer ID e price ID
- Define currentPeriodEnd
- Log de sucesso

**Dados Processados**:
```javascript
{
  id: "cs_abc123...",
  customer: "cus_xyz789...",
  customer_email: "user@example.com",
  subscription: "sub_def456...",
  mode: "subscription",
  payment_status: "paid"
}
```

---

### 2. invoice.paid

**Trigger**: Fatura é paga com sucesso

**Ações Realizadas**:
- Busca detalhes da subscription
- Atualiza currentPeriodEnd
- Renova assinatura
- Define status como 'active'
- Atualiza plan se necessário
- Log de sucesso

**Dados Processados**:
```javascript
{
  id: "in_abc123...",
  customer: "cus_xyz789...",
  subscription: "sub_def456...",
  paid: true,
  status: "paid"
}
```

---

### 3. invoice.payment_failed

**Trigger**: Pagamento da fatura falha

**Ações Realizadas**:
- Atualiza status para 'past_due'
- Log de sucesso
- TODO: Enviar email de notificação
- O Stripe tentará novamente após 3 dias

**Dados Processados**:
```javascript
{
  id: "in_abc123...",
  customer: "cus_xyz789...",
  subscription: "sub_def456...",
  paid: false,
  status: "open"
}
```

---

### 4. customer.subscription.updated

**Trigger**: Assinatura é atualizada

**Cenários**:
- Mudança de plano
- Alteração de preço
- Mudança no cancel_at_period_end
- Atualização de metadados

**Ações Realizadas**:
- Atualiza status da assinatura
- Atualiza plan se mudou
- Atualiza currentPeriodEnd
- Atualiza cancelAtPeriodEnd
- Log de sucesso

**Dados Processados**:
```javascript
{
  id: "sub_def456...",
  customer: "cus_xyz789...",
  status: "active",
  current_period_end: 1234567890,
  cancel_at_period_end: false,
  items: {
    data: [
      {
        price: {
          id: "price_abc123..."
        }
      }
    ]
  }
}
```

---

### 5. customer.subscription.deleted

**Trigger**: Assinatura é cancelada

**Ações Realizadas**:
- Atualiza status para 'canceled'
- Downgrade para plano FREE
- Define cancelAtPeriodEnd como true
- Log de sucesso
- TODO: Remover features premium

**Dados Processados**:
```javascript
{
  id: "sub_def456...",
  customer: "cus_xyz789...",
  status: "canceled",
  cancel_at_period_end: true
}
```

---

## Sistema de Logging

### Funções Disponíveis

```javascript
import {
  logWebhookSuccess,
  logWebhookError,
  logWebhookIgnored,
  notifyAdminsAboutError
} from '@/lib/webhook-logger'
```

### Exemplos de Uso

```javascript
// Log de sucesso
await logWebhookSuccess('checkout.session.completed', eventData)

// Log de erro
await logWebhookError('invoice.payment_failed', eventData, error)

// Log de evento ignorado
await logWebhookIgnored('invoice.paid', 'Fatura sem subscription')

// Notificar admins sobre erro crítico
await notifyAdminsAboutError(error, eventData)
```

### Formato do Log

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "eventType": "checkout.session.completed",
  "status": "success",
  "error": null,
  "data": {
    "id": "evt_abc123...",
    "objectId": "cs_def456...",
    "customerId": "cus_xyz789...",
    "subscriptionId": "sub_ghi012..."
  }
}
```

---

## Segurança

### Validação de Assinatura

```javascript
const event = stripe.webhooks.constructEvent(
  body,
  signature,
  process.env.STRIPE_WEBHOOK_SECRET
)
```

### Verificações Realizadas

1. Assinatura do webhook está presente no header
2. Assinatura é válida usando STRIPE_WEBHOOK_SECRET
3. Evento é do tipo esperado
4. Customer ID pertence ao usuário

---

## Boas Práticas

### 1. Retorno Imediato

Sempre retorne `200` o mais rápido possível para evitar que o Stripe retente o webhook:

```javascript
// Retornar 200 imediatamente
return NextResponse.json({ received: true }, { status: 200 })

// Processar de forma assíncrona
processEvent(event).catch((error) => {
  // Tratar erro
})
```

### 2. Tratamento de Erros

Nunca retorne erro para o Stripe a menos que seja uma falha de autenticação:

```javascript
try {
  await processEvent(event)
  return NextResponse.json({ received: true })
} catch (error) {
  logError(error)
  notifyAdmins(error)
  return NextResponse.json({ received: true }) // Ainda retornar 200
}
```

### 3. Processamento Idempotente

Evite processar o mesmo evento duas vezes:

```javascript
// TODO: Verificar se evento já foi processado
const existingLog = await prisma.webhookLog.findFirst({
  where: {
    eventType,
    'data.id': eventId,
    status: 'success'
  }
})

if (existingLog) {
  return // Já processado
}
```

### 4. Transações de Banco

Use transações para garantir consistência:

```javascript
await prisma.$transaction(async (tx) => {
  await tx.subscription.update(...)
  await tx.user.update(...)
  // Se um falhar, nenhum é executado
})
```

---

## Testando Webhooks

### Usando Stripe CLI

```bash
# Instalar Stripe CLI
npm install -g stripe-cli

# Login
stripe login

# Encaminhar eventos para localhost
stripe forward http://localhost:3000/api/webhooks/stripe \
  --events checkout.session.completed \
  --events invoice.paid \
  --events invoice.payment_failed \
  --events customer.subscription.updated \
  --events customer.subscription.deleted
```

### Usando Script de Teste

```bash
# Listar preços disponíveis
node scripts/test-stripe-webhook.js prices

# Criar checkout session
node scripts/test-stripe-webhook.js checkout test@example.com price_abc123

# Listar webhooks
node scripts/test-stripe-webhook.js webhooks
```

### Cartões de Teste

**Sucesso**: `4242 4242 4242 4242`
**Falha**: `4000 0000 0000 9995`
**Autenticação 3D**: `4000 0025 0000 3155`

---

## Monitoramento

### Logs Importantes

```bash
# Verificar todos os logs de webhook
grep '[Webhook]' logs/app.log

# Verificar erros de webhook
grep '[Webhook] Error' logs/app.log

# Verificar eventos específicos
grep 'checkout.session.completed' logs/app.log
```

### Métricas para Monitorar

- Taxa de sucesso de eventos
- Tempo de processamento de eventos
- Erros por tipo de evento
- Eventos não processados
- Retries do Stripe

---

## Troubleshooting

### Evento não chega

**Verificações**:
1. Webhook está ativo no dashboard do Stripe?
2. URL do webhook está correta?
3. STRIPE_WEBHOOK_SECRET está configurado?
4. Firewall não está bloqueando?

### Evento processado mas banco não atualizado

**Verificações**:
1. Logs de erro no webhook?
2. Customer ID existe no banco?
3. Tem erro de validação?
4. Conexão com banco está funcionando?

### Assinatura fica como 'past_due'

**Causas Comuns**:
1. Pagamento falhou
2. Cartão expirado
3. Fundos insuficientes

**Soluções**:
1. Usuário atualizar método de pagamento no portal
2. O Stripe tentará novamente após 3 dias
3. Enviar email para usuário atualizar

---

## Próximos Passos

### Funcionalidades Futuras

1. **Email Notifications**
   - Boas-vindas após checkout
   - Falha de pagamento
   - Renovação de assinatura
   - Cancelamento

2. **Webhook Dashboard**
   - Visualizar eventos recebidos
   - Status de processamento
   - Reenviar eventos

3. **Advanced Events**
   - `invoice.payment_action_required`
   - `customer.subscription.trial_will_end`
   - `invoice.upcoming`

4. **Analytics**
   - Taxa de conversão
   - Churn rate
   - LTV (Lifetime Value)

---

## Recursos

- [Stripe Webhooks Docs](https://stripe.com/docs/webhooks)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Webhooks Best Practices](https://stripe.com/docs/webhooks/best-practices)
- [Test Webhooks Locally](https://stripe.com/docs/webhooks/test)

---

## Suporte

Para problemas com webhooks:

1. Verifique os logs no console
2. Use Stripe CLI para testar localmente
3. Consulte a documentação do Stripe
4. Entre em contato com a equipe de desenvolvimento
