import type { Settings } from './types'

export const DEFAULT_SETTINGS: Settings = {
  provider: 'local',
  localModelUrl: 'http://localhost:11434/api/chat',
  localModelName: 'qwen3.5:9b',
  openAIModel: 'gpt-5.6',
  anthropicModel: 'claude-sonnet-5',
  screenshotPermission: false,
  cloudScreenshots: false,
  agentControlMode: false,
  globalHotkey: 'CommandOrControl+Space',
  taskHistoryLimit: 100
}

export const IPC = {
  RUN_TASK: 'task:run', TASK_UPDATE: 'task:update', GET_TASKS: 'task:list', APPROVE: 'task:approve', CANCEL: 'task:cancel',
  CANCEL_TASK: 'task:stop', DELETE_TASK: 'task:delete', CLEAR_TASKS: 'task:clear',
  CAPTURE: 'screen:capture', GET_SETTINGS: 'settings:get', SAVE_SETTINGS: 'settings:save', SETTINGS_CHANGED: 'settings:changed',
  CREDENTIAL_STATUS: 'credentials:status', CREDENTIAL_SAVE: 'credentials:save', CREDENTIAL_DELETE: 'credentials:delete', PROVIDER_TEST: 'provider:test', TOOLS_LIST: 'tools:list',
  PALETTE_SUBMIT: 'palette:submit', PALETTE_CLOSE: 'palette:close'
} as const
