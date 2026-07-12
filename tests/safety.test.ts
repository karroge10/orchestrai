import { describe, expect, it } from 'vitest'
import { effectivePolicy } from '../src/main/safety/safetyPolicy'
describe('safety policy',()=>{it('forces approval for archive writes',()=>expect(effectivePolicy({name:'files.createZip',risk:'medium',requiresApproval:false}).requiresApproval).toBe(true));it('forces file deletion to high risk',()=>expect(effectivePolicy({name:'files.delete',risk:'medium',requiresApproval:false})).toEqual({risk:'high',requiresApproval:true}))})
describe('input policy',()=>{it.each(['screen.click','screen.type','screen.hotkey','screen.scroll','screen.recordToggle'])('forces approval for %s',(name)=>expect(effectivePolicy({name,risk:'medium',requiresApproval:false}).requiresApproval).toBe(true))})
