import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { callAI } from '@/lib/ai'

export async function POST(request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return Response.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const { name, niche, keywords, style } = await request.json()

  if (!niche) {
    return Response.json({ error: 'Nicho é obrigatório' }, { status: 400 })
  }

  const styleMap = {
    professional: 'profissional e formal',
    casual: 'casual e descontraído',
    fun: 'divertido e criativo com emojis',
    inspiring: 'inspirador e motivacional',
  }

  const prompt = `Gere 3 opções de bio para LinkBio (máximo 150 caracteres cada) para:
- Nome: ${name || 'não informado'}
- Nicho: ${niche}
- Palavras-chave: ${keywords || 'não informadas'}
- Estilo: ${styleMap[style] || 'profissional'}

Retorne APENAS um JSON no formato:
{"bios": ["bio 1", "bio 2", "bio 3"]}

Regras:
- Máximo 150 caracteres por bio
- Em português brasileiro
- Inclua call-to-action quando possível
- Use emojis se o estilo permitir`

  try {
    const text = await callAI(prompt, 'Você é especialista em marketing digital brasileiro. Responda SEMPRE em JSON válido.')
    const json = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || '{}')
    return Response.json({ bios: json.bios || [] })
  } catch (error) {
    if (error.message?.includes('Configure')) {
      return Response.json({ error: error.message }, { status: 503 })
    }
    console.error('[ai/bio] Erro:', error)
    return Response.json({ error: 'Erro ao gerar bio' }, { status: 500 })
  }
}
