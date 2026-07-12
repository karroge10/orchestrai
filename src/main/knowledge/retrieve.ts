import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import { app } from 'electron'

const keywordMap: Record<string,string[]> = {'windows-performance.md':['slow','lag','performance','memory','cpu','disk'],'steam-download-issues.md':['steam','download'],'nvidia-driver-issues.md':['nvidia','graphics','driver','gpu']}
export async function retrieveKnowledge(input:string):Promise<string[]>{const text=input.toLowerCase();const root=join(app.isPackaged?process.resourcesPath:process.cwd(),'knowledge');const result:string[]=[];for(const [file,keywords] of Object.entries(keywordMap)){if(keywords.some((k)=>text.includes(k))){try{result.push((await fs.readFile(join(root,file),'utf8')).slice(0,1800))}catch{/* optional knowledge */}}}return result}
