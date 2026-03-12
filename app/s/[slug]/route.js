import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { getRequestId } from '@/lib/middleware'

// Detectar dispositivo do User-Agent
function detectDevice(userAgent) {
  if (!userAgent) return 'unknown'

  const ua = userAgent.toLowerCase()

  if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
    return 'mobile'
  }

  if (/tablet|ipad|android(?!.*mobile)|silk/i.test(ua)) {
    return 'tablet'
  }

  return 'desktop'
}

// Detectar país do IP (simplificado - usa headers se disponíveis)
function detectCountry(request) {
  // Tenta pegar país do header Cloudflare ou similar
  const country = request.headers.get('cf-ipcountry')
  if (country && country !== 'XX') {
    return country
  }

  // Fallback para IP geolocation (implementação futura)
  return null
}

// GET - Redirecionar para URL original
export async function GET(request, { params }) {
  const requestId = getRequestId(request)
  const { slug } = params

  try {
    // Buscar link curto
    const shortLink = await prisma.shortLink.findUnique({
      where: { slug }
    })

    if (!shortLink) {
      logger.warn('Link curto não encontrado', { requestId, slug })
      // Retornar página de 404 amigável
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Link não encontrado - LinkBio Brasil</title>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
          <div class="text-center p-8">
            <div class="text-6xl mb-4">🔗</div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Link não encontrado</h1>
            <p class="text-gray-600 dark:text-gray-400 mb-6">
              O link curto <code class="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">/s/${slug}</code> não existe ou foi removido.
            </p>
            <a href="/" class="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium">
              Voltar para LinkBio Brasil
            </a>
          </div>
        </body>
        </html>
        `,
        { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      )
    }

    // Extrair informações da requisição
    const userAgent = request.headers.get('user-agent') || null
    const referrer = request.headers.get('referer') || null
    const country = detectCountry(request)
    const device = detectDevice(userAgent)

    // Criar log do clique de forma assíncrona (não bloquear o redirecionamento)
    prisma.shortLinkClick.create({
      data: {
        shortLinkId: shortLink.id,
        userAgent,
        referrer,
        country,
        device
      }
    }).catch(err => {
      logger.error('Erro ao registrar clique', err, { requestId, shortLink })
    })

    // Incrementar contador de cliques
    await prisma.shortLink.update({
      where: { id: shortLink.id },
      data: { clicks: { increment: 1 } }
    }).catch(err => {
      logger.error('Erro ao incrementar cliques', err, { requestId, shortLink })
    })

    logger.info('Redirecionamento executado', {
      requestId,
      slug: shortLink.slug,
      device,
      country
    })

    // Redirecionar para URL original
    return NextResponse.redirect(shortLink.originalUrl, 301)

  } catch (error) {
    logger.error('Erro ao processar redirecionamento', error, { requestId, slug })
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Erro - LinkBio Brasil</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div class="text-center p-8">
          <div class="text-6xl mb-4">⚠️</div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Erro ao processar link</h1>
          <p class="text-gray-600 dark:text-gray-400 mb-6">
            Ocorreu um erro ao processar o redirecionamento. Tente novamente mais tarde.
          </p>
          <a href="/" class="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium">
            Voltar para LinkBio Brasil
          </a>
        </div>
      </body>
      </html>
      `,
      { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    )
  }
}
