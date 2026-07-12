import type { TaskPlan } from '../../shared/types'

export interface PlanningContext { input: string; systemPrompt: string }
export interface ModelProvider { name: string; plan(context: PlanningContext): Promise<TaskPlan>; test(): Promise<string> }
