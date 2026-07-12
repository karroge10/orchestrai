import type { ProviderTestResult, Settings, TaskPlan, ToolDescriptor } from '../../shared/types'
import type { SecretStore } from '../storage/secretStore'
import { retrieveKnowledge } from '../knowledge/retrieve'
import { AnthropicProvider, LocalHttpProvider, OpenAIProvider } from '../models/providers'
import { taskPlanSchema } from '../models/planSchema'
import { deterministicPlanner } from './deterministicPlanner'

const SYSTEM_PROMPT = `You are OrchestrAI, a careful Windows desktop assistant.
Prefer read-only deterministic tools over screenshots, and screenshots over input automation. Never invent tools.
Choose the smallest sufficient plan. Never request credentials or type secrets. Do not plan deletion, process termination, file moves, settings changes, web submissions, or input actions unless directly required by the user's request.
Risky tools will require approval; do not claim they already ran. Use screen control only when a system or file tool cannot accomplish the task.`

export class ModelRouter {
  constructor(private getSettings: () => Settings, private secrets: SecretStore, private getTools: () => ToolDescriptor[]) {}
  private provider(settings = this.getSettings()) {
    if (settings.provider === 'openai') { const key = this.secrets.get('openai'); if (!key) throw new Error('Save an OpenAI API key in Settings first.'); return new OpenAIProvider(key, settings.openAIModel) }
    if (settings.provider === 'anthropic') { const key = this.secrets.get('anthropic'); if (!key) throw new Error('Save an Anthropic API key in Settings first.'); return new AnthropicProvider(key, settings.anthropicModel) }
    if (settings.provider === 'local') return new LocalHttpProvider(settings.localModelUrl, settings.localModelName)
    return undefined
  }
  async plan(input: string): Promise<{ plan: TaskPlan; fallback: boolean; error?: string }> {
    const settings = this.getSettings(); if (settings.provider === 'mock') return { plan: deterministicPlanner(input), fallback: false }
    try {
      const knowledge = await retrieveKnowledge(input); const tools = this.getTools(); const systemPrompt = `${SYSTEM_PROMPT}\n\nAvailable tools:\n${tools.map((tool) => `- ${tool.name} [${tool.risk}${tool.requiresApproval ? ', approval' : ''}]: ${tool.description}`).join('\n')}\n\nRelevant local knowledge:\n${knowledge.join('\n\n') || 'None.'}`
      const parsed = taskPlanSchema.parse(await this.provider(settings)!.plan({ input, systemPrompt }))
      const allowed = new Set(tools.map((tool) => tool.name)); if (parsed.steps.some((step) => !allowed.has(step.tool))) throw new Error('The model selected an unknown tool.')
      return { plan: parsed, fallback: false }
    } catch (error) { return { plan: deterministicPlanner(input), fallback: true, error: error instanceof Error ? error.message : String(error) } }
  }
  async test(settings = this.getSettings()): Promise<ProviderTestResult> { const started = Date.now(); try { if (settings.provider === 'mock') return { ok: true, provider: 'mock', message: 'Deterministic planner is ready.', latencyMs: 0 }; const message = await this.provider(settings)!.test(); return { ok: true, provider: settings.provider, message, latencyMs: Date.now() - started } } catch (error) { return { ok: false, provider: settings.provider, message: error instanceof Error ? error.message : String(error), latencyMs: Date.now() - started } }
  }
}
