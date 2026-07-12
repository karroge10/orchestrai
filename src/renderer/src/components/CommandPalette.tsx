import { useState } from 'react'
import { ArrowRight, Gauge, FolderSearch, Camera, Video } from 'lucide-react'

const actions=[['Diagnose PC','Why is my PC slow?',Gauge],['Find File','Find ',FolderSearch],['Take Screenshot','Take a screenshot',Camera],['Record Screen','Record a demo video',Video]] as const
export function CommandPalette({onSubmit,compact=false}:{onSubmit:(input:string)=>void;compact?:boolean}){const [input,setInput]=useState('');const submit=(value=input)=>{if(value.trim())onSubmit(value.trim())};return <div className={compact?'palette compact':'palette'}>
  <form onSubmit={(e)=>{e.preventDefault();submit()}} className="command-row"><span className="spark">✦</span><input autoFocus value={input} onChange={(e)=>setInput(e.target.value)} placeholder="Ask OrchestrAI anything…"/><button aria-label="Run task"><ArrowRight size={18}/></button></form>
  <div className="quick-actions">{actions.map(([label,value,Icon])=><button key={label} onClick={()=>value.endsWith(' ')?setInput(value):submit(value)}><Icon size={15}/>{label}</button>)}</div>
</div>}
