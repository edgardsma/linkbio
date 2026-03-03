# Integração com Stripe - Guia Completo

Este guia explica como configurar e utilizar o sistema de pagamentos com Stripe no LinkBio Brasil.

## Índice

1. [Visão Geral](#visão-geral)
2. [Configuração Inicial](#configuração-inicial)
3. [Criando Preços no Stripe](#criando-preços-no-stripe)
4. [Configurando Webhooks](#configurando-webhooks)
5. [API Endpoints](#api-endpoints)
6. [Eventos de Webhook](#eventos-de-webhook)
7. [Uso no Frontend](#uso-no-frontend)
8. [Testando a Integração](#testando-a-integração)

---

## Visão Geral

O sistema de pagamentos do LinkBio Brasil utiliza Stripe para processar assinaturas mensais e anuais. A integração inclui:

- Webhooks para processamento automático de eventos
- Sistema de planos (FREE, STARTER, PRO, ENTERPRISE)
- Limites de funcionalidades por plano
- Portal de gestão de assinaturas
- Checkout de pagamento

---

## Configuração Inicial

### 1. Obter Chaves do Stripe

1. Acesse [Stripe Dashboard](https://dashboard.stripe.com/)
2. Faça login ou crie uma conta
3. Vá em "Developers" > "API keys"
4. Copie as chaves necessárias:
   - **Publishable key**: Para usar no frontend
   - **Secret key**: Para usar no backend
   - **Webhook secret**: Após configurar webhook

### 2. Configurar Variáveis de Ambiente

Adicione as seguintes variáveis ao seu arquivo `.env`:

```env
# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

> **Nota**: Use as chaves de teste (`_test_`) durante o desenvolvimento e chaves de produção (`_live_`) quando colocar em produção.

---

## Criando Preços no Stripe

### Passo 1: Criar Produtos

1. Acesse [Stripe Products](https://dashboard.stripe.com/products)
2. Clique em "Add product"
3. Para cada plano, crie um produto:

#### Plano STARTER
```
Name: LinkBio Starter
Description: Para criadores em crescimento
Image: (opcional)
```

#### Plano PRO
```
Name: LinkBio Pro
Description: Para profissionais
Image: (opcional)
```

#### Plano ENTERPRISE
```
Name: LinkBio Enterprise
Description: Para grandes negócios
Image: (opcional)
```

### Passo 2: Criar Preços

Para cada produto, crie preços mensais e anuais:

#### Exemplo para STARTER:
- **Preço Mensal**: R$ 19,90/mês
  - Currency: BRL
  - Recurring: Monthly
  - Copie o Price ID (ex: `price_1abc123xyz`)
  - Atualize em `lib/stripe-config.js`

- **Preço Anual**: R$ 199,90/ano
  - Currency: BRL
  - Recurring: Yearly
  - Copie o Price ID
  - Atualize em `lib/stripe-config.js`

### Passo 3: Atualizar Configuração

Edite o arquivo `lib/stripe-config.js`:

```javascript
export const STRIPE_PRICES = {
  starter: {
    monthly: 'price_1ABC...', // Substitua com price ID real
    yearly: 'price_1DEF...',  // Substitua com price ID real
  },
  pro: {
    monthly: 'price_1GHI...', // Substitua com price ID real
    yearly: 'price_1JKL...',  // Substitua com price ID real
  },
  enterprise: {
    monthly: 'price_1MNO...', // Substitua com price ID real
    yearly: 'price_1PQR...',  // Substitua com price ID real
  },
}
```

---

## Configurando Webhooks

### Passo 1: Criar Webhook no Stripe

1. Acesse [Stripe Webhooks](https://dashboard.stripe.com/webhooks)
2. Clique em "Add endpoint"
3. Configure:
   - **Endpoint URL**: `https://seu-dominio.com/api/webhooks/stripe`
     - Em desenvolvimento: `http://localhost:3000/api/webhooks/stripe`
   - **Events to send**: Selecione os eventos abaixo

### Passo 2: Selecionar Eventos

Selecione os seguintes eventos para serem enviados:

```
✓ checkout.session.completed
✓ invoice.paid
✓ invoice.payment_failed
✓ customer.subscription.updated
✓ customer.subscription.deleted
```

### Passo 3: Obter Webhook Secret

1. Após criar o webhook, o Stripe mostrará um "Signing secret"
2. Clique em "Reveal" para ver o secret
3. Copie o valor (começa com `whsec_`)
4. Adicione ao `.env`:

```env
STRIPE_WEBHOOK_SECRET="whsec_..."
```

### Passo 4: Testar Webhook (Desenvolvimento)

Para testar webhooks em desenvolvimento, use a CLI do Stripe:

```bash
# Instalar Stripe CLI
npm install -g stripe-cli

# Login no Stripe
stripe login

# Encaminhar eventos para localhost
stripe forward http://localhost:3000/api/webhooks/stripe \
  --events checkout.session.completed \
  --events invoice.paid \
  --events invoice.payment_failed \
  --events customer.subscription.updated \
  --events customer.subscription.deleted
```

---

## API Endpoints

### 1. Criar Sessão de Checkout

**Endpoint**: `POST /api/subscription/checkout`

**Request Body**:
```json
{
  "priceId": "price_1ABC...",
  "successUrl": "https://seu-dominio.com/dashboard?success",
  "cancelUrl": "https://seu-dominio.com/pricing?canceled"
}
```

**Response**:
```json
{
  "url": "https://checkout.stripe.com/c/pay/...",
  "sessionId": "cs_abc123..."
}
```

### 2. Obter Informações da Assinatura

**Endpoint**: `GET /api/subscription/checkout`

**Response**:
```json
{
  "plan": "PRO",
  "status": "active",
  "stripeStatus": "active",
  "cancelAtPeriodEnd": false,
  "currentPeriodEnd": "2024-12-31T23:59:59.999Z",
  "limits": {
    "links": 50,
    "themes": ["default", "modern", "minimal", "bold", "elegant"],
    "analytics": true,
    "customDomain": true
  }
}
```

### 3. Acessar Portal do Cliente

**Endpoint**: `POST /api/subscription/portal`

**Request Body**:
```json
{
  "returnUrl": "https://seu-dominio.com/dashboard"
}
```

**Response**:
```json
{
  "url": "https://billing.stripe.com/session/..."
}
```

### 4. Cancelar Assinatura

**Endpoint**: `POST /api/subscription/cancel`

**Response**:
```json
{
  "success": true,
  "message": "Assinatura cancelada com sucesso",
  "willEndAt": "2024-12-31T23:59:59.999Z"
}
```

### 5. Webhook do Stripe

**Endpoint**: `POST /api/webhooks/stripe`

**Headers**:
- `stripe-signature`: Assinatura do webhook do Stripe

---

## Eventos de Webhook

### checkout.session.completed

**Quando**: Usuário completa o checkout com sucesso

**Ações**:
- Cria ou atualiza assinatura no banco
- Define status como 'active'
- Registra customer ID e price ID do Stripe
- Define currentPeriodEnd

### invoice.paid

**Quando**: Fatura é paga com sucesso

**Ações**:
- Atualiza currentPeriodEnd
- Renova assinatura
- Define status como 'active'

### invoice.payment_failed

**Quando**: Pagamento da fatura falha

**Ações**:
- Define status como 'past_due'
- Envia email de notificação (TODO)
- O Stripe tentará novamente após 3 dias

### customer.subscription.updated

**Quando**: Assinatura é atualizada (mudança de plano, etc.)

**Ações**:
- Atualiza detalhes da assinatura
- Verifica mudanças de plano
- Atualiza status e currentPeriodEnd

### customer.subscription.deleted

**Quando**: Assinatura é cancelada

**Ações**:
- Define status como 'canceled'
- Downgrade para plano FREE
- Remove features premium (TODO)

---

## Uso no Frontend

### Criar Checkout Session

```javascript
async function createCheckoutSession(priceId) {
  const response = await fetch('/api/subscription/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      priceId,
      successUrl: `${window.location.origin}/dashboard?success`,
      cancelUrl: `${window.location.origin}/pricing?canceled`,
    }),
  })

  const { url } = await response.json()

  // Redirecionar para o checkout do Stripe
  window.location.href = url
}
```

### Obter Plano Atual

```javascript
async function getCurrentSubscription() {
  const response = await fetch('/api/subscription/checkout')
  const subscription = await response.json()

  console.log('Plano:', subscription.plan)
  console.log('Status:', subscription.status)
  console.log('Limites:', subscription.limits)
}
```

### Acessar Portal de Gestão

```javascript
async function openCustomerPortal() {
  const response = await fetch('/api/subscription/portal', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      returnUrl: `${window.location.origin}/dashboard`,
    }),
  })

  const { url } = await response.json()

  // Redirecionar para o portal do Stripe
  window.location.href = url
}
```

### Cancelar Assinatura

```javascript
async function cancelSubscription() {
  if (!confirm('Tem certeza que deseja cancelar?')) {
    return
  }

  const response = await fetch('/api/subscription/cancel', {
    method: 'POST',
  })

  const data = await response.json()

  if (data.success) {
    alert(`Assinatura cancelada. Vai até ${data.willEndAt}`)
  }
}
```

---

## Testando a Integração

### Teste com Cartão de Teste

O Stripe fornece números de cartão de teste:

**Para Pagamento com Sucesso**:
```
Número: 4242 4242 4242 4242
Data de expiração: Qualquer data futura
CVC: Qualquer 3 dígitos
CEP: Qualquer CEP válido
```

**Para Falha de Pagamento**:
```
Número: 4000 0000 0000 9995
```

**Para Pagamento Exigindo Autenticação 3D**:
```
Número: 4000 0025 0000 3155
```

### Teste de Webhook

1. Use a CLI do Stripe para encaminhar eventos
2. Crie uma sessão de checkout
3. Use o cartão de teste 4242...
4. Observe os logs do console
5. Verifique se a assinatura foi criada no banco

### Teste de Limites

1. Crie uma conta com plano FREE
2. Tente adicionar mais de 5 links (deve falhar)
3. Crie checkout para plano STARTER
4. Complete o pagamento
5. Tente adicionar mais links (deve permitir até 15)

---

## Solução de Problemas

### Webhook não está recebendo eventos

**Possíveis causas**:
1. URL do webhook está incorreta
2. Webhook secret não está configurado
3. Firewall bloqueando requisições

**Solução**:
1. Verifique a URL no dashboard do Stripe
2. Confirme STRIPE_WEBHOOK_SECRET no .env
3. Use stripe-cli para testar localmente

### Assinatura não está sendo criada

**Possíveis causas**:
1. Customer ID não está sendo salvo
2. User não encontrado no banco

**Solução**:
1. Verifique logs do webhook
2. Confirme que customer tem email associado
3. Verifique mapeamento de price IDs

### Pagamento falha mas assinatura fica ativa

**Possíveis causas**:
1. Evento `invoice.payment_failed` não configurado
2. Status não está sendo atualizado

**Solução**:
1. Confirme que evento está selecionado no webhook
2. Verifique handler de `invoice.payment_failed`

---

## Próximos Passos

### Funcionalidades Opcionais

1. **Email Notifications**
   - Email de boas-vindas após checkout
   - Email de falha de pagamento
   - Email de downgrade

2. **Trial Periods**
   - Período de teste gratuito
   - Webhook `customer.subscription.trial_will_end`

3. **Coupons e Discounts**
   - Códigos promocionais
   - Descontos personalizados

4. **Multiple Subscriptions**
   - Permite múltiplas assinaturas por usuário

5. **Usage-Based Billing**
   - Cobrança baseada em uso (ex: clicks)

---

## Recursos Adicionais

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)
- [Next.js + Stripe Guide](https://stripe.com/docs/payments/quickstart)

---

## Suporte

Para dúvidas ou problemas com a integração:

1. Consulte a [Documentação do Stripe](https://stripe.com/docs)
2. Verifique os logs do webhook no console
3. Entre em contato com a equipe de desenvolvimento
