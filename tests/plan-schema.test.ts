import { describe, expect, it } from 'vitest'
import { taskPlanSchema } from '../src/main/models/planSchema'

describe('model plan schema',()=>{
  it('accepts a bounded registered-tool-shaped plan',()=>{const plan=taskPlanSchema.parse({goal:'Inspect disk',steps:[{title:'Check disks',tool:'system.getDiskUsage',args:{}}],needsScreenshot:false,risk:'safe'});expect(plan.steps).toHaveLength(1)})
  it('rejects plans with more than twelve steps',()=>expect(()=>taskPlanSchema.parse({goal:'Too broad',steps:Array.from({length:13},(_,index)=>({title:String(index),tool:'screen.click',args:{}})),needsScreenshot:true,risk:'high'})).toThrow())
  it('rejects invalid risks and missing tool arguments',()=>expect(()=>taskPlanSchema.parse({goal:'Bad',steps:[{title:'x',tool:'x'}],needsScreenshot:false,risk:'extreme'})).toThrow())
})
