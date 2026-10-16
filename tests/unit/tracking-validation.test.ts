import { describe, expect, it } from 'vitest';
import { parseMoney, moneyInput } from '@/features/tracking/config';
import { readQuery, validateRecord } from '@/features/tracking/validation';
describe('tracking validation and exact money',()=>{
 it('adds decimal inputs exactly and preserves signs',()=>{expect(parseMoney('0.10')+parseMoney('0.20')).toBe(30n);expect(moneyInput(parseMoney('-123456789012.99').toString())).toBe('-123456789012.99');expect(parseMoney('-0.01')).toBe(-1n)});
 it.each(['1.001','1e5','NaN','1,000.00','9999999999999',''])('rejects invalid money %s',v=>expect(()=>parseMoney(v)).toThrow());
 it('rejects invalid dates, script URLs, invalid statuses and negative limits',()=>{
 expect(()=>validateRecord('Task',{title:'test',dueDate:'2026-02-30',status:'planned',priority:'normal'})).toThrow();
 expect(()=>validateRecord('CareerApplication',{title:'test',company:'example',status:'applied',date:'2026-10-15',url:'javascript:alert(1)'})).toThrow();
 expect(()=>validateRecord('Task',{title:'test',dueDate:'2026-10-15',status:'admin',priority:'normal'})).toThrow();
 expect(()=>validateRecord('FinancialAccount',{title:'test',currency:'USD',openingBalance:'-2.25'})).not.toThrow();
 expect(()=>validateRecord('Goal',{title:'test',target:'0',current:'2',unit:'pages',dueDate:'2026-10-15',status:'active'})).toThrow();
 });
 it('enforces date and time order',()=>{expect(()=>validateRecord('Event',{title:'test',startDate:'2026-10-15',endDate:'2026-10-15',startTime:'14:00',endTime:'13:00',location:''})).toThrow()});
 it('discards supplied ownership and rejects unknown entities and query injection',()=>{expect(validateRecord('Note',{title:'test',content:'text',tag:'tag',userId:'attacker'})).not.toHaveProperty('userId');expect(()=>validateRecord('User',{title:'test'})).toThrow();expect(()=>readQuery({sort:'title;drop table'})).toThrow()});
});
