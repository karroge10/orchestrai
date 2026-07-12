import { app, BrowserWindow, globalShortcut, ipcMain, net, protocol, session, type IpcMainInvokeEvent } from 'electron'
import { join, normalize, resolve, sep } from 'node:path'
import { pathToFileURL } from 'node:url'
import Store from 'electron-store'
import { DEFAULT_SETTINGS, IPC } from '../shared/constants'
import type { Settings, Task } from '../shared/types'
import { AgentOrchestrator } from './orchestrator/agentOrchestrator'
import { ModelRouter } from './orchestrator/modelRouter'
import { SecretStore } from './storage/secretStore'
import { TaskRepository } from './storage/taskRepository'
import { listTools, runTool } from './tools/registry'

protocol.registerSchemesAsPrivileged([{ scheme: 'companion-file', privileges: { standard: true, secure: true, supportFetchAPI: true } }])
const settingsStore = new Store<{ settings: Settings }>({ name: 'settings', defaults: { settings: DEFAULT_SETTINGS } })
function e2eRuntime(){const raw=process.env.ORCHESTRAI_E2E_ROOT;if(!raw)return{};const root=resolve(raw);const base=resolve(join(process.env.TEMP ?? app.getPath('temp'),'orchestrai-e2e'));if(!root.startsWith(base+sep))throw new Error('E2E root must be under the disposable test base.');return{e2eTestMode:true,e2eFixtureRoot:root}}
const getSettings = (): Settings => ({ ...DEFAULT_SETTINGS, ...settingsStore.get('settings'), ...e2eRuntime() })
const secrets = new SecretStore()
const tasks = new TaskRepository(() => getSettings().taskHistoryLimit)
const router = new ModelRouter(getSettings, secrets, listTools)
let mainWindow: BrowserWindow | null = null
let paletteWindow: BrowserWindow | null = null
const broadcast = (task: Task) => { for (const win of BrowserWindow.getAllWindows()) win.webContents.send(IPC.TASK_UPDATE, task) }
const orchestrator = new AgentOrchestrator(broadcast, tasks, router, getSettings)

function isTrustedUrl(url: string): boolean { if (process.env.ELECTRON_RENDERER_URL) return url.startsWith(process.env.ELECTRON_RENDERER_URL); return url.startsWith('file://') }
function assertTrusted(event: IpcMainInvokeEvent): void { const url = event.senderFrame?.url ?? event.sender.getURL(); if (!isTrustedUrl(url)) throw new Error('Blocked IPC call from an untrusted renderer.') }
function handle(channel: string, handler: (event: IpcMainInvokeEvent, ...args: unknown[]) => unknown) { ipcMain.handle(channel, async (event, ...args) => { assertTrusted(event); return handler(event, ...args) }) }
function rendererUrl(win: BrowserWindow, palette = false) { if (process.env.ELECTRON_RENDERER_URL) void win.loadURL(`${process.env.ELECTRON_RENDERER_URL}${palette ? '?palette=1' : ''}`); else void win.loadFile(join(__dirname, '../renderer/index.html'), palette ? { query: { palette: '1' } } : undefined) }
function secureWindow(win: BrowserWindow) { win.webContents.setWindowOpenHandler(() => ({ action: 'deny' })); win.webContents.on('will-navigate', (event, url) => { if (!isTrustedUrl(url)) event.preventDefault() }); win.webContents.on('render-process-gone', (_event, details) => console.error('Renderer process exited', details.reason, details.exitCode)) }
function createMain() { mainWindow = new BrowserWindow({ width: 1440, height: 900, minWidth: 1050, minHeight: 680, backgroundColor: '#090b10', title: 'OrchestrAI', show: false, webPreferences: { preload: join(__dirname, '../preload/index.cjs'), sandbox: true, contextIsolation: true, nodeIntegration: false, webSecurity: true } }); secureWindow(mainWindow); rendererUrl(mainWindow); mainWindow.once('ready-to-show', () => mainWindow?.show()); mainWindow.on('closed', () => { mainWindow = null; if (process.platform !== 'darwin') { paletteWindow?.destroy(); paletteWindow = null; app.quit() } }) }
function createPalette() { paletteWindow = new BrowserWindow({ width: 620, height: 300, resizable: false, frame: false, transparent: true, alwaysOnTop: true, skipTaskbar: true, show: false, backgroundColor: '#00000000', webPreferences: { preload: join(__dirname, '../preload/index.cjs'), sandbox: true, contextIsolation: true, nodeIntegration: false, webSecurity: true } }); secureWindow(paletteWindow); rendererUrl(paletteWindow, true); paletteWindow.on('blur', () => paletteWindow?.hide()); paletteWindow.on('closed', () => { paletteWindow = null }) }
function showPalette() { if (!paletteWindow) createPalette(); paletteWindow!.center(); paletteWindow!.show(); paletteWindow!.focus() }
function syncGlobalHotkeys() { globalShortcut.unregisterAll(); const settings = getSettings(); if (!globalShortcut.register(settings.globalHotkey, showPalette)) globalShortcut.register('CommandOrControl+Shift+Space', showPalette); if (settings.agentControlMode) globalShortcut.register('Escape', () => { settingsStore.set('settings', { ...getSettings(), agentControlMode: false }); syncGlobalHotkeys(); broadcastSettings() }) }
function broadcastSettings() { const settings = getSettings(); for (const win of BrowserWindow.getAllWindows()) win.webContents.send(IPC.SETTINGS_CHANGED, settings) }
function validateSettings(input: unknown): Settings { const value = { ...DEFAULT_SETTINGS, ...(input as Partial<Settings>) }; value.taskHistoryLimit = Math.max(10, Math.min(1000, Math.round(Number(value.taskHistoryLimit) || 100))); if (!/^[\w+]+(?:OrControl)?(?:\+[\w]+)+$/i.test(value.globalHotkey)) value.globalHotkey = DEFAULT_SETTINGS.globalHotkey; try { const url = new URL(value.localModelUrl); if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1', '::1'].includes(url.hostname))) throw new Error() } catch { throw new Error('Local model URL must use HTTPS or local HTTP.') } return value }

app.whenReady().then(() => {
  const screenshotRoot = resolve(join(app.getPath('userData'), 'screenshots'))
  protocol.handle('companion-file', (request) => { const raw = decodeURIComponent(new URL(request.url).pathname).replace(/^\//, ''); const full = resolve(normalize(raw)); if (full !== screenshotRoot && !full.startsWith(`${screenshotRoot}\\`)) return new Response('Forbidden', { status: 403 }); return net.fetch(pathToFileURL(full).toString()) })
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false))
  createMain(); createPalette(); syncGlobalHotkeys(); if(process.env.ORCHESTRAI_SMOKE_EXIT_MS){const delay=Math.max(1000,Number(process.env.ORCHESTRAI_SMOKE_EXIT_MS)||5000);setTimeout(()=>{console.log('PACKAGED_SMOKE_READY');app.quit()},delay)} app.on('activate', () => { if (!mainWindow) createMain() })
})
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
app.on('will-quit', () => globalShortcut.unregisterAll())

handle(IPC.RUN_TASK, async (_event, input) => { if (typeof input !== 'string' || !input.trim() || input.length > 10_000) throw new Error('Task input must contain 1–10,000 characters.'); if (!mainWindow) createMain(); mainWindow?.show(); mainWindow?.focus(); return orchestrator.run(input.trim()) })
handle(IPC.GET_TASKS, () => orchestrator.list())
handle(IPC.APPROVE, (_event, taskId, ids) => orchestrator.approve(String(taskId), Array.isArray(ids) ? ids.map(String) : []))
handle(IPC.CANCEL, (_event, taskId) => orchestrator.cancel(String(taskId)))
handle(IPC.CANCEL_TASK, (_event, taskId) => orchestrator.stop(String(taskId)))
handle(IPC.DELETE_TASK, (_event, taskId) => orchestrator.delete(String(taskId)))
handle(IPC.CLEAR_TASKS, () => orchestrator.clear())
handle(IPC.CAPTURE, async (_event, taskId) => { const settings = getSettings(); return runTool('screen.capture', {}, { taskId: typeof taskId === 'string' ? taskId : 'manual', screenshotPermission: settings.screenshotPermission }) })
handle(IPC.GET_SETTINGS, () => getSettings())
handle(IPC.SAVE_SETTINGS, (_event, input) => { const settings = validateSettings(input); settingsStore.set('settings', settings); syncGlobalHotkeys(); broadcastSettings(); return settings })
handle(IPC.CREDENTIAL_STATUS, () => secrets.status())
handle(IPC.CREDENTIAL_SAVE, (_event, provider, value) => { if (provider !== 'openai' && provider !== 'anthropic') throw new Error('Unsupported credential provider.'); if (typeof value !== 'string') throw new Error('Credential must be text.'); secrets.save(provider, value); return secrets.status() })
handle(IPC.CREDENTIAL_DELETE, (_event, provider) => { if (provider !== 'openai' && provider !== 'anthropic') throw new Error('Unsupported credential provider.'); secrets.delete(provider); return secrets.status() })
handle(IPC.PROVIDER_TEST, (_event, input) => router.test(input ? validateSettings(input) : getSettings()))
handle(IPC.TOOLS_LIST, () => listTools())
handle(IPC.PALETTE_CLOSE, () => paletteWindow?.hide())
