import { useEffect, useState } from 'react'
import { ShieldAlert, Square } from 'lucide-react'
import { useTaskStore } from './store/taskStore'
import { CommandPalette } from './components/CommandPalette'
import { Sidebar } from './components/Sidebar'
import { TaskView } from './components/TaskView'
import { SystemOverview } from './components/SystemOverview'
import { LiveView } from './components/LiveView'
import { ApprovalModal } from './components/ApprovalModal'
import { Settings } from './components/Settings'

export function App(){const palette=new URLSearchParams(location.search).has('palette');const {tasks,selectedId,select,run,init,clearTasks}=useTaskStore();const [settings,setSettings]=useState(false);const [agentMode,setAgentMode]=useState(false);useEffect(()=>{void init();void window.companion.getSettings().then((x)=>setAgentMode(x.agentControlMode));return window.companion.onSettingsChanged((value)=>setAgentMode(value.agentControlMode))},[init]);const task=tasks.find((x)=>x.id===selectedId)
  const capture=async()=>{let current=await window.companion.getSettings();if(!current.screenshotPermission){if(!confirm('Allow OrchestrAI to capture the primary display and save it locally?'))return;current=await window.companion.saveSettings({...current,screenshotPermission:true})}await run('Take a screenshot')}
  if(palette)return <div className="palette-page"><CommandPalette compact onSubmit={async(input)=>{await run(input);await window.companion.closePalette()}}/><div className="palette-hint">Ctrl + Space · Esc to close</div></div>
  return <div className="shell">{agentMode&&<div className="control-banner"><ShieldAlert/>Agent Control Mode is on. Every input action still requires approval.<button onClick={async()=>{if(task&&(task.status==='running'||task.status==='planning'))await window.companion.cancelTask(task.id);const s=await window.companion.getSettings();await window.companion.saveSettings({...s,agentControlMode:false});setAgentMode(false)}}><Square/>Emergency stop</button></div>}<Sidebar tasks={tasks} selectedId={selectedId} onSelect={select} onSettings={()=>setSettings(true)}/><section className="workspace"><TaskView task={task}/><div className="composer"><CommandPalette onSubmit={run}/></div></section><aside className="right-rail"><SystemOverview task={task}/><LiveView path={task?.screenshotPath} onCapture={capture}/></aside>{task&&<ApprovalModal task={task} onApply={(ids)=>void window.companion.approveActions(task.id,ids)} onCancel={()=>void window.companion.cancelActions(task.id)}/>} {settings&&<Settings onClearHistory={clearTasks} onClose={()=>{setSettings(false);void window.companion.getSettings().then((x)=>setAgentMode(x.agentControlMode))}}/>}</div>}
