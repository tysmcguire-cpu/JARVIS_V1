import {it,expect} from 'vitest';
import {noteSections} from '@/features/tracking/note-sections';
import {rowFacts,moduleSummary} from '@/features/tracking/module-metrics';
import type {RecordRow} from '@/features/tracking/config';
it('bounds note reading by both length and line breaks without losing any content',()=>{for(const text of ['x'.repeat(8000),'\n'.repeat(7999),'line\n'.repeat(1000)]){const pages=noteSections(text);expect(pages.join('')).toBe(text);expect(pages.every(p=>p.length<=280&&(p.match(/\n/g)??[]).length<=5)).toBe(true)}});
it('keeps unknown Canvas completion separate from overdue and does not invent grades',()=>{const facts=rowFacts('Assignment',[{id:'1',updatedAt:'',title:'Imported',status:'unknown',dueDate:'2026-10-18',pointsPossible:''},{id:'2',updatedAt:'',title:'Manual',status:'done',dueDate:'2026-10-18',pointsPossible:'20'}] as RecordRow[],'2026-10-19');expect(facts.overdue).toBe(0);expect(facts.unknown).toBe(1);expect(moduleSummary('Assignment',2,facts)).toContainEqual({label:'Canvas status unknown',value:'1'});expect(moduleSummary('Grade',0,rowFacts('Grade',[],'2026-10-19'))).toContainEqual({label:'Recorded points · unweighted',value:'Not recorded'})});
