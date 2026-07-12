import type { ToolContext, ToolDefinition, ToolResult } from '../../shared/types'
import { effectivePolicy } from '../safety/safetyPolicy'
import { enforceE2EContainment } from '../safety/e2eContainment'
import { fileTools } from './files'
import { captureScreen } from './screen/captureScreen'
import { inputTools } from './screen/inputActions'
import { systemTools } from './system'
import { structuredFixtureTools } from './fixtures/structuredFixtures'

const tools = new Map<string, ToolDefinition>()
for (const tool of [...systemTools, ...fileTools, captureScreen, ...inputTools, ...structuredFixtureTools]) tools.set(tool.name, tool)
export const listTools = () => [...tools.values()].map((tool)=>({name:tool.name,description:tool.description,...effectivePolicy(tool)}))
export const getTool = (name:string) => tools.get(name)
export async function runTool(name:string,args:Record<string,unknown>,context:ToolContext,approved=false):Promise<ToolResult>{const tool=tools.get(name);if(!tool)return{ok:false,error:`Unknown tool: ${name}`};if(effectivePolicy(tool).requiresApproval&&!approved)return{ok:false,error:'Approval required'};const blocked=enforceE2EContainment(tool,args,context);if(blocked)return blocked;return tool.run(args,context)}
