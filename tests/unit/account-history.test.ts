import {it,expect} from 'vitest';
import {accountSnapshot} from '@/features/tracking/account-history';
import type {RecordRow} from '@/features/tracking/config';
it('reconstructs exact daily balances, retains negative values and bounds history to today',()=>{
 const account={id:'a',updatedAt:'now',openingBalance:'-100'} as RecordRow,categories=[{id:'income',updatedAt:'now',kind:'income'},{id:'expense',updatedAt:'now',kind:'expense'}] as RecordRow[],transactions=[{accountId:'a',categoryId:'income',date:'2026-09-01',amount:'10'},{accountId:'a',categoryId:'income',date:'2026-10-01',amount:'20'},{accountId:'a',categoryId:'expense',date:'2026-10-02',amount:'30'},{accountId:'a',categoryId:'income',date:'2026-10-04',amount:'9999'},{accountId:'other',categoryId:'income',date:'2026-10-01',amount:'9999'}].map((row,i)=>({id:String(i),updatedAt:'now',...row})) as RecordRow[];
 const result=accountSnapshot(account,transactions,categories,'2026-10','2026-10-03');expect(result.opening).toBe('-90');expect(result.points).toEqual([{date:'2026-09-30',balance:'-90'},{date:'2026-10-01',balance:'-70'},{date:'2026-10-02',balance:'-100'},{date:'2026-10-03',balance:'-100'}]);
 expect(accountSnapshot(account,transactions,categories,'2026-11','2026-10-03').points).toEqual([]);
 expect(accountSnapshot(account,[],categories,'2024-02','2026-10-03').points).toHaveLength(30);
});
