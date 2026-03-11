import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma.js'

/**
 * Extrai geolocalização a partir dos headers da Vercel (zero custo, zero latência).
 * Em desenvolvimento local, retorna null.
 */
function extractGeo(request) {
  const country = request.headers.get('x-vercel-ip-country') || null
  const cityRaw = request.headers.get('x-vercel-ip-city') || null
  const city = cityRaw ? decodeURIComponent(cityRaw) : null
  return { country, city }
}

export async function GET(request, { params }) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  // Redireciona imediatamente — tracking é disparado sem await
  const redirect = url
    ? NextResponse.redirect(url)
    : NextResponse.json({ error: 'URL não fornecida' }, { status: 400 })

  if (!url) return redirect

  // Tracking assíncrono (não bloqueia o redirect)
  const { id } = await params
  const userAgent = request.headers.get('user-agent') || null
  const referrer = request.headers.get('referer') || null
  const { country, city } = extractGeo(request)

  Promise.all([
    prisma.link.update({
      where: { id },
      data: { clicks: { increment: 1 } },
    }),
    prisma.click.create({
      data: { linkId: id, userAgent, referrer, country, city },
    }),
  ]).catch((err) => console.error('Erro ao registrar clique:', err))

  return redirect
}
