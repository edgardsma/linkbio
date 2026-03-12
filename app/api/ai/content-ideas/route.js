import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { callAI } from '@/lib/ai'

export async function POST(request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return Response.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const { niche, platforms, goal } = await request.json()

  if (!niche) {
    return Response.json({ error: 'Nicho é obrigatório' }, { status: 400 })
  }

  const goalMap = {
    followers: 'crescimento de seguidores',
    sales: 'vendas de produtos',
    authority: 'autoridade no nicho',
    engagement: 'engajamento e comunidade',
  }

  const prompt = `Crie um calendário de conteúdo com 7 ideias de posts para:
- Nicho: ${niche}
- Plataformas: ${(platforms || ['Instagram', 'TikTok']).join(', ')}
- Objetivo: ${goalMap[goal] || 'crescimento geral'}

Retorne APENAS um JSON:
{
  "ideas": [
    {
      "day": "Segunda-feira",
      "title": "título chamativo do post",
      "type": "Carrossel | Reels | Stories | Post estático | Live",
      "hook": "primeira frase que para o scroll",
      "outline": "roteiro em 3 bullets",
      "cta": "call-to-action sugerido"
    }
  ]
}

Regras:
- 1 ideia por dia da semana (segunda a domingo)
- Varie os formatos
- Foco em conteúdo brasileiro
- Inclua pelo menos 2 ideias de Reels/TikTok`

  try {
    const text = await callAI(prompt, 'Você é estrategista de conteúdo digital para o mercado brasileiro. Responda SEMPRE em JSON válido.')
    const json = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || '{}')
    return Response.json({ ideas: json.ideas || [] })
  } catch (error) {
    if (error.message?.includes('Configure')) {
      return Response.json({ error: error.message }, { status: 503 })
    }
    console.error('[ai/content-ideas] Erro:', error)
    return Response.json({ error: 'Erro ao gerar ideias' }, { status: 500 })
  }
}
