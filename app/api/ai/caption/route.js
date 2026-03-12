import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { callAI } from '@/lib/ai'

export async function POST(request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return Response.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const { description, platforms, niche, tone } = await request.json()

  if (!description) {
    return Response.json({ error: 'Descrição do post é obrigatória' }, { status: 400 })
  }

  const platformList = (platforms || ['instagram']).join(', ')
  const toneMap = {
    informal: 'informal e próximo',
    professional: 'profissional',
    funny: 'engraçado e leve',
    educational: 'educativo e informativo',
    sales: 'persuasivo para vendas',
  }

  const prompt = `Gere legendas para post de ${platformList} sobre:
"${description}"

Nicho: ${niche || 'geral'}
Tom: ${toneMap[tone] || 'informal e próximo'}

Retorne APENAS um JSON:
{
  "captions": {
    "instagram": "legenda com emojis e hashtags no final",
    "tiktok": "legenda curta e chamativa com hashtags TikTok",
    "linkedin": "legenda profissional sem exagero de emojis"
  }
}

Regras:
- Instagram: até 2200 caracteres, hashtags relevantes no final
- TikTok: até 300 caracteres, hashtags virais
- LinkedIn: até 700 caracteres, tom mais formal
- Use emojis estrategicamente
- Sempre em português brasileiro`

  try {
    const text = await callAI(prompt, 'Você é copywriter especialista em redes sociais brasileiras. Responda SEMPRE em JSON válido.')
    const json = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || '{}')
    return Response.json({ captions: json.captions || {} })
  } catch (error) {
    if (error.message?.includes('Configure')) {
      return Response.json({ error: error.message }, { status: 503 })
    }
    console.error('[ai/caption] Erro:', error)
    return Response.json({ error: 'Erro ao gerar legenda' }, { status: 500 })
  }
}
