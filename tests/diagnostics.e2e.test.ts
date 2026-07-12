import { spawn,type ChildProcess } from 'node:child_process'
import { afterAll,describe,expect,it } from 'vitest'
import { runTool } from '../src/main/tools/registry'

const context={taskId:'diagnostics-e2e'}
let harmless:ChildProcess|undefined
afterAll(()=>{if(harmless?.pid){try{process.kill(harmless.pid)}catch{/* already stopped */}}})
describe('read-only question and diagnostic E2E',()=>{
  it('answers the slow-PC evidence flow from structured tools',async()=>{for(const tool of ['system.getOverview','system.getTopProcesses','system.getDiskUsage','system.getStartupApps','system.getRecentErrors']){const result=await runTool(tool,{},context);expect(result.ok,`${tool}: ${result.error}`).toBe(true)}} ,60_000)
  it('deterministically identifies free space and the fullest fixed drive',async()=>{const result=await runTool('system.getDiskUsage',{},context);expect(result.ok).toBe(true);const rows=(Array.isArray(result.data)?result.data:[result.data]) as {drive:string;freeGB:number;usedPercent:number}[];expect(rows.length).toBeGreaterThan(0);const fullest=[...rows].sort((a,b)=>b.usedPercent-a.usedPercent)[0]!;expect(fullest.drive).toMatch(/^[A-Z]:$/);expect(fullest.freeGB).toBeGreaterThanOrEqual(0)})
  it('deterministically identifies the highest-memory process sample',async()=>{const result=await runTool('system.getTopProcesses',{},context);expect(result.ok).toBe(true);const rows=(Array.isArray(result.data)?result.data:[result.data]) as {name:string;pid:number;memoryMB:number}[];expect(rows[0]?.memoryMB).toBeGreaterThanOrEqual(rows.at(-1)?.memoryMB??0);expect(rows[0]?.pid).toBeGreaterThan(0)})
  it('stops only a harmless harness-launched process in E2E mode',async()=>{harmless=spawn('powershell.exe',['-NoProfile','-NonInteractive','-Command','Start-Sleep -Seconds 60'],{windowsHide:true,stdio:'ignore'});if(!harmless.pid)throw new Error('No harmless PID');const e2e={taskId:'diagnostics-e2e',e2e:{enabled:true as const,fixtureRoot:process.env.TEMP!,allowedProcessIds:[harmless.pid]}};expect((await runTool('system.killProcess',{pid:harmless.pid},e2e)).error).toBe('Approval required');const stopped=await runTool('system.killProcess',{pid:harmless.pid},e2e,true);expect(stopped.ok).toBe(true);expect(stopped.data).toMatchObject({pid:harmless.pid})})
})
