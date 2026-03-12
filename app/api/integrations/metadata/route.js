/**
 * Scraper de metadados Open Graph
 * Usado para preview de Hotmart, Kiwify e outros produtos
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return Response.json({ error: 'URL é obrigatória' }, { status: 400 })
  }

  // Validar URL
  let parsed
  try {
    parsed = new URL(url)
  } catch {
    return Response.json({ error: 'URL inválida' }, { status: 400 })
  }

  // Apenas domínios permitidos
  const allowedDomains = [
    'hotmart.com', 'hotmart.product', 'go.hotmart.com',
    'kiwify.com.br', 'go.kiwify.com.br',
    'eduzz.com', 'sun.eduzz.com',
    'monetizze.com.br',
    'pay.hotmart.com',
  ]
  const isAllowed = allowedDomains.some(d => parsed.hostname.includes(d))
  if (!isAllowed) {
    return Response.json({ error: 'Domínio não permitido' }, { status: 403 })
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LinkBioBot/1.0)',
        Accept: 'text/html',
      },
      signal: AbortSignal.timeout(5000),
    })

    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const html = await res.text()

    const metadata = {
      title: extractMeta(html, 'og:title') || extractTitle(html) || '',
      description: extractMeta(html, 'og:description') || extractMeta(html, 'description') || '',
      image: extractMeta(html, 'og:image') || '',
      price: extractPrice(html),
      url,
    }

    return Response.json(metadata, {
      headers: { 'Cache-Control': 'public, max-age=3600' },
    })
  } catch (error) {
    console.error('[metadata] Erro ao buscar metadados:', error)
    return Response.json({ error: 'Não foi possível buscar metadados' }, { status: 502 })
  }
}

function extractMeta(html, name) {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${name}["']`, 'i'),
    new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["']`, 'i'),
  ]
  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match) return match[1].trim()
  }
  return null
}

function extractTitle(html) {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  return match ? match[1].trim() : null
}

function extractPrice(html) {
  // Tenta extrair preço em formato brasileiro
  const patterns = [
    /R\$\s*([\d.,]+)/,
    /"price"\s*:\s*"?([\d.]+)"?/,
    /price['":\s]+([\d.]+)/i,
  ]
  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match) return match[1]
  }
  return null
}
