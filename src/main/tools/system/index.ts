import type { ToolDefinition } from '../../../shared/types'
import { runPowerShell } from '../powershell'

const psTool = (name: string, description: string, script: string, timeout?: number): ToolDefinition => ({
  name, description, risk: 'safe', requiresApproval: false,
  async run() { try { const data = await runPowerShell<unknown>(script, timeout); return { ok: true, data, evidence: `${description} completed` } } catch (error) { return { ok: false, error: error instanceof Error ? error.message : String(error) } } }
})

export const systemTools: ToolDefinition[] = [
  psTool('system.getOverview', 'Read CPU, memory, OS, and system-drive health', `
    $os=Get-CimInstance Win32_OperatingSystem; $cpu=(Get-CimInstance Win32_Processor|Measure-Object LoadPercentage -Average).Average; $d=Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='C:'";
    [pscustomobject]@{cpuPercent=[math]::Round($cpu,1);totalMemoryGB=[math]::Round($os.TotalVisibleMemorySize/1MB,1);freeMemoryGB=[math]::Round($os.FreePhysicalMemory/1MB,1);memoryUsedPercent=[math]::Round((1-$os.FreePhysicalMemory/$os.TotalVisibleMemorySize)*100,1);os=$os.Caption;version=$os.Version;diskCUsedPercent=if($d){[math]::Round((1-$d.FreeSpace/$d.Size)*100,1)}else{$null};diskCFreeGB=if($d){[math]::Round($d.FreeSpace/1GB,1)}else{$null}}|ConvertTo-Json -Compress`),
  psTool('system.getTopProcesses', 'List processes using the most memory', `Get-Process|Sort-Object WorkingSet64 -Descending|Select-Object -First 12 @{n='name';e={$_.ProcessName}},@{n='pid';e={$_.Id}},@{n='memoryMB';e={[math]::Round($_.WorkingSet64/1MB,1)}},@{n='cpuSeconds';e={if($_.CPU){[math]::Round($_.CPU,1)}else{0}}}|ConvertTo-Json -Compress`),
  psTool('system.getDiskUsage', 'Read fixed-drive capacity and free space', `Get-CimInstance Win32_LogicalDisk -Filter 'DriveType=3'|ForEach-Object{[pscustomobject]@{drive=$_.DeviceID;totalGB=[math]::Round($_.Size/1GB,1);freeGB=[math]::Round($_.FreeSpace/1GB,1);usedPercent=[math]::Round((1-$_.FreeSpace/$_.Size)*100,1)}}|ConvertTo-Json -Compress`),
  psTool('system.getStartupApps', 'Read registry and Startup-folder application entries', `
    $items=@(); foreach($p in @('HKCU:\Software\Microsoft\Windows\CurrentVersion\Run','HKLM:\Software\Microsoft\Windows\CurrentVersion\Run')){if(Test-Path $p){$x=Get-ItemProperty $p; $x.PSObject.Properties|Where-Object{$_.Name -notmatch '^PS'}|ForEach-Object{$items += [pscustomobject]@{name=$_.Name;command=[string]$_.Value;source=$p}}}};
    foreach($f in Get-ChildItem "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup" -ErrorAction SilentlyContinue){$items += [pscustomobject]@{name=$f.Name;command=$f.FullName;source='Startup folder'}}; @($items)|ConvertTo-Json -Compress`),
  psTool('system.getRecentErrors', 'Read recent Windows application and system errors', `Get-WinEvent -FilterHashtable @{LogName='System','Application';Level=1,2;StartTime=(Get-Date).AddHours(-24)} -ErrorAction SilentlyContinue|Select-Object -First 15 @{n='time';e={$_.TimeCreated.ToString('o')}},LogName,ProviderName,Id,@{n='message';e={if($_.Message){$_.Message.Substring(0,[math]::Min(240,$_.Message.Length))}else{'No message'}}}|ConvertTo-Json -Compress`, 25_000),
  { name: 'system.killProcess', description: 'Stop a user-approved process by PID', risk: 'medium', requiresApproval: true, async run(args) { const pid = Math.round(Number(args.pid)); if (!Number.isInteger(pid) || pid <= 4 || pid === process.pid) return { ok: false, error: 'A valid non-system PID is required.' }; try { const data = await runPowerShell(`$p=Get-Process -Id ${pid} -ErrorAction Stop; $name=$p.ProcessName; Stop-Process -Id ${pid} -ErrorAction Stop; [pscustomobject]@{pid=${pid};name=$name}|ConvertTo-Json -Compress`); return { ok: true, data, evidence: `Stopped PID ${pid}` } } catch (error) { return { ok: false, error: error instanceof Error ? error.message : String(error) } } } }
]
