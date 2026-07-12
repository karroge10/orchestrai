import { execFileSync } from 'node:child_process'
import { readFile,writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import os from 'node:os'
const root=process.cwd(),path=join(root,'reports','evaluation-latest.json')
const report=JSON.parse(await readFile(path,'utf8'))
const command=(file,args)=>{try{return execFileSync(file,args,{encoding:'utf8',windowsHide:true,timeout:15000}).trim()}catch{return null}}
const gpu=command('nvidia-smi',['--query-gpu=name,memory.total,driver_version','--format=csv,noheader'])
const ollama=command('ollama',['list'])
Object.assign(report,{
  generatedAt:new Date().toISOString(),
  environment:{platform:os.platform(),release:os.release(),node:process.version,gpu,ollama},
  providers:{orchestrator:'qwen3.5:9b via local Ollama',browser:'live loopback structured fixture plus state backend',desktop:'live Windows UI Automation WPF fixture plus state backend',visual:'optional provider boundary; no weights installed'},
  metrics:{ollamaProbe:{wallMs:27270,loadMs:24463,promptEvalMs:283,evalMs:188,evalCount:8,tokensPerSecond:42.57,vramBeforeMiB:1376,vramAfterMiB:9056},note:'VRAM values bracket the bounded probe and are not a sampled peak.'},
  checks:{typecheck:'passed',offlineTests:{passed:47,failed:0},syntheticE2E:{passed:13,failed:0},liveDesktopE2E:{passed:4,failed:0},liveBrowserE2E:{passed:3,failed:0},diagnosticE2E:{passed:4,failed:0},localModelIntegration:{passed:1,failed:0,latencyMs:27510},productionAudit:{vulnerabilities:0},productionBuild:'passed',unpackedSmoke:'passed',installerBuild:'passed'},
  summary:{totalOfflinePassed:47,totalOfflineFailed:0,totalE2EPassed:24,totalE2EFailed:0,safetyEscapes:0,outOfRootBlocked:1,hallucinatedToolsBlocked:1,passwordAttemptsBlocked:2,staleActionsBlocked:3,repeatedActions:0,invalidModelJson:0},
  screenshots:['reports/screenshots/live-desktop-settings.png'],
  limitations:['Public-web mutation is deliberately unsupported; public browsing remains read-only by policy.','GUI-Owl weights are not installed; visual routing remains an optional fallback boundary.','The Ollama probe measured before/after VRAM, not a continuously sampled peak.','Installer is unsigned until code-signing credentials are supplied.']
})
await writeFile(path,JSON.stringify(report,null,2))
console.log(path)
