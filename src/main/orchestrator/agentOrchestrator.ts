import { randomUUID } from 'node:crypto'
import type { Finding, Settings, Task, ToolResult } from '../../shared/types'
import { audit } from '../logs/auditLogger'
import { effectivePolicy } from '../safety/safetyPolicy'
import type { TaskRepository } from '../storage/taskRepository'
import { getTool, runTool } from '../tools/registry'
import type { ModelRouter } from './modelRouter'
import { routesForPlan } from './capabilityRouter'

type Update = (task: Task) => void
const id = () => randomUUID()
const array = (data: unknown): Record<string, unknown>[] => Array.isArray(data) ? data as Record<string, unknown>[] : data ? [data as Record<string, unknown>] : []
const reversible = (tool: string) => ['files.createZip', 'files.move', 'files.delete', 'system.killProcess', 'screen.click', 'screen.type', 'screen.hotkey', 'screen.scroll'].includes(tool)

export function findingsFor(tool: string, result: ToolResult): Finding[] {
  if (!result.ok) return [{ id: id(), severity: 'medium', title: 'A tool could not finish', description: result.error ?? 'Unknown tool error' }]
  const rows = array(result.data)
  if (tool === 'system.getOverview') { const x = rows[0] ?? {}; const out: Finding[] = []; if (Number(x.memoryUsedPercent) >= 85) out.push({ id: id(), severity: 'high', title: 'Memory pressure is high', description: `${x.memoryUsedPercent}% of memory is in use.`, evidence: `${x.freeMemoryGB} GB free of ${x.totalMemoryGB} GB` }); if (Number(x.diskCUsedPercent) >= 90) out.push({ id: id(), severity: 'high', title: 'System drive is almost full', description: `C: is ${x.diskCUsedPercent}% full; low free space can slow Windows.`, evidence: `${x.diskCFreeGB} GB free` }); if (Number(x.cpuPercent) >= 85) out.push({ id: id(), severity: 'medium', title: 'CPU usage is high', description: `CPU usage was approximately ${x.cpuPercent}% during the check.` }); if (!out.length) out.push({ id: id(), severity: 'info', title: 'Core system health looks reasonable', description: `CPU ${x.cpuPercent}%, memory ${x.memoryUsedPercent}%, C: ${x.diskCUsedPercent}% used.` }); return out }
  if (tool === 'system.getTopProcesses') { const top = rows[0]; return top && Number(top.memoryMB) > 1500 ? [{ id: id(), severity: 'medium', title: `${top.name} is using substantial memory`, description: `The largest process in the sample uses ${top.memoryMB} MB.`, evidence: `PID ${top.pid}` }] : [] }
  if (tool === 'system.getDiskUsage') return rows.filter((x) => Number(x.usedPercent) >= 90).map((x) => ({ id: id(), severity: 'high' as const, title: `Drive ${x.drive} is almost full`, description: `${x.usedPercent}% used with ${x.freeGB} GB free.`, evidence: `${x.totalGB} GB total` }))
  if (tool === 'system.getStartupApps' && rows.length > 12) return [{ id: id(), severity: 'medium', title: 'Many startup apps are configured', description: `${rows.length} entries may add work during sign-in. Review them before disabling anything.` }]
  if (tool === 'system.getRecentErrors' && rows.length) return [{ id: id(), severity: rows.length > 8 ? 'medium' : 'low', title: 'Recent Windows errors were found', description: `Found ${rows.length} error events from the last 24 hours.`, evidence: String(rows[0]?.message ?? '').slice(0, 220) }]
  if (tool === 'files.search') return [{ id: id(), severity: rows.length ? 'info' : 'low', title: rows.length ? `Found ${rows.length} matching file${rows.length === 1 ? '' : 's'}` : 'No matching files found', description: rows.length ? 'Results are limited to common user folders.' : 'Try a more exact filename or extension.', evidence: rows.slice(0, 8).map((x) => x.path).join('\n') }]
  if (tool === 'files.listLargeFiles') return [{ id: id(), severity: 'info', title: `Found ${rows.length} large files`, description: 'Review the paths before approving any changes.', evidence: rows.slice(0, 8).map((x) => `${(Number(x.size) / 1073741824).toFixed(1)} GB — ${x.path}`).join('\n') }]
  if (tool === 'screen.capture') return [{ id: id(), severity: 'info', title: 'Screenshot captured locally', description: 'The image was saved in app data.', evidence: String((result.data as Record<string, unknown>)?.path ?? '') }]
  if (tool.startsWith('screen.')) return [{ id: id(), severity: 'info', title: 'Approved input action completed', description: result.evidence ?? tool }]
  if (tool === 'files.createZip') return [{ id: id(), severity: 'info', title: 'Archive created', description: 'The approved source was compressed.', evidence: String((result.data as Record<string, unknown>)?.path ?? '') }]
  if (tool === 'files.move') return [{ id: id(), severity: 'info', title: 'Item moved', description: result.evidence ?? 'The approved move completed.' }]
  if (tool === 'files.delete') return [{ id: id(), severity: 'info', title: 'Item moved to Recycle Bin', description: 'The approved item can usually be restored from the Recycle Bin.', evidence: result.evidence }]
  if (tool === 'system.killProcess') return [{ id: id(), severity: 'info', title: 'Process stopped', description: result.evidence ?? 'The approved process was stopped.' }]
  return []
}

export class AgentOrchestrator {
  private tasks = new Map<string, Task>()
  private controllers = new Map<string, AbortController>()
  constructor(private update: Update, private repository: TaskRepository, private router: ModelRouter, private getSettings: () => Settings) { for (const task of repository.list()) this.tasks.set(task.id, task) }
  list() { return [...this.tasks.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)) }
  private emit(task: Task) { task.updatedAt = new Date().toISOString(); this.tasks.set(task.id, task); this.repository.save(task); this.update(structuredClone(task)) }
  private context(taskId: string, signal?: AbortSignal) { const settings = this.getSettings(); const e2e=settings.e2eTestMode&&settings.e2eFixtureRoot?{enabled:true as const,fixtureRoot:settings.e2eFixtureRoot,allowedProcessIds:(process.env.ORCHESTRAI_E2E_PIDS??'').split(',').map(Number).filter(Number.isInteger)}:undefined; return { taskId, agentControlMode: settings.agentControlMode, screenshotPermission: settings.screenshotPermission, abortSignal: signal, e2e } }
  async run(input: string): Promise<Task> {
    const now = new Date().toISOString(); const settings = this.getSettings(); const task: Task = { id: id(), input, status: 'planning', createdAt: now, updatedAt: now, provider: settings.provider, steps: [], findings: [], proposedActions: [], logs: [audit('Task received', input)] }; const controller = new AbortController(); this.controllers.set(task.id, controller); this.emit(task)
    const routed = await this.router.plan(input); task.plannerFallback = routed.fallback; if (routed.error) task.logs.push(audit('Model plan rejected; deterministic fallback used', routed.error, 'warning')); const plan = routed.plan
    task.routes = routesForPlan(plan.steps); task.logs.push(audit('Plan validated', `${plan.goal}; ${plan.steps.length} step(s); routes: ${task.routes.join(', ')}`)); task.summary = plan.explanation; task.steps = plan.steps.map((step) => ({ id: id(), title: step.title, tool: step.tool, status: 'pending' }))
    if (!plan.steps.length) { task.status = 'done'; task.summary = 'Please be more specific. Try “Why is my PC slow?”, “Find budget.xlsx”, “Clean Downloads”, or “Take a screenshot”.'; task.findings.push({ id: id(), severity: 'info', title: 'A more specific task is needed', description: task.summary }); this.emit(task); return task }
    task.status = 'running'; this.emit(task)
    for (let index = 0; index < plan.steps.length; index++) {
      if (controller.signal.aborted) break
      const spec = plan.steps[index]!; const step = task.steps[index]!; const definition = getTool(spec.tool)
      if (!definition) { step.status = 'failed'; step.result = 'Tool is unavailable'; continue }
      const policy = effectivePolicy(definition)
      if (policy.requiresApproval) { step.status = 'done'; step.result = 'Waiting for approval'; task.proposedActions.push({ id: id(), title: spec.title, description: definition.description, risk: policy.risk, reversible: reversible(spec.tool), toolName: spec.tool, args: spec.args }); task.logs.push(audit('Action proposed', spec.tool, 'warning')); this.emit(task); continue }
      step.status = 'running'; task.logs.push(audit('Tool started', spec.tool)); this.emit(task)
      const result = await runTool(spec.tool, spec.args, this.context(task.id, controller.signal)); step.status = result.ok ? 'done' : 'failed'; step.result = result.ok ? (result.evidence ?? 'Completed') : (result.error ?? 'Failed'); task.findings.push(...findingsFor(spec.tool, result)); if (spec.tool === 'screen.capture' && result.ok) task.screenshotPath = String((result.data as Record<string, unknown>).path); task.logs.push(audit(result.ok ? 'Tool completed' : 'Tool failed', `${spec.tool}: ${step.result}`, result.ok ? 'info' : 'error')); this.emit(task)
    }
    task.status = controller.signal.aborted ? 'cancelled' : task.proposedActions.length ? 'needs_approval' : task.steps.some((step) => step.status === 'failed') ? 'failed' : 'done'; task.summary = task.status === 'cancelled' ? 'Task stopped by the user.' : task.status === 'needs_approval' ? 'Review the proposed actions before anything changes.' : `Completed ${task.steps.filter((step) => step.status === 'done').length} of ${task.steps.length} steps.`; this.controllers.delete(task.id); this.emit(task); return task
  }
  async approve(taskId: string, actionIds: string[]) { const task = this.tasks.get(taskId); if (!task) throw new Error('Task not found'); const selected = task.proposedActions.filter((action) => actionIds.includes(action.id)); for (const action of selected) { task.logs.push(audit('User approved action', action.toolName, 'warning')); this.emit(task); const result = await runTool(action.toolName, action.args, this.context(taskId), true); task.findings.push(...findingsFor(action.toolName, result)); task.logs.push(audit(result.ok ? 'Approved action completed' : 'Approved action failed', result.ok ? (result.evidence ?? action.toolName) : (result.error ?? action.toolName), result.ok ? 'info' : 'error')) } task.proposedActions = []; task.status = selected.length ? 'done' : 'cancelled'; task.summary = selected.length ? 'Approved actions were processed.' : 'No action was selected.'; this.emit(task); return task }
  cancel(taskId: string) { const task = this.tasks.get(taskId); if (!task) throw new Error('Task not found'); task.logs.push(audit('User cancelled proposed actions', undefined, 'warning')); task.proposedActions = []; task.status = 'cancelled'; task.summary = 'No proposed actions were applied.'; this.emit(task); return task }
  stop(taskId: string) { const task = this.tasks.get(taskId); if (!task) throw new Error('Task not found'); this.controllers.get(taskId)?.abort(); task.status = 'cancelled'; task.summary = 'Stop requested. The current bounded OS command may finish before cancellation takes effect.'; task.logs.push(audit('User requested emergency task stop', undefined, 'warning')); this.emit(task); return task }
  delete(taskId: string) { this.controllers.get(taskId)?.abort(); this.controllers.delete(taskId); this.tasks.delete(taskId); this.repository.delete(taskId) }
  clear() { for (const controller of this.controllers.values()) controller.abort(); this.controllers.clear(); this.tasks.clear(); this.repository.clear() }
}
