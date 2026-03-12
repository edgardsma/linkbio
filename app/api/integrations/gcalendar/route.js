import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

const SCOPES = 'https://www.googleapis.com/auth/calendar.events'

function getGoogleOAuthUrl(state) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || '',
    redirect_uri: `${process.env.NEXTAUTH_URL}/api/integrations/gcalendar/callback`,
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    state,
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

// GET: retorna URL de autorização ou status
export async function GET(request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return Response.json({ error: 'Não autenticado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  if (action === 'connect') {
    const url = getGoogleOAuthUrl(session.user.id)
    return Response.json({ url })
  }

  // Verificar status da conexão
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { googleCalendarToken: true },
  })

  return Response.json({ connected: !!user?.googleCalendarToken })
}

// DELETE: desconectar Google Calendar
export async function DELETE(request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return Response.json({ error: 'Não autenticado' }, { status: 401 })

  await prisma.user.update({
    where: { id: session.user.id },
    data: { googleCalendarToken: null },
  })

  return Response.json({ success: true })
}
