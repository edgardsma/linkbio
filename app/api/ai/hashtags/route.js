import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { callAI } from '@/lib/ai'

export async function POST(request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return Response.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const { niche, topic, platform } = await request.json()

  if (!niche) {
    return Response.json({ error: 'Nicho é obrigatório' }, { status: 400 })
  }

  const prompt = `Gere 30 hashtags para ${platform || 'Instagram'} sobre:
- Nicho: ${niche}
- Assunto específico: ${topic || niche}

Retorne APENAS um JSON:
{
  "hashtags": [
    {"tag": "#hashtag", "level": "alto", "estimated_reach": "5M"},
    ...
  ]
}

Onde level é: "alto" (>1M posts), "medio" (100k-1M posts), "baixo" (<100k posts)

Regras:
- Misture hashtags de diferentes níveis (10 alto, 10 médio, 10 baixo)
- Inclua hashtags em português e inglês
- Foco no mercado brasileiro
- Ordene: baixo primeiro, depois médio, depois alto`

  try {
    const text = await callAI(prompt, 'Você é especialista em growth de redes sociais no Brasil. Responda SEMPRE em JSON válido.')
    const json = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || '{}')
    return Response.json({ hashtags: json.hashtags || [] })
  } catch (error) {
    if (error.message?.includes('Configure')) {
      return Response.json({ error: error.message }, { status: 503 })
    }
    console.error('[ai/hashtags] Erro:', error)
    return Response.json({ error: 'Erro ao gerar hashtags' }, { status: 500 })
  }
}
