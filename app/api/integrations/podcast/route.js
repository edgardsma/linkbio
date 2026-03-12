/**
 * RSS Feed parser para Podcast embed
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return Response.json({ error: 'URL do feed RSS é obrigatória' }, { status: 400 })
  }

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'LinkBioBot/1.0 (Podcast Reader)', Accept: 'application/rss+xml, application/xml, text/xml' },
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const xml = await res.text()
    const episodes = parseRSSEpisodes(xml)

    return Response.json({ episodes }, {
      headers: { 'Cache-Control': 'public, max-age=1800' }, // 30min
    })
  } catch (error) {
    console.error('[podcast] Erro ao buscar feed:', error)
    return Response.json({ error: 'Não foi possível carregar o feed' }, { status: 502 })
  }
}

function parseRSSEpisodes(xml) {
  const episodes = []
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi
  let match

  while ((match = itemRegex.exec(xml)) !== null && episodes.length < 10) {
    const item = match[1]
    const title = extractTag(item, 'title')
    const pubDate = extractTag(item, 'pubDate')
    const description = extractTag(item, 'description') || extractTag(item, 'itunes:summary')
    const audioUrl = extractEnclosureUrl(item) || extractTag(item, 'enclosure')
    const duration = extractItunesDuration(item)

    if (title) {
      episodes.push({
        title: decodeEntities(title),
        pubDate: pubDate ? new Date(pubDate).toISOString() : null,
        description: description ? decodeEntities(stripHtml(description)).slice(0, 300) : null,
        audioUrl,
        duration,
      })
    }
  }

  return episodes
}

function extractTag(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}(?:[^>]*)>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, 'i'))
  return match ? match[1].trim() : null
}

function extractEnclosureUrl(xml) {
  const match = xml.match(/<enclosure[^>]+url=["']([^"']+)["']/i)
  return match ? match[1] : null
}

function extractItunesDuration(xml) {
  const raw = extractTag(xml, 'itunes:duration')
  if (!raw) return null
  if (raw.includes(':')) {
    const parts = raw.split(':').map(Number)
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
    if (parts.length === 2) return parts[0] * 60 + parts[1]
  }
  return parseInt(raw) || null
}

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function decodeEntities(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
}
