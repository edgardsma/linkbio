import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state') // userId
  const error = searchParams.get('error')

  if (error || !code || !state) {
    return redirect('/dashboard/agenda?gcalendar=error')
  }

  try {
    // Trocar código por tokens
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/integrations/gcalendar/callback`,
        grant_type: 'authorization_code',
      }),
    })

    if (!res.ok) throw new Error('Falha na troca de código')

    const { access_token, refresh_token } = await res.json()

    // Salvar token (refresh_token é o mais importante para uso futuro)
    await prisma.user.update({
      where: { id: state },
      data: { googleCalendarToken: refresh_token || access_token },
    })

    return redirect('/dashboard/agenda?gcalendar=connected')
  } catch (err) {
    console.error('[gcalendar/callback] Erro:', err)
    return redirect('/dashboard/agenda?gcalendar=error')
  }
}
