/**
 * Cliente de IA - suporta Anthropic Claude e OpenAI
 * Configure ANTHROPIC_API_KEY ou OPENAI_API_KEY no .env
 */

interface AIMessage {
  role: 'user' | 'assistant'
  content: string
}

export async function callAI(prompt: string, systemPrompt?: string): Promise<string> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  const openaiKey = process.env.OPENAI_API_KEY

  if (anthropicKey) {
    return callAnthropic(prompt, systemPrompt, anthropicKey)
  } else if (openaiKey) {
    return callOpenAI(prompt, systemPrompt, openaiKey)
  } else {
    throw new Error('Configure ANTHROPIC_API_KEY ou OPENAI_API_KEY no arquivo .env')
  }
}

async function callAnthropic(prompt: string, systemPrompt: string | undefined, apiKey: string): Promise<string> {
  const body: Record<string, unknown> = {
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  }
  if (systemPrompt) body.system = systemPrompt

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `Anthropic API error ${res.status}`)
  }

  const data = await res.json()
  return data.content[0]?.text || ''
}

async function callOpenAI(prompt: string, systemPrompt: string | undefined, apiKey: string): Promise<string> {
  const messages: AIMessage[] = []
  if (systemPrompt) messages.push({ role: 'assistant', content: systemPrompt })
  messages.push({ role: 'user', content: prompt })

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 1024,
      temperature: 0.7,
    }),
    signal: AbortSignal.timeout(30000),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `OpenAI API error ${res.status}`)
  }

  const data = await res.json()
  return data.choices[0]?.message?.content || ''
}
