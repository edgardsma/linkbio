/**
 * Google Calendar API integration
 * Usa OAuth2 com token do usuário (salvo em User.googleCalendarToken)
 */

interface CalendarEventParams {
  token: string
  title: string
  description?: string
  date: string       // "2026-03-15"
  startTime: string  // "14:00"
  endTime: string    // "15:00"
  guestEmail?: string
  timezone?: string
}

export async function createCalendarEvent(params: CalendarEventParams): Promise<string> {
  const { token, title, description, date, startTime, endTime, guestEmail, timezone = 'America/Sao_Paulo' } = params

  const startDateTime = `${date}T${startTime}:00`
  const endDateTime = `${date}T${endTime}:00`

  const event: Record<string, unknown> = {
    summary: title,
    description,
    start: { dateTime: startDateTime, timeZone: timezone },
    end: { dateTime: endDateTime, timeZone: timezone },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 },
        { method: 'popup', minutes: 30 },
      ],
    },
  }

  if (guestEmail) {
    event.attendees = [{ email: guestEmail }]
  }

  const res = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    }
  )

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `Google Calendar error ${res.status}`)
  }

  const data = await res.json()
  return data.id
}

export async function deleteCalendarEvent(token: string, eventId: string): Promise<void> {
  await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }
  )
}

export async function refreshGoogleToken(refreshToken: string): Promise<string> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  if (!res.ok) throw new Error('Falha ao renovar token do Google')
  const data = await res.json()
  return data.access_token
}
