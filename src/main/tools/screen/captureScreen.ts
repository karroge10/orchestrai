import { app, desktopCapturer, screen } from 'electron'
import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import type { ToolDefinition } from '../../../shared/types'

export const captureScreen: ToolDefinition = { name: 'screen.capture', description: 'Capture the primary display to the private app-data folder', risk: 'safe', requiresApproval: false, async run(_args, context) {
  if (!context.screenshotPermission) return { ok: false, error: 'Screenshot permission is not enabled.' }
  try { const display = screen.getPrimaryDisplay(); const size = display.size; const sources = await desktopCapturer.getSources({ types:['screen'], thumbnailSize:size }); const source = sources.find((x)=>x.display_id===String(display.id)) ?? sources[0]; if(!source) return {ok:false,error:'No display source is available'}
    const folder=join(app.getPath('userData'),'screenshots'); await fs.mkdir(folder,{recursive:true}); const path=join(folder,`capture-${Date.now()}.png`); await fs.writeFile(path,source.thumbnail.toPNG()); return {ok:true,data:{path,width:source.thumbnail.getSize().width,height:source.thumbnail.getSize().height},evidence:`Screenshot saved locally: ${path}`}
  } catch(error){return {ok:false,error:error instanceof Error?error.message:String(error)}}
} }
