import { join } from 'node:path'
import { describe,expect,it } from 'vitest'
import { routeForTool,routesForPlan } from '../src/main/orchestrator/capabilityRouter'
import { enforceE2EContainment,isContained } from '../src/main/safety/e2eContainment'

describe('capability routing',()=>{
  it('prioritizes explicit deterministic and structured routes',()=>expect(routesForPlan([{title:'disk',tool:'system.getDiskUsage',args:{}},{title:'page',tool:'browser.inspect',args:{}}])).toEqual(['system_tool','structured_browser']))
  it('keeps visual control an explicit fallback route',()=>expect(routeForTool('screen.click')).toBe('visual_computer_use'))
  it('asks the user for an empty plan',()=>expect(routesForPlan([])).toEqual(['ask_user']))
})
describe('E2E containment',()=>{const root=join(process.env.TEMP!,'orchestrai-e2e','run')
  it('handles path boundaries',()=>{expect(isContained(root,join(root,'Inbox','x.txt'))).toBe(true);expect(isContained(root,join(root,'..','real.txt'))).toBe(false)})
  it('blocks mutable out-of-root paths',()=>{const blocked=enforceE2EContainment({name:'files.move',description:'',risk:'medium',requiresApproval:true,run:async()=>({ok:true})},{source:join(root,'a'),destination:'C:\\Users\\real.txt'},{taskId:'t',e2e:{enabled:true,fixtureRoot:root,allowedProcessIds:[]}});expect(blocked?.ok).toBe(false)})
  it('blocks unrelated process termination',()=>{const blocked=enforceE2EContainment({name:'system.killProcess',description:'',risk:'high',requiresApproval:true,run:async()=>({ok:true})},{pid:4},{taskId:'t',e2e:{enabled:true,fixtureRoot:root,allowedProcessIds:[12345]}});expect(blocked?.error).toContain('not launched')})
})
