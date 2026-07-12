import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '../shared/constants'
import type { CompanionApi, Settings, Task } from '../shared/types'

const api: CompanionApi = {
  runTask: (input) => ipcRenderer.invoke(IPC.RUN_TASK, input), getTasks: () => ipcRenderer.invoke(IPC.GET_TASKS), approveActions: (taskId, ids) => ipcRenderer.invoke(IPC.APPROVE, taskId, ids), cancelActions: (taskId) => ipcRenderer.invoke(IPC.CANCEL, taskId), cancelTask: (taskId) => ipcRenderer.invoke(IPC.CANCEL_TASK, taskId), deleteTask: (taskId) => ipcRenderer.invoke(IPC.DELETE_TASK, taskId), clearTaskHistory: () => ipcRenderer.invoke(IPC.CLEAR_TASKS), captureScreen: (taskId) => ipcRenderer.invoke(IPC.CAPTURE, taskId), getSettings: () => ipcRenderer.invoke(IPC.GET_SETTINGS), saveSettings: (settings: Settings) => ipcRenderer.invoke(IPC.SAVE_SETTINGS, settings), getCredentialStatus: () => ipcRenderer.invoke(IPC.CREDENTIAL_STATUS), saveCredential: (provider, value) => ipcRenderer.invoke(IPC.CREDENTIAL_SAVE, provider, value), deleteCredential: (provider) => ipcRenderer.invoke(IPC.CREDENTIAL_DELETE, provider), testProvider: (settings) => ipcRenderer.invoke(IPC.PROVIDER_TEST, settings), getTools: () => ipcRenderer.invoke(IPC.TOOLS_LIST), closePalette: () => ipcRenderer.invoke(IPC.PALETTE_CLOSE),
  onTaskUpdate: (callback) => { const listener = (_event: Electron.IpcRendererEvent, task: Task) => callback(task); ipcRenderer.on(IPC.TASK_UPDATE, listener); return () => ipcRenderer.removeListener(IPC.TASK_UPDATE, listener) },
  onPaletteSubmit: (callback) => { const listener = (_event: Electron.IpcRendererEvent, input: string) => callback(input); ipcRenderer.on(IPC.PALETTE_SUBMIT, listener); return () => ipcRenderer.removeListener(IPC.PALETTE_SUBMIT, listener) },
  onSettingsChanged: (callback) => { const listener = (_event: Electron.IpcRendererEvent, settings: Settings) => callback(settings); ipcRenderer.on(IPC.SETTINGS_CHANGED, listener); return () => ipcRenderer.removeListener(IPC.SETTINGS_CHANGED, listener) }
}
contextBridge.exposeInMainWorld('companion', api)
