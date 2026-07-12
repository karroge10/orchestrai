import { describe, expect, it } from 'vitest'
import { deterministicPlanner } from '../src/main/orchestrator/deterministicPlanner'

describe('deterministicPlanner',()=>{
  it('creates the full performance diagnostic flow',()=>{const plan=deterministicPlanner('Why is my PC slow?');expect(plan.steps.map((x)=>x.tool)).toEqual(['system.getOverview','system.getTopProcesses','system.getDiskUsage','system.getStartupApps','system.getRecentErrors'])})
  it('extracts a quoted file query',()=>{const plan=deterministicPlanner('Find "budget.xlsx"');expect(plan.steps[0]?.tool).toBe('files.search');expect(plan.steps[0]?.args).toMatchObject({query:'budget',extension:'xlsx'})})
  it('gates zip work behind its medium-risk tool',()=>{const plan=deterministicPlanner('Compress "C:\\Demo"');expect(plan.risk).toBe('medium');expect(plan.steps[0]?.tool).toBe('files.createZip')})
  it('asks for clarity on unsupported requests',()=>expect(deterministicPlanner('hello').steps).toHaveLength(0))
  it('routes screen recording through the approval-gated recorder',()=>expect(deterministicPlanner('Record a demo video').steps[0]?.tool).toBe('screen.recordToggle'))
  it('plans exact synthetic file tasks with fixture-relative paths',()=>{expect(deterministicPlanner('Rename report draft.txt to quarterly report.txt in the test workspace.').steps[0]).toMatchObject({tool:'files.move',args:{source:'Inbox/report draft.txt',destination:'Inbox/quarterly report.txt'}});expect(deterministicPlanner('Move photo sample.jpg to the Recycle Bin.').steps[0]?.tool).toBe('files.delete')})
  it('routes structured fixture questions before visual fallback',()=>{expect(deterministicPlanner('Open the local test site and find the listed support email.').steps[0]?.tool).toBe('browser.inspect');expect(deterministicPlanner('Open the test application and report the active tab.').steps[0]?.tool).toBe('desktop.inspect')})
})
