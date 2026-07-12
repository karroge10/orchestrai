import { createHash, randomUUID } from 'node:crypto'
import { promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'

export interface FixtureManifestEntry { path:string; sha256:string; size:number }
export interface Fixture { runId:string; root:string; manifest:FixtureManifestEntry[] }
const contents:Record<string,string>={
  'Inbox/report draft.txt':'Synthetic quarterly draft\n', 'Inbox/photo sample.jpg':'synthetic-jpeg-fixture', 'Inbox/notes old.txt':'Synthetic archived notes\n',
  'Projects/Demo/readme.txt':'Synthetic demo project\n', 'Videos/older demo.mp4':'older synthetic video', 'Videos/newest demo.mp4':'newest synthetic video'
}
const hash=(value:Buffer|string)=>createHash('sha256').update(value).digest('hex')

export async function createFixture(runId=randomUUID()):Promise<Fixture>{
  const root=join(tmpdir(),'orchestrai-e2e',runId)
  for(const [name,value] of Object.entries(contents)){const path=join(root,name);await fs.mkdir(join(path,'..'),{recursive:true});await fs.writeFile(path,value)}
  const now=Date.now();await fs.utimes(join(root,'Videos/older demo.mp4'),new Date(now-86_400_000),new Date(now-86_400_000));await fs.utimes(join(root,'Videos/newest demo.mp4'),new Date(now),new Date(now))
  await fs.mkdir(join(root,'Archive'),{recursive:true});await fs.mkdir(join(root,'state'),{recursive:true});await fs.mkdir(join(root,'site'),{recursive:true})
  await fs.writeFile(join(root,'state/browser.json'),JSON.stringify({page:'home',supportEmail:'support@synthetic.invalid',products:[{name:'Red Widget',price:20,category:'A'},{name:'Blue Widget',price:12,category:'B'},{name:'Green Widget',price:15,category:'B'}],revision:1},null,2))
  await fs.writeFile(join(root,'state/desktop.json'),JSON.stringify({activeTab:'Home',normalField:'',passwordField:'',saveEnabled:false,revision:1,windowBounds:{x:100,y:100,width:640,height:480}},null,2))
  await fs.writeFile(join(root,'site/index.html'),'<!doctype html><title>Companion Fixture</title><a href="products.html">Products</a><p>support@synthetic.invalid</p><input aria-label="Search"><button>Search</button>')
  await fs.writeFile(join(root,'site/products.html'),'<!doctype html><title>Synthetic Products</title><table><tr><td>Blue Widget</td><td>12</td><td>B</td></tr></table>')
  await fs.writeFile(join(root,'desktop-test-app.html'),'<!doctype html><title>Companion Desktop Fixture</title><button role="tab">Home</button><button role="tab">Settings</button><input aria-label="Normal test field"><input aria-label="Simulated password" type="password"><button disabled>Save</button>')
  const manifest:FixtureManifestEntry[]=[]
  for(const name of Object.keys(contents)){const data=await fs.readFile(join(root,name));manifest.push({path:name,sha256:hash(data),size:data.length})}
  await fs.writeFile(join(root,'manifest.json'),JSON.stringify({runId,createdAt:new Date().toISOString(),files:manifest},null,2))
  return{runId,root,manifest}
}

export async function snapshot(root:string):Promise<FixtureManifestEntry[]>{const out:FixtureManifestEntry[]=[];const queue=[root];while(queue.length){const dir=queue.shift()!;for(const entry of await fs.readdir(dir,{withFileTypes:true})){const path=join(dir,entry.name);if(entry.isDirectory())queue.push(path);else{const data=await fs.readFile(path);out.push({path:relative(root,path).replaceAll('\\','/'),sha256:hash(data),size:data.length})}}}return out.sort((a,b)=>a.path.localeCompare(b.path))}
export async function cleanupFixture(root:string){const expected=join(tmpdir(),'orchestrai-e2e');if(!root.startsWith(expected+'\\'))throw new Error('Refusing to clean a non-fixture path.');await fs.rm(root,{recursive:true,force:true})}
