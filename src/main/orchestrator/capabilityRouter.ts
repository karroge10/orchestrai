import type { CapabilityRoute, PlanStep } from '../../shared/types'

export function routeForTool(tool: string): CapabilityRoute {
  if (tool.startsWith('system.')) return 'system_tool'
  if (tool.startsWith('files.')) return 'file_tool'
  if (tool.startsWith('browser.')) return 'structured_browser'
  if (tool.startsWith('desktop.')) return 'desktop_accessibility'
  if (tool.startsWith('screen.')) return 'visual_computer_use'
  return 'unsupported'
}

export function routesForPlan(steps: PlanStep[]): CapabilityRoute[] {
  if (!steps.length) return ['ask_user']
  return [...new Set(steps.map((step) => routeForTool(step.tool)))]
}
