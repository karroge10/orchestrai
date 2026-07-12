export type TaskStatus = 'idle' | 'planning' | 'running' | 'needs_approval' | 'done' | 'failed' | 'cancelled'
export type StepStatus = 'pending' | 'running' | 'done' | 'failed'
export type Risk = 'safe' | 'medium' | 'high'
export type CapabilityRoute = 'system_tool' | 'file_tool' | 'structured_browser' | 'desktop_accessibility' | 'visual_computer_use' | 'ask_user' | 'unsupported'

export interface TaskStep { id: string; title: string; tool?: string; status: StepStatus; result?: string }
export interface Finding { id: string; severity: 'info' | 'low' | 'medium' | 'high'; title: string; description: string; evidence?: string }
export interface ProposedAction { id: string; title: string; description: string; risk: Risk; reversible: boolean; toolName: string; args: Record<string, unknown> }
export interface AuditLog { id: string; timestamp: string; message: string; detail?: string; level: 'info' | 'warning' | 'error' }
export interface Task { id: string; input: string; status: TaskStatus; createdAt: string; updatedAt: string; steps: TaskStep[]; findings: Finding[]; proposedActions: ProposedAction[]; logs: AuditLog[]; screenshotPath?: string; summary?: string; provider?: ProviderName; plannerFallback?: boolean; routes?: CapabilityRoute[] }

export interface E2ETestContext { enabled: true; fixtureRoot: string; allowedProcessIds: number[] }
export interface ToolContext { taskId: string; cwd?: string; dryRun?: boolean; agentControlMode?: boolean; screenshotPermission?: boolean; abortSignal?: AbortSignal; e2e?: E2ETestContext }
export interface ToolResult { ok: boolean; data?: unknown; error?: string; evidence?: string }
export interface ToolDefinition { name: string; description: string; risk: Risk; requiresApproval: boolean; run: (args: Record<string, unknown>, context: ToolContext) => Promise<ToolResult> }
export interface PlanStep { title: string; tool: string; args: Record<string, unknown> }
export interface TaskPlan { goal: string; steps: PlanStep[]; needsScreenshot: boolean; risk: Risk; explanation?: string }
export type ProviderName = 'mock' | 'local' | 'openai' | 'anthropic'
export interface Settings { provider: ProviderName; localModelUrl: string; localModelName: string; openAIModel: string; anthropicModel: string; screenshotPermission: boolean; cloudScreenshots: boolean; agentControlMode: boolean; globalHotkey: string; taskHistoryLimit: number; e2eTestMode?: boolean; e2eFixtureRoot?: string }
export interface CredentialStatus { openai: boolean; anthropic: boolean; secureStorageAvailable: boolean }
export interface ProviderTestResult { ok: boolean; provider: ProviderName; message: string; latencyMs?: number }
export interface ToolDescriptor { name: string; description: string; risk: Risk; requiresApproval: boolean }

export interface CompanionApi {
  runTask(input: string): Promise<Task>
  getTasks(): Promise<Task[]>
  approveActions(taskId: string, actionIds: string[]): Promise<Task>
  cancelActions(taskId: string): Promise<Task>
  cancelTask(taskId: string): Promise<Task>
  deleteTask(taskId: string): Promise<void>
  clearTaskHistory(): Promise<void>
  captureScreen(taskId?: string): Promise<ToolResult>
  getSettings(): Promise<Settings>
  saveSettings(settings: Settings): Promise<Settings>
  getCredentialStatus(): Promise<CredentialStatus>
  saveCredential(provider: 'openai' | 'anthropic', value: string): Promise<CredentialStatus>
  deleteCredential(provider: 'openai' | 'anthropic'): Promise<CredentialStatus>
  testProvider(settings?: Settings): Promise<ProviderTestResult>
  getTools(): Promise<ToolDescriptor[]>
  onTaskUpdate(callback: (task: Task) => void): () => void
  onPaletteSubmit(callback: (input: string) => void): () => void
  onSettingsChanged(callback: (settings: Settings) => void): () => void
  closePalette(): Promise<void>
}
