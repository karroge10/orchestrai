import { z } from 'zod'

export const taskPlanSchema = z.object({
  goal: z.string().min(1).max(300),
  explanation: z.string().max(1200).optional(),
  steps: z.array(z.object({ title: z.string().min(1).max(200), tool: z.string().min(1).max(100), args: z.record(z.string(), z.unknown()) })).max(12),
  needsScreenshot: z.boolean(),
  risk: z.enum(['safe', 'medium', 'high'])
})

export type ParsedTaskPlan = z.infer<typeof taskPlanSchema>

export const taskPlanJsonSchema = {
  type: 'object', additionalProperties: false, required: ['goal', 'steps', 'needsScreenshot', 'risk'],
  properties: {
    goal: { type: 'string' }, explanation: { type: 'string' }, needsScreenshot: { type: 'boolean' }, risk: { type: 'string', enum: ['safe', 'medium', 'high'] },
    steps: { type: 'array', maxItems: 12, items: { type: 'object', additionalProperties: false, required: ['title', 'tool', 'args'], properties: { title: { type: 'string' }, tool: { type: 'string' }, args: { type: 'object', additionalProperties: true } } } }
  }
} as const
