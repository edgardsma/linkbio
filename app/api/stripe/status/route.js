import { getStripeConfig } from '@/lib/stripe-config'

export async function GET() {
  const config = getStripeConfig()

  return Response.json({
    stripeConfigured: config.configured,
    message: config.message,
    development: process.env.NODE_ENV === 'development',
  })
}
