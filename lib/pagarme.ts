/**
 * Integração Pagar.me v5 - Pix e Boleto
 * Documentação: https://docs.pagar.me/reference
 */

const PAGARME_BASE_URL = 'https://api.pagar.me/core/v5'

function getApiKey(): string {
  const key = process.env.PAGARME_API_KEY
  if (!key) throw new Error('PAGARME_API_KEY não configurada')
  return Buffer.from(`${key}:`).toString('base64')
}

async function pagarmeRequest(method: string, path: string, body?: unknown) {
  const res = await fetch(`${PAGARME_BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Basic ${getApiKey()}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.message || `Pagar.me error ${res.status}`)
  }
  return data
}

export interface CreatePixOrderParams {
  amount: number // centavos
  description: string
  customerName: string
  customerEmail: string
  customerDocument: string // CPF sem pontuação
  expiresInMinutes?: number
}

export async function createPixOrder(params: CreatePixOrderParams) {
  const {
    amount,
    description,
    customerName,
    customerEmail,
    customerDocument,
    expiresInMinutes = 30,
  } = params

  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000)

  const order = await pagarmeRequest('POST', '/orders', {
    items: [{ amount, description, quantity: 1, code: 'LINKBIO-ITEM' }],
    customer: {
      name: customerName,
      email: customerEmail,
      type: 'individual',
      document: customerDocument,
      document_type: 'CPF',
    },
    payments: [
      {
        payment_method: 'pix',
        pix: {
          expires_at: expiresAt.toISOString(),
          additional_information: [
            { name: 'Descrição', value: description },
          ],
        },
        amount,
      },
    ],
  })

  return {
    orderId: order.id,
    status: order.status,
    pixQrCode: order.charges?.[0]?.last_transaction?.qr_code,
    pixQrCodeUrl: order.charges?.[0]?.last_transaction?.qr_code_url,
    expiresAt: expiresAt.toISOString(),
  }
}

export interface CreateBoletoOrderParams {
  amount: number
  description: string
  customerName: string
  customerEmail: string
  customerDocument: string
  customerAddress: {
    line1: string
    line2?: string
    zip_code: string
    city: string
    state: string
    country?: string
  }
  dueDays?: number
}

export async function createBoletoOrder(params: CreateBoletoOrderParams) {
  const { amount, description, customerName, customerEmail, customerDocument, customerAddress, dueDays = 3 } = params

  const dueAt = new Date()
  dueAt.setDate(dueAt.getDate() + dueDays)

  const order = await pagarmeRequest('POST', '/orders', {
    items: [{ amount, description, quantity: 1, code: 'LINKBIO-ITEM' }],
    customer: {
      name: customerName,
      email: customerEmail,
      type: 'individual',
      document: customerDocument,
      document_type: 'CPF',
      address: {
        ...customerAddress,
        country: customerAddress.country || 'BR',
      },
    },
    payments: [
      {
        payment_method: 'boleto',
        boleto: {
          due_at: dueAt.toISOString(),
          instructions: 'Pagar até o vencimento. Não receber após o prazo.',
        },
        amount,
      },
    ],
  })

  return {
    orderId: order.id,
    status: order.status,
    boletoUrl: order.charges?.[0]?.last_transaction?.pdf,
    boletoBarcode: order.charges?.[0]?.last_transaction?.line,
    dueAt: dueAt.toISOString(),
  }
}

export async function getOrder(orderId: string) {
  return pagarmeRequest('GET', `/orders/${orderId}`)
}

export function verifyWebhookSignature(payload: string, signature: string): boolean {
  const secret = process.env.PAGARME_WEBHOOK_SECRET
  if (!secret) return false

  const crypto = require('crypto')
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(payload)
  const expected = hmac.digest('hex')
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
}
