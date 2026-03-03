# Integração Stripe - LinkBio Brasil

Documentação completa para configurar e usar a integração com Stripe no projeto LinkBio Brasil.

## 📋 Visão Geral

Esta integração permite:
- Criar sessões de checkout para assinaturas
- Gerenciar portal de faturamento para clientes
- Processar webhooks do Stripe
- Controlar acesso baseado em planos
- Verificar limites de features por plano

## 🔧 Configuração Inicial

### 1. Obter Credenciais do Stripe

1. Acesse [Stripe Dashboard](https://dashboard.stripe.com/)
2. Criar uma conta ou fazer login
3. Vá em **Developers** > **API keys**
4. Copie a **Secret Key** (começa com `sk_test_` para testes ou `sk_live_` para produção)

### 2. Criar Produtos e Preços

#### Planos Disponíveis

**STARTER**
- Mensal: R$ 19,90
- Anual: R$ 199,00

**PRO**
- Mensal: R$ 49,90
- Anual: R$ 499,00

**PREMIUM**
- Mensal: R$ 99,90
- Anual: R$ 999,00

#### Passo a Passo para Criar Preços

1. No Stripe Dashboard, vá em **Products** > **Add product**
2. Para cada plano, crie um produto e adicione dois preços (mensal e anual)
3. Configure os preços em BRL (Real Brasileiro)
4. Anote os **Price IDs** (começam com `price_`)

Exemplo de configuração:
```
Produto: Starter
  - Preço Mensal: price_xxxxxxxxxxxxx (R$ 19,90/mês)
  - Preço Anual:  price_xxxxxxxxxxxxx (R$ 199,00/ano)

Produto: Pro
  - Preço Mensal: price_xxxxxxxxxxxxx (R$ 49,90/mês)
  - Preço Anual:  price_xxxxxxxxxxxxx (R$ 499,00/ano)

Produto: Premium
  - Preço Mensal: price_xxxxxxxxxxxxx (R$ 99,90/mês)
  - Preço Anual:  price_xxxxxxxxxxxxx (R$ 999,00/ano)
```

### 3. Configurar Webhook

1. No Stripe Dashboard, vá em **Developers** > **Webhooks**
2. Clique em **Add endpoint**
3. URL: `https://seu-dominio.com/api/stripe/webhook`
   - Em desenvolvimento: `http://localhost:3000/api/stripe/webhook`
4. Selecione os eventos:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copie o **Signing Secret** (começa com `whsec_`)

### 4. Configurar Variáveis de Ambiente

Adicione ao seu arquivo `.env`:

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Price IDs (substitua pelos seus IDs reais)
STRIPE_PRICE_STARTER_MONTHLY=price_xxxxxxxxxxxxx
STRIPE_PRICE_STARTER_ANNUAL=price_xxxxxxxxxxxxx
STRIPE_PRICE_PRO_MONTHLY=price_xxxxxxxxxxxxx
STRIPE_PRICE_PRO_ANNUAL=price_xxxxxxxxxxxxx
STRIPE_PRICE_PREMIUM_MONTHLY=price_xxxxxxxxxxxxx
STRIPE_PRICE_PREMIUM_ANNUAL=price_xxxxxxxxxxxxx
```

**IMPORTANTE**: Nunca commit o arquivo `.env` com chaves reais!

## 🚀 API Endpoints

### 1. Criar Sessão de Checkout

**Endpoint:** `POST /api/stripe/checkout`

**Body:**
```json
{
  "plan": "pro",
  "billingCycle": "monthly"
}
```

**Resposta de Sucesso:**
```json
{
  "url": "https://checkout.stripe.com/...",
  "sessionId": "cs_xxxxxxxxxxxxx"
}
```

**Resposta de Erro:**
```json
{
  "error": "Mensagem de erro",
  "details": "Detalhes adicionais"
}
```

**Planos disponíveis:** `starter`, `pro`, `premium`
**Ciclos de faturamento:** `monthly`, `annual`

### 2. Portal de Faturamento

**Endpoint:** `POST /api/stripe/portal`

**Body:** Não necessário (usa sessão do usuário)

**Resposta de Sucesso:**
```json
{
  "url": "https://billing.stripe.com/...",
  "hasSubscription": true
}
```

### 3. Obter Informações dos Planos

**Endpoint:** `GET /api/stripe/checkout`

**Resposta:**
```json
{
  "plans": {
    "starter": { ... },
    "pro": { ... },
    "premium": { ... }
  }
}
```

### 4. Obter Status da Assinatura

**Endpoint:** `GET /api/stripe/portal`

**Resposta:**
```json
{
  "hasSubscription": true,
  "subscription": {
    "id": "sub_xxxxxxxxxxxxx",
    "status": "active",
    "plan": "pro",
    "stripePriceId": "price_xxxxxxxxxxxxx",
    "currentPeriodEnd": "2026-04-03T00:00:00.000Z",
    "cancelAtPeriodEnd": false,
    "stripeDetails": { ... }
  }
}
```

### 5. Webhook do Stripe

**Endpoint:** `POST /api/stripe/webhook`

Este endpoint processa automaticamente os eventos do Stripe e atualiza o banco de dados.

## 📚 Bibliotecas Utilitárias

### stripe.js (`lib/stripe.js`)

Configurações e constantes do Stripe:

```javascript
import stripe, { PLANS, getPlanById, isPremiumPlan } from '@/lib/stripe'

// Obter informações de um plano
const plan = getPlanById('pro')

// Verificar se é plano premium
const isPremium = isPremiumPlan('pro') // true

// Verificar permissões
stripe.hasPermission('pro', 'apiAccess') // false
stripe.hasPermission('premium', 'apiAccess') // true
```

### subscription.js (`lib/subscription.js`)

Funções para verificar status de assinaturas:

```javascript
import {
  getUserSubscription,
  hasActiveSubscription,
  hasReachedLinkLimit,
  canUserAddLinks,
  getUserPlan,
  getUserPlanInfo,
  hasFeatureAccess
} from '@/lib/subscription'

// Buscar assinatura do usuário
const sub = await getUserSubscription(userId)

// Verificar se tem assinatura ativa
const isActive = await hasActiveSubscription(userId)

// Verificar se atingiu limite de links
const reached = await hasReachedLinkLimit(userId)

// Verificar se pode adicionar links
const canAdd = await canUserAddLinks(userId)

// Obter plano atual
const plan = await getUserPlan(userId)

// Obter informações completas do plano
const planInfo = await getUserPlanInfo(userId)

// Verificar acesso a feature específica
const hasAccess = await hasFeatureAccess(userId, 'customDomain')
```

## 🎨 Componentes

### SubscriptionBadge (`components/SubscriptionBadge.js`)

Badge para exibir o plano do usuário:

```jsx
import SubscriptionBadge from '@/components/SubscriptionBadge'

<SubscriptionBadge plan="pro" status="active" />
```

## 🔒 Segurança

### Validações Implementadas

1. **Autenticação**: Todos os endpoints verificam a sessão do usuário
2. **Plano Duplicado**: Impede criar assinatura do mesmo plano ativo
3. **Webhook Signature**: Valida todas as requisições de webhook
4. **Price ID Validation**: Verifica se o plano existe antes de criar checkout

### Melhores Práticas

1. Nunca exponha a `STRIPE_SECRET_KEY` no frontend
2. Use `STRIPE_WEBHOOK_SECRET` para validar webhooks
3. Verifique `NEXTAUTH_SECRET` está configurado em produção
4. Use variáveis de ambiente para todos os dados sensíveis
5. Implemente rate limiting em produção

## 📊 Fluxo de Pagamento

### 1. Usuário escolhe plano

Frontend faz POST para `/api/stripe/checkout`:
```javascript
const response = await fetch('/api/stripe/checkout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    plan: 'pro',
    billingCycle: 'monthly'
  })
})

const { url } = await response.json()
window.location.href = url
```

### 2. Checkout Stripe

Usuário é redirecionado para o checkout do Stripe, preenche os dados e paga.

### 3. Webhook processa pagamento

Stripe envia eventos para `/api/stripe/webhook`:
- `checkout.session.completed`: Salva customer ID
- `customer.subscription.created`: Cria assinatura no banco
- `invoice.payment_succeeded`: Atualiza período de renovação

### 4. Redirecionamento

Usuário é redirecionado de volta para `/dashboard?session_id=...`

### 5. Gestão de assinatura

Usuário pode acessar `/api/stripe/portal` para:
- Cancelar assinatura
- Alterar plano
- Atualizar método de pagamento
- Ver histórico de pagamentos

## 🧪 Testes

### Testar Webhooks Localmente

Use a CLI do Stripe para encaminhar webhooks para localhost:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Isso vai gerar um webhook secret de teste que você pode usar localmente.

### Testar com Modo Teste

1. Use as chaves de teste (`sk_test_`)
2. Use números de cartão de teste do Stripe:
   - Sucesso: `4242 4242 4242 4242`
   - Falha: `4000 0000 0000 0002`
   - Expirado: `4000 0000 0000 0069`

## 📈 Monitoramento

### Eventos Importantes

- **checkout.session.completed**: Novo checkout completado
- **customer.subscription.created**: Assinatura criada
- **customer.subscription.updated**: Assinatura atualizada
- **customer.subscription.deleted**: Assinatura cancelada
- **invoice.payment_succeeded**: Pagamento bem-sucedido
- **invoice.payment_failed**: Pagamento falhou

### Logs

Todos os eventos do webhook são logados no console. Em produção, considere usar um serviço de logs como Sentry ou LogRocket.

## 🔄 Atualização de Planos

O sistema suporta upgrades e downgrades automáticos:

1. Usuário acessa checkout de novo plano
2. Stripe ajusta a assinatura automaticamente
3. Webhook `customer.subscription.updated` atualiza o banco
4. Novos limites são aplicados imediatamente

## ❓ Troubleshooting

### Erro: "Assinatura do webhook inválida"

Verifique se `STRIPE_WEBHOOK_SECRET` está correto no `.env`

### Erro: "Price ID não encontrado"

Verifique se os Price IDs estão configurados corretamente no `.env`

### Webhook não está sendo recebido

1. Verifique se o endpoint está acessível
2. Use `stripe listen` para testar localmente
3. Verifique os logs do Stripe Dashboard

### Assinatura não está ativa no banco

1. Verifique se o webhook foi processado
2. Confirme que o customer ID foi salvo
3. Verifique os logs do servidor

## 📞 Suporte

Para problemas com a integração do Stripe:

1. Verifique os logs do console
2. Consulte o [Stripe Dashboard](https://dashboard.stripe.com/)
3. Revise a [documentação do Stripe](https://stripe.com/docs/api)
4. Verifique os eventos de webhook no Dashboard

## 📝 Próximos Passos

- [ ] Adicionar páginas de pricing no frontend
- [ ] Implementar trial gratuito
- [ ] Adicionar cupons de desconto
- [ ] Implementar notificações de pagamento
- [ ] Adicionar dashboard de analytics financeiro
- [ ] Implementar exportação de dados de faturamento
