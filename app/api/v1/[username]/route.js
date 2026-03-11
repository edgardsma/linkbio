import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma.js'
import { checkRateLimit, getUserProfile } from '@/lib/redis'
import { logger, apiLogger } from '@/lib/logger'
import { getRequestId, withRequestId } from '@/lib/middleware'
import { trackPerformance } from '@/lib/performance'
import { getServerSession } from 'next-auth/react'

/**
 * API Pública v1 para Planos Premium
 *
 * Fornece acesso avançado a dados públicos com:
 * - Rate limiting diferenciado por plano
 * - Performance tracking
 * - Logs estruturados
 */

// Rate limits por plano (configurados via RBAC)
const LIMITES_TAXA = {
  GRATUITO: { requisicoes: 100, periodo: '1h' },        // 100 requisições/hora
  INICIANTE: { requisicoes: 500, periodo: '1h' },      // 500 requisições/hora
  PRO: { requisicoes: 2000, periodo: '1h' },       // 2000 requisições/hora
  PREMIUM: { requisicoes: 10000, periodo: '1h' },   // 10000 requisições/hora
}

/**
 * Obtém limite de taxa baseado no plano do usuário
 */
async function obterLimiteTaxaParaUsuario(username) {
  // Buscar perfil para verificar plano
  let perfil
  try {
    perfil = await getUserProfile(username)
  } catch (error) {
    logger.warn('Erro ao buscar perfil para limite de taxa', { username, error })
  }

  // Se não conseguiu buscar, usar limite padrão (GRATUITO)
  if (!perfil) {
    return LIMITES_TAXA.GRATUITO
  }

  // Mapear plano para limite de taxa
  const mapaPlanos = {
    'FREE': 'GRATUITO',
    'STARTER': 'INICIANTE',
    'PRO': 'PRO',
    'PREMIUM': 'PREMIUM',
  }

  // Buscar subscription do usuário para verificar plano
  const userSubscription = await prisma.subscription.findUnique({
    where: { userId: perfil.id },
  })

  const plano = userSubscription?.plan || 'FREE'
  const chavePlano = mapaPlanos[plano] || 'GRATUITO'

  return LIMITES_TAXA[chavePlano]
}

/**
 * GET /api/v1/[username]/perfil
 *
 * Endpoint público v1 para perfil do usuário com:
 * - Cache Redis automático
 * - Rate limiting por plano
 * - Performance tracking
 */
export async function GET(request, { params }) {
  return trackPerformance('GET /api/v1/[username]/perfil', async () => {
    const requestId = getRequestId(request)
    const { username } = await params

    try {
      apiLogger.info('API v1 - Perfil solicitado', { requestId, username })

      // Buscar perfil (com cache automático)
      const perfil = await getUserProfile(username)

      if (!perfil) {
        apiLogger.warn('Perfil não encontrado', { requestId, username })
        return NextResponse.json(
          { error: 'Perfil não encontrado' },
          { status: 404 }
        )
      }

      // Rate limiting por plano
      const configLimiteTaxa = await obterLimiteTaxaParaUsuario(username)
      const ip = request.headers.get('x-forwarded-for') || 'desconhecido'
      const { allowed, remaining } = await checkRateLimit(ip, configLimiteTaxa.requisicoes)

      if (!allowed) {
        apiLogger.warn('Limite de taxa atingido (API v1)', { requestId, username, ip, remaining })
        return NextResponse.json(
          { error: 'Muitas requisições. Tente novamente mais tarde.' },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': String(configLimiteTaxa.requisicoes),
              'X-RateLimit-Remaining': String(remaining),
              'X-RateLimit-Period': configLimiteTaxa.periodo,
              'X-RateLimit-Reset': new Date(Date.now() + 3600000).toISOString(),
            },
          }
        )
      }

      // Preparar resposta v1 (enriquecida)
      const respostaV1 = {
        dados: {
          perfil: {
            id: perfil.id,
            username: perfil.username,
            name: perfil.name,
            image: perfil.image,
            bio: perfil.bio,
            background: perfil.background,
            createdAt: perfil.createdAt,
          },
          links: perfil.links
            .filter(link => link.isActive)
            .map(link => ({
              id: link.id,
              title: link.title,
              url: link.url,
              description: link.description,
              icon: link.icon,
              position: link.position,
              clicks: link.clicks,
            })),
          metadados: {
            versao: 'v1',
            emCache: true,
            limiteTaxa: {
              limite: configLimiteTaxa.requisicoes,
              periodo: configLimiteTaxa.periodo,
              restantes: remaining,
            },
          },
        },
        api: {
          versao: 'v1',
          comRateLimit: false,
          endpoints: [
            '/api/v1/[username]/perfil',
            '/api/v1/[username]/estatisticas',
            '/api/v1/[username]/pixel',
          ],
        },
      }

      apiLogger.info('API v1 - Perfil retornado com sucesso', {
        requestId,
        username,
        plano: perfil.subscription?.plan || 'FREE',
        limiteTaxaRestantes: remaining,
      })

      const response = NextResponse.json(respostaV1)
      return withRequestId(response, requestId)
    } catch (error) {
      logger.error('Erro na API v1 - Perfil', error, { requestId, username })
      return NextResponse.json(
        { error: 'Erro interno' },
        { status: 500 }
      )
    }
  })
}

/**
 * GET /api/v1/[username]/estatisticas
 *
 * Endpoint público v1 para estatísticas básicas
 */
export async function GET_ESTATISTICAS(request, { params }) {
  return trackPerformance('GET /api/v1/[username]/estatisticas', async () => {
    const requestId = getRequestId(request)
    const { username } = await params

    try {
      apiLogger.info('API v1 - Estatísticas solicitado', { requestId, username })

      const perfil = await getUserProfile(username)

      if (!perfil) {
        return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
      }

      // Buscar estatísticas básicas (com cache via getUserProfile)
      const totalCliques = perfil.links?.reduce((sum, link) => sum + (link.clicks || 0), 0) || 0

      const estatisticas = {
        totalLinks: perfil.links?.length || 0,
        totalCliques,
        mediaCliquesPorLink: perfil.links?.length ? Math.round(totalCliques / perfil.links.length) : 0,
        linksMaisClicados: perfil.links
          ?.filter(link => link.isActive)
          ?.sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
          ?.slice(0, 5)
          ?.map(link => ({
            id: link.id,
            title: link.title,
            clicks: link.clicks || 0,
          })) || [],
      }

      const response = NextResponse.json(estatisticas)
      return withRequestId(response, requestId)
    } catch (error) {
      logger.error('Erro na API v1 - Estatísticas', error, { requestId, username })
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
  })
}

/**
 * GET /api/v1/[username]/pixel
 *
 * Pixel de tracking para marketing (1x1 transparente)
 */
export async function GET_PIXEL(request, { params }) {
  const requestId = getRequestId(request)
  const { username } = await params

  try {
    const perfil = await getUserProfile(username)

    if (!perfil) {
      // Retornar 1x1 transparente pixel
      return new Response(
        'GIF89a',  // 1x1 transparent GIF
        {
          status: 200,
          headers: {
            'Content-Type': 'image/gif',
            'Cache-Control': 'public, max-age=31536000',
          },
        }
      )
    }

    // Registrar pixel no banco (assíncrono, sem bloquear resposta)
    prisma.click.create({
      data: {
        linkId: 'pixel-tracking', // ID especial para pixels
        userAgent: request.headers.get('user-agent'),
        referrer: request.headers.get('referer'),
        country: request.headers.get('x-country'),
      },
    }).catch((error) => {
      logger.warn('Erro ao registrar pixel', error, { requestId, username })
    })

    logger.debug('Pixel registrado', { requestId, username })
  } catch (error) {
    logger.error('Erro no pixel tracking', error, { requestId, username })
  }
}
