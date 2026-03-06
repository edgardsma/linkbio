export async function GET() {
  const isStripeConfigured = !!process.env.STRIPE_SECRET_KEY

  return Response.json({
    stripeConfigured: isStripeConfigured,
    message: isStripeConfigured
      ? 'Stripe está configurado'
      : 'Stripe não está configurado. Configure STRIPE_SECRET_KEY para habilitar funcionalidades de pagamento.'
  })
}