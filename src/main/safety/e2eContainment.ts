import { isAbsolute, resolve, sep } from 'node:path'
import type { ToolContext, ToolDefinition, ToolResult } from '../../shared/types'

const mutablePaths: Record<string, string[]> = {
  'files.createZip': ['source', 'destination'], 'files.move': ['source', 'destination'], 'files.delete': ['path'],
  'browser.fill': [], 'browser.submit': [], 'desktop.setField': []
}

export function isContained(root: string, candidate: string): boolean {
  const base = resolve(root); const path = isAbsolute(candidate)?resolve(candidate):resolve(base,candidate)
  return path === base || path.startsWith(base + sep)
}

export function enforceE2EContainment(tool: ToolDefinition, args: Record<string, unknown>, context: ToolContext): ToolResult | undefined {
  if (!context.e2e?.enabled) return
  for (const key of mutablePaths[tool.name] ?? []) {
    const value = args[key]
    if (typeof value !== 'string' || !isContained(context.e2e.fixtureRoot, value)) return { ok: false, error: `E2E containment blocked ${tool.name}: ${key} is outside the fixture root.` }
  }
  if (tool.name === 'system.killProcess' && !context.e2e.allowedProcessIds.includes(Number(args.pid))) return { ok: false, error: 'E2E containment blocked stopping a process not launched by the harness.' }
}
