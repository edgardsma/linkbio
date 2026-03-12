/**
 * Integração RD Station Marketing - captura de leads
 * Usa a API de Conversões (não requer OAuth para conversões básicas)
 * Requer: RDSTATION_TOKEN no .env (token público da conta)
 */
export async function POST(request) {
  const { email, name, phone, tags, customFields } = await request.json()

  if (!email) {
    return Response.json({ error: 'E-mail é obrigatório' }, { status: 400 })
  }

  const token = process.env.RDSTATION_TOKEN
  if (!token) {
    return Response.json({ error: 'Configure RDSTATION_TOKEN no .env' }, { status: 503 })
  }

  try {
    const nameParts = (name || '').split(' ')

    const conversionData = {
      event_type: 'CONVERSION',
      event_family: 'CDP',
      payload: {
        conversion_identifier: 'linkbio-lead',
        email: email.toLowerCase().trim(),
        name: name || undefined,
        mobile_phone: phone || undefined,
        tags: tags || ['linkbio'],
        personal_phone: phone || undefined,
        ...customFields,
      },
    }

    const res = await fetch(
      `https://api.rd.services/platform/events?api_key=${token}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(conversionData),
      }
    )

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      throw new Error(errData.message || `RD Station error ${res.status}`)
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error('[rdstation] Erro:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

// Verificar conexão
export async function GET() {
  const token = process.env.RDSTATION_TOKEN
  if (!token) {
    return Response.json({ connected: false, error: 'RDSTATION_TOKEN não configurado' })
  }
  return Response.json({ connected: true, token: `${token.slice(0, 8)}...` })
}
