import { ASSISTANT_INTENTS, estimateAssistantAiCostUsd, parseAiAssistantIntent, type AssistantIntent } from './assistant'

const defaultAssistantModel = 'gpt-5-nano'

export type AiClassificationResult = {
  intent: AssistantIntent
  inputTokens: number
  outputTokens: number
  estimatedCostUsd: number
}

export async function classifyAssistantIntentWithAi(question: string): Promise<AiClassificationResult> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    console.warn('[assistant.ai] no_api_key')
    return emptyAiClassification()
  }

  const model = process.env.OPENAI_ASSISTANT_MODEL || defaultAssistantModel
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: 'system',
          content: [
            {
              type: 'input_text',
              text: [
                'Classifique a pergunta do usuario em uma unica intent da Barber Hub.',
                'Responda somente JSON valido no formato {"intent":"..."} e nada mais.',
                'Nunca crie intents novas.',
                'Se a pergunta nao for sobre a plataforma Barber Hub ou dados de barbearia, use out_of_scope.',
                `Intents permitidas: ${ASSISTANT_INTENTS.join(', ')}`,
              ].join('\n'),
            },
          ],
        },
        {
          role: 'user',
          content: [{ type: 'input_text', text: question.slice(0, 500) }],
        },
      ],
      max_output_tokens: 30,
      temperature: 0,
    }),
  })

  if (!response.ok) {
    console.warn('[assistant.ai] openai_failed', response.status)
    return emptyAiClassification()
  }
  const payload = await response.json() as {
    output_text?: string
    output?: Array<{ content?: Array<{ text?: string }> }>
    usage?: { input_tokens?: number; output_tokens?: number }
  }
  const text = payload.output_text ?? payload.output?.flatMap((item) => item.content ?? []).map((item) => item.text ?? '').join('') ?? ''
  const inputTokens = Number(payload.usage?.input_tokens ?? 0)
  const outputTokens = Number(payload.usage?.output_tokens ?? 0)
  return {
    intent: parseAiAssistantIntent(text),
    inputTokens,
    outputTokens,
    estimatedCostUsd: estimateAssistantAiCostUsd({ inputTokens, outputTokens }),
  }
}

function emptyAiClassification(): AiClassificationResult {
  return { intent: 'out_of_scope', inputTokens: 0, outputTokens: 0, estimatedCostUsd: 0 }
}
