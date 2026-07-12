import { describe, expect, it } from 'vitest'
import { LocalHttpProvider } from '../src/main/models/providers'

const endpoint = process.env.LOCAL_MODEL_URL ?? 'http://localhost:11434/api/chat'
const model = process.env.LOCAL_MODEL_NAME ?? 'qwen3.5:9b'

describe('local model planning integration', () => {
  it('returns a schema-valid plan without any cloud API call', async () => {
    const provider = new LocalHttpProvider(endpoint, model)
    const plan = await provider.plan({
      input: 'Why is my PC slow?',
      systemPrompt: `You are a safe Windows task planner. Return a plan using only these tools:
- system.getOverview: Read CPU, memory, OS, and disk health
- system.getTopProcesses: List memory-heavy processes
- system.getDiskUsage: Read drive capacity
Prefer read-only tools. Do not invent tools.`
    })
    expect(plan.goal.length).toBeGreaterThan(3)
    expect(plan.steps.length).toBeGreaterThan(0)
    expect(plan.steps.every((step) => ['system.getOverview', 'system.getTopProcesses', 'system.getDiskUsage'].includes(step.tool))).toBe(true)
  }, 180_000)
})
