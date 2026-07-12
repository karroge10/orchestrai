import type { Risk, ToolDefinition } from '../../shared/types'

const forcedApproval = new Set(['system.killProcess', 'files.move', 'files.delete', 'files.createZip', 'screen.click', 'screen.type', 'screen.hotkey', 'screen.scroll', 'screen.recordToggle', 'browser.fill', 'browser.filter', 'browser.submit', 'desktop.selectTab', 'desktop.setField'])
const highRisk = new Set(['files.delete', 'browser.submit'])

export function effectivePolicy(tool: Pick<ToolDefinition, 'name' | 'risk' | 'requiresApproval'>): { risk: Risk; requiresApproval: boolean } {
  return { risk: highRisk.has(tool.name) ? 'high' : tool.risk, requiresApproval: tool.requiresApproval || forcedApproval.has(tool.name) }
}
