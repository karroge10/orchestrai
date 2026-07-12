import { promises as fs } from 'node:fs'
import type { Stats } from 'node:fs'
import { basename, dirname, extname, isAbsolute, join, resolve } from 'node:path'
import { homedir } from 'node:os'
import type { ToolDefinition, ToolResult } from '../../../shared/types'
import { runPowerShell } from '../powershell'

const roots = () => ['Desktop', 'Downloads', 'Documents', 'Videos', 'Pictures'].map((x) => join(homedir(), x))
const toolPath=(value:unknown,context:{e2e?:{enabled:true;fixtureRoot:string}})=>{const text=String(value??'');return context.e2e?.enabled&&!isAbsolute(text)?resolve(context.e2e.fixtureRoot,text):resolve(text)}
async function walk(root: string, visit: (path: string, stat: Stats) => void, max = 6000): Promise<void> {
  const queue = [root]; let seen = 0
  while (queue.length && seen < max) { const dir = queue.shift()!; let entries; try { entries = await fs.readdir(dir, { withFileTypes: true }) } catch { continue }
    for (const entry of entries) { if (++seen > max) break; const path = join(dir, entry.name); if (entry.isDirectory()) queue.push(path); else { try { visit(path, await fs.stat(path) as Stats) } catch { /* inaccessible file */ } } }
  }
}

const search: ToolDefinition = { name: 'files.search', description: 'Search common user folders by name, extension, and date', risk: 'safe', requiresApproval: false, async run(args, context) {
  const query = String(args.query ?? '').toLowerCase(); const extension = String(args.extension ?? '').toLowerCase().replace(/^\./, ''); const after = args.modifiedAfter ? new Date(String(args.modifiedAfter)).getTime() : 0; const matches: unknown[] = []
  const searchRoots = context.e2e?.enabled ? [context.e2e.fixtureRoot] : roots()
  for (const root of searchRoots) await walk(root, (path, stat) => { const name = basename(path); if ((!query || name.toLowerCase().includes(query)) && (!extension || extname(name).slice(1).toLowerCase() === extension) && stat.mtimeMs >= after && matches.length < 100) matches.push({ path, name, size: stat.size, modifiedAt: stat.mtime.toISOString() }) })
  return { ok: true, data: matches, evidence: `${matches.length} matching files` }
} }
const large: ToolDefinition = { name: 'files.listLargeFiles', description: 'Find large files in common user folders', risk: 'safe', requiresApproval: false, async run(args) {
  const threshold = Number(args.thresholdMB ?? 500) * 1024 * 1024; const limit = Number(args.limit ?? 30); const matches: {path:string;name:string;size:number;modifiedAt:string}[] = []
  for (const root of roots()) await walk(root, (path, stat) => { const size=Number(stat.size); if (size >= threshold) matches.push({ path, name: basename(path), size, modifiedAt: stat.mtime.toISOString() }) })
  matches.sort((a,b)=>b.size-a.size); return { ok: true, data: matches.slice(0, limit), evidence: `${matches.length} large files found` }
} }
const zip: ToolDefinition = { name: 'files.createZip', description: 'Create a ZIP archive from a local file or folder', risk: 'medium', requiresApproval: true, async run(args,context): Promise<ToolResult> {
  if(!args.source)return {ok:false,error:'A source path is required'};const source = toolPath(args.source,context); const destination = args.destination?toolPath(args.destination,context):resolve(`${source}.zip`)
  try { await fs.access(source); const exists = await fs.access(destination).then(()=>true).catch(()=>false); if (exists && !args.overwrite) return {ok:false,error:'Destination already exists; overwrite was not approved'}
    const q=(s:string)=>`'${s.replaceAll("'", "''")}'`; await runPowerShell(`Compress-Archive -LiteralPath ${q(source)} -DestinationPath ${q(destination)}${exists?' -Force':''}; [pscustomobject]@{path=${q(destination)}}|ConvertTo-Json -Compress`, 120_000); return {ok:true,data:{path:destination},evidence:`Created ${destination}`}
  } catch(error){return {ok:false,error:error instanceof Error?error.message:String(error)}}
} }
const move: ToolDefinition = { name: 'files.move', description: 'Move a user-approved file or folder to a new local path', risk: 'medium', requiresApproval: true, async run(args,context) { const source=toolPath(args.source,context);const destination=toolPath(args.destination,context);if(!args.source||!args.destination)return{ok:false,error:'Source and destination paths are required.'};try{await fs.access(source);const exists=await fs.access(destination).then(()=>true).catch(()=>false);if(exists&&!args.overwrite)return{ok:false,error:'Destination exists and overwrite was not approved.'};await fs.mkdir(dirname(destination),{recursive:true});try{await fs.rename(source,destination)}catch(error){if((error as NodeJS.ErrnoException).code!=='EXDEV')throw error;await fs.cp(source,destination,{recursive:true,errorOnExist:!args.overwrite,force:Boolean(args.overwrite)});await fs.rm(source,{recursive:true})}return{ok:true,data:{source,destination},evidence:`Moved ${source} to ${destination}`}}catch(error){return{ok:false,error:error instanceof Error?error.message:String(error)}}} }
const recycle: ToolDefinition = { name: 'files.delete', description: 'Move an approved file or folder to the Windows Recycle Bin', risk: 'high', requiresApproval: true, async run(args,context) { const path=toolPath(args.path,context);if(!args.path)return{ok:false,error:'A path is required.'};try{await fs.access(path);const stat=await fs.stat(path);const quoted=`'${path.replaceAll("'","''")}'`;const method=stat.isDirectory()?`[Microsoft.VisualBasic.FileIO.FileSystem]::DeleteDirectory(${quoted},'OnlyErrorDialogs','SendToRecycleBin')`:`[Microsoft.VisualBasic.FileIO.FileSystem]::DeleteFile(${quoted},'OnlyErrorDialogs','SendToRecycleBin')`;const data=await runPowerShell(`Add-Type -AssemblyName Microsoft.VisualBasic;${method};[pscustomobject]@{path=${quoted};recycled=$true}|ConvertTo-Json -Compress`,30_000);return{ok:true,data,evidence:`Moved to Recycle Bin: ${path}`}}catch(error){return{ok:false,error:error instanceof Error?error.message:String(error)}}} }
export const fileTools = [search, large, zip, move, recycle]
