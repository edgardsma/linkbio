import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

/**
 * Integração Mailchimp - adiciona lead à lista
 * Requer: MAILCHIMP_API_KEY e MAILCHIMP_LIST_ID no .env
 * O API_KEY tem o formato: key-us1 (sufixo é o datacenter)
 */

function getMailchimpConfig() {
  const apiKey = process.env.MAILCHIMP_API_KEY
  const listId = process.env.MAILCHIMP_LIST_ID

  if (!apiKey || !listId) {
    throw new Error('Configure MAILCHIMP_API_KEY e MAILCHIMP_LIST_ID no .env')
  }

  const dc = apiKey.split('-').pop()
  return { apiKey, listId, dc }
}

export async function POST(request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return Response.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const { email, name, tags } = await request.json()

  if (!email) {
    return Response.json({ error: 'E-mail é obrigatório' }, { status: 400 })
  }

  try {
    const { apiKey, listId, dc } = getMailchimpConfig()

    const nameParts = (name || '').split(' ')
    const firstName = nameParts[0] || ''
    const lastName = nameParts.slice(1).join(' ') || ''

    const body = {
      email_address: email.toLowerCase().trim(),
      status: 'subscribed',
      merge_fields: { FNAME: firstName, LNAME: lastName },
      tags: tags || [],
    }

    const res = await fetch(
      `https://${dc}.api.mailchimp.com/3.0/lists/${listId}/members`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`anystring:${apiKey}`).toString('base64')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    )

    const data = await res.json()

    // 400 com "Member Exists" = já cadastrado, tratar como sucesso
    if (!res.ok && data.title !== 'Member Exists') {
      throw new Error(data.detail || `Mailchimp error ${res.status}`)
    }

    return Response.json({ success: true, id: data.id })
  } catch (error) {
    if (error.message?.includes('Configure')) {
      return Response.json({ error: error.message }, { status: 503 })
    }
    console.error('[mailchimp] Erro:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

// Verificar status da conexão
export async function GET(request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return Response.json({ error: 'Não autenticado' }, { status: 401 })
  }

  try {
    const { apiKey, listId, dc } = getMailchimpConfig()

    const res = await fetch(`https://${dc}.api.mailchimp.com/3.0/lists/${listId}`, {
      headers: {
        Authorization: `Basic ${Buffer.from(`anystring:${apiKey}`).toString('base64')}`,
      },
    })

    if (!res.ok) throw new Error('Configuração inválida')
    const data = await res.json()

    return Response.json({
      connected: true,
      listName: data.name,
      subscriberCount: data.stats?.member_count || 0,
    })
  } catch (error) {
    return Response.json({ connected: false, error: error.message })
  }
}
