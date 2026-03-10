/**
 * Configuração Centralizada do Stripe
 *
 * Este arquivo gerencia toda a configuração do Stripe e verificações de ambiente.
 */

/**
 * Verifica se o Stripe está configurado corretamente
 */
export const isStripeConfigured = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY
  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY

  // Verifica se as chaves não estão vazias
  const hasValidSecretKey = secretKey && secretKey.length > 0 && secretKey !== '""'
  const hasValidPublishableKey = publishableKey && publishableKey.length > 0 && publishableKey !== '""'

  return hasValidSecretKey && hasValidPublishableKey
}

/**
 * Obtém configuração do Stripe ou null se não configurado
 */
export const getStripeConfig = () => {
  const stripe = require('stripe')

  if (!isStripeConfigured()) {
    console.warn('Stripe não está configurado. Configure STRIPE_SECRET_KEY e STRIPE_PUBLISHABLE_KEY no .env')
    return {
      stripe: null,
      configured: false,
      message: 'Sistema de pagamento não está configurado',
    }
  }

  try {
    return {
      stripe: new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2025-01-27.acacia',
        typescript: true,
      }),
      configured: true,
      message: 'Stripe configurado',
    }
  } catch (error) {
    console.error('Erro ao configurar Stripe:', error)
    return {
      stripe: null,
      configured: false,
      message: `Erro ao configurar Stripe: ${error.message}`,
    }
  }
}

/**
 * Verifica se o ambiente é de desenvolvimento/teste
 */
export const isDevelopment = () => {
  return process.env.NODE_ENV === 'development' || process.env.NODE_ENV !== 'production'
}

/**
 * Obtém a URL base da aplicação
 */
export const getBaseUrl = () => {
  return process.env.NEXTAUTH_URL || 'http://localhost:3000'
}

export default {
  isStripeConfigured,
  getStripeConfig,
  isDevelopment,
  getBaseUrl,
}
