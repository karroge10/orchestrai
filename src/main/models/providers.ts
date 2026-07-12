import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { zodTextFormat } from 'openai/helpers/zod'
import type { TaskPlan } from '../../shared/types'
import type { ModelProvider, PlanningContext } from './ModelProvider'
import { taskPlanJsonSchema, taskPlanSchema } from './planSchema'

function jsonFromText(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]
  return JSON.parse((fenced ?? text).trim())
}

export class OpenAIProvider implements ModelProvider {
  name = 'OpenAI'
  constructor(private apiKey: string, private model: string) {}
  async plan({ input, systemPrompt }: PlanningContext): Promise<TaskPlan> {
    const client = new OpenAI({ apiKey: this.apiKey, timeout: 45_000, maxRetries: 2 })
    const response = await client.responses.parse({ model: this.model, store: false, input: [{ role: 'system', content: systemPrompt }, { role: 'user', content: input }], text: { format: zodTextFormat(taskPlanSchema, 'task_plan') } })
    if (!response.output_parsed) throw new Error('OpenAI returned no validated plan.')
    return response.output_parsed
  }
  async test(): Promise<string> { const client = new OpenAI({ apiKey: this.apiKey, timeout: 20_000, maxRetries: 1 }); await client.models.retrieve(this.model); return `Connected to ${this.model}` }
}

export class AnthropicProvider implements ModelProvider {
  name = 'Anthropic'
  constructor(private apiKey: string, private model: string) {}
  async plan({ input, systemPrompt }: PlanningContext): Promise<TaskPlan> {
    const client = new Anthropic({ apiKey: this.apiKey, timeout: 45_000, maxRetries: 2 })
    const response = await client.messages.create({ model: this.model, max_tokens: 2200, system: `${systemPrompt}\nReturn only JSON matching this schema: ${JSON.stringify(taskPlanJsonSchema)}`, messages: [{ role: 'user', content: input }] })
    const text = response.content.filter((block) => block.type === 'text').map((block) => block.text).join('')
    return taskPlanSchema.parse(jsonFromText(text))
  }
  async test(): Promise<string> { const client = new Anthropic({ apiKey: this.apiKey, timeout: 20_000, maxRetries: 1 }); await client.models.retrieve(this.model); return `Connected to ${this.model}` }
}

export class LocalHttpProvider implements ModelProvider {
  name = 'Local HTTP'
  constructor(private url: string, private model: string) {}
  async plan({ input, systemPrompt }: PlanningContext): Promise<TaskPlan> {
    const ollama = /\/api\/chat\/?$/i.test(this.url)
    const body = ollama
      ? { model: this.model, stream: false, format: taskPlanJsonSchema, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: input }] }
      : { model: this.model, stream: false, response_format: { type: 'json_schema', json_schema: { name: 'task_plan', strict: true, schema: taskPlanJsonSchema } }, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: input }] }
    const response = await fetch(this.url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(120_000) })
    if (!response.ok) throw new Error(`Local model returned HTTP ${response.status}`)
    const json = await response.json() as { message?: { content?: string }; choices?: Array<{ message?: { content?: string } }> }
    const text = json.message?.content ?? json.choices?.[0]?.message?.content
    if (!text) throw new Error('Local model returned no plan.')
    return taskPlanSchema.parse(jsonFromText(text))
  }
  async test(): Promise<string> { const ollama=/\/api\/chat\/?$/i.test(this.url);const response = await fetch(this.url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ model: this.model, stream: false, messages: [{ role: 'user', content: 'Reply with OK.' }],...(ollama?{options:{num_predict:8},keep_alive:'10m'}:{}) }), signal: AbortSignal.timeout(120_000) }); if (!response.ok) throw new Error(`HTTP ${response.status}`);const data=await response.json() as {load_duration?:number;eval_duration?:number;eval_count?:number};if(ollama){const loadMs=Math.round((data.load_duration??0)/1e6);const tokensPerSecond=data.eval_duration&&data.eval_count?data.eval_count/(data.eval_duration/1e9):0;return `Connected to ${this.model} · load ${loadMs} ms${tokensPerSecond?` · ${tokensPerSecond.toFixed(1)} tok/s`:''}`}return `Connected to ${this.model}` }
}
