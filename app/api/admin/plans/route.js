export async function GET() {
  const plans = [
    {
      id: 'FREE',
      name: 'Free',
      price: 0,
      currency: 'BRL',
      features: ['5 links', 'Página básica', 'Analytics básico'],
      limits: { links: 5 },
    },
    {
      id: 'STARTER',
      name: 'Starter',
      price: 1990,
      currency: 'BRL',
      features: ['20 links', 'Temas premium', 'Analytics avançado', 'QR Code'],
      limits: { links: 20 },
    },
    {
      id: 'PRO',
      name: 'Pro',
      price: 3990,
      currency: 'BRL',
      features: [
        'Links ilimitados',
        'Agendamento',
        'Captura de leads',
        'Domínio personalizado',
        'Integrações',
      ],
      limits: { links: -1 },
    },
    {
      id: 'PREMIUM',
      name: 'Premium',
      price: 7990,
      currency: 'BRL',
      features: [
        'Tudo do Pro',
        'Multi-usuário',
        'API access',
        'Suporte prioritário',
        'White-label',
      ],
      limits: { links: -1 },
    },
  ]

  return Response.json(plans)
}
