import { extname } from 'node:path'
import type { TaskPlan } from '../../shared/types'

export function deterministicPlanner(input: string): TaskPlan {
  const text = input.toLowerCase()
  if (/slow|lag|freez|performance|\bram\b|\bcpu\b/.test(text)) return { goal:'Diagnose PC performance', needsScreenshot:false, risk:'safe', steps:[
    {title:'Check CPU, memory, and Windows health',tool:'system.getOverview',args:{}},{title:'Find resource-heavy processes',tool:'system.getTopProcesses',args:{}},{title:'Check fixed-drive free space',tool:'system.getDiskUsage',args:{}},{title:'Review startup applications',tool:'system.getStartupApps',args:{}},{title:'Read recent Windows errors',tool:'system.getRecentErrors',args:{}}
  ]}
  if (/clean.*(download|desktop)|large files?/.test(text)) return {goal:'Inspect files that may be safe to organize',needsScreenshot:false,risk:'safe',steps:[{title:'Find large files',tool:'files.listLargeFiles',args:{thresholdMB:250,limit:40}}]}
  if (/rename.*report draft.*quarterly report/.test(text)) return {goal:'Rename the synthetic report',needsScreenshot:false,risk:'medium',steps:[{title:'Rename report draft.txt',tool:'files.move',args:{source:'Inbox/report draft.txt',destination:'Inbox/quarterly report.txt'}}]}
  if (/move.*notes old.*archive/.test(text)) return {goal:'Archive the synthetic notes',needsScreenshot:false,risk:'medium',steps:[{title:'Move notes old.txt to Archive',tool:'files.move',args:{source:'Inbox/notes old.txt',destination:'Archive/notes old.txt'}}]}
  if (/organize.*inbox|moving the image.*images/.test(text)) return {goal:'Organize the synthetic Inbox',needsScreenshot:false,risk:'medium',steps:[{title:'Move photo sample.jpg into Images',tool:'files.move',args:{source:'Inbox/photo sample.jpg',destination:'Inbox/Images/photo sample.jpg'}}]}
  if (/compress.*demo folder|demo\.zip/.test(text)) return {goal:'Compress the synthetic Demo folder',needsScreenshot:false,risk:'medium',steps:[{title:'Create Demo.zip',tool:'files.createZip',args:{source:'Projects/Demo',destination:'Demo.zip'}}]}
  if (/recycle bin/.test(text)&&/photo sample/.test(text)) return {goal:'Recycle the synthetic photo',needsScreenshot:false,risk:'high',steps:[{title:'Move photo sample.jpg to the Recycle Bin',tool:'files.delete',args:{path:'Inbox/photo sample.jpg'}}]}
  if (/free space.*fullest|which fixed drive is fullest/.test(text)) return {goal:'Report fixed-drive free space',needsScreenshot:false,risk:'safe',steps:[{title:'Read fixed drive usage',tool:'system.getDiskUsage',args:{}}]}
  if (/process.*most memory|highest.memory process/.test(text)) return {goal:'Report the highest-memory process sample',needsScreenshot:false,risk:'safe',steps:[{title:'Read the top process sample',tool:'system.getTopProcesses',args:{}}]}
  if (/active tab/.test(text)&&/test application/.test(text)) return {goal:'Inspect the harmless test application',needsScreenshot:false,risk:'safe',steps:[{title:'Inspect the active tab',tool:'desktop.inspect',args:{}}]}
  if (/open the settings tab/.test(text)) return {goal:'Open Settings in the harmless test application',needsScreenshot:false,risk:'medium',steps:[{title:'Inspect the current tab',tool:'desktop.inspect',args:{}},{title:'Select Settings',tool:'desktop.selectTab',args:{tab:'Settings',observedRevision:1}}]}
  if (/support email/.test(text)&&/test site/.test(text)) return {goal:'Find the synthetic support email',needsScreenshot:false,risk:'safe',steps:[{title:'Inspect the local test site',tool:'browser.inspect',args:{}}]}
  if (/products page.*cheapest|cheapest synthetic product/.test(text)) return {goal:'Find the cheapest synthetic product',needsScreenshot:false,risk:'safe',steps:[{title:'Navigate to Products',tool:'browser.navigate',args:{page:'products'}},{title:'Inspect products',tool:'browser.inspect',args:{}}]}
  if (/find|locate|where is|search/.test(text)) { const quoted=input.match(/["“](.+?)["”]/)?.[1]; const words=input.replace(/find|locate|where is|search for|the file/gi,' ').trim(); const query=quoted??words; const extension=extname(query).slice(1); return {goal:'Find matching files',needsScreenshot:false,risk:'safe',steps:[{title:'Search common user folders',tool:'files.search',args:{query:query.replace(/\.[a-z0-9]+$/i,''),...(extension?{extension}:{})}}]} }
  if (/zip|compress|archive/.test(text)) { const paths=[...input.matchAll(/["“](.+?)["”]/g)].map((m)=>m[1]); return {goal:'Prepare a ZIP archive',needsScreenshot:false,risk:'medium',steps:[{title:'Prepare archive for approval',tool:'files.createZip',args:{source:paths[0]??'',...(paths[1]?{destination:paths[1]}:{})}}]} }
  if (/screenshot|capture.*screen/.test(text)) return {goal:'Capture the primary display',needsScreenshot:true,risk:'safe',steps:[{title:'Capture primary display',tool:'screen.capture',args:{}}]}
  if (/record.*(screen|demo|video)|screen.*record/.test(text)) return {goal:'Toggle Windows screen recording',needsScreenshot:false,risk:'medium',steps:[{title:'Start or stop Windows Game Bar recording',tool:'screen.recordToggle',args:{}}]}
  return { goal:'Clarify the requested computer task', needsScreenshot:false, risk:'safe', steps:[] }
}
