import { test, expect } from '@playwright/test';
import { entities } from '../../src/features/tracking/config';
test('every tracking tab fits the minimum desktop viewport',async({page},info)=>{
 test.setTimeout(120000);
 await page.setViewportSize({width:1024,height:600});
 for(const slug of ['finances','education','calendar','career','projects','goals','notes']){
 await page.goto('/demo/'+slug);await expect(page.locator('.tracking-workspace')).toBeVisible();
 for(const entity of entities.filter(e=>e.module===slug&&e.key!=='Budget')){
 await page.getByRole('navigation',{name:'Record types'}).getByRole('button',{name:entity.key==='BudgetCategory'?'Budgets':entity.label,exact:true}).click();
 if(slug==='calendar')await page.getByRole('button',{name:'Records',exact:true}).click();
 await expect(page.getByRole('button',{name:'+ Add '+(entity.key==='BudgetCategory'?'budget':entity.label.toLowerCase()),exact:true})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight)).toBe(true);
 const pagination=await page.locator('.tracking-pagination').boundingBox();expect(pagination!.y+pagination!.height).toBeLessThanOrEqual(576);
 await page.getByRole('button',{name:'+ Add '+(entity.key==='BudgetCategory'?'budget':entity.label.toLowerCase()),exact:true}).click();
 const dialog=page.getByRole('dialog');await expect(dialog).toBeVisible();
 expect(await dialog.evaluate(e=>e.scrollWidth<=e.clientWidth&&(e.scrollHeight<=e.clientHeight||['auto','scroll'].includes(getComputedStyle(e).overflowY)))).toBe(true);
 if(await dialog.getByRole('button',{name:'Continue',exact:true}).count()) {await dialog.getByRole('button',{name:'Continue',exact:true}).click();expect(await dialog.evaluate(e=>e.scrollHeight<=e.clientHeight||['auto','scroll'].includes(getComputedStyle(e).overflowY))).toBe(true);}
 await page.keyboard.press('Escape');await expect(dialog).not.toBeVisible();
 const table=page.locator('.tracking-table-wrap,.finance-log,.budget-workspace,.accounts-workspace,.module-note-library');expect(await table.evaluate(e=>e.scrollWidth<=e.clientWidth&&(e.scrollHeight<=e.clientHeight||['auto','scroll'].includes(getComputedStyle(e).overflowY)))).toBe(true);
 }
 if(slug==='finances'||slug==='goals')await page.screenshot({path:`test-results/${info.project.name}-${slug}-tracking.png`});
 }
});
test('notes support create, search, inline edit, delete and empty states in isolated demo',async({page})=>{
 await page.goto('/demo/notes');await page.getByRole('button',{name:'+ Add notes',exact:true}).click();const dialog=page.getByRole('dialog');await dialog.getByLabel('Title',{exact:true}).fill('Synthetic browser note');await dialog.getByLabel('Content',{exact:true}).fill('Synthetic body');await dialog.getByLabel('Tag',{exact:true}).fill('test');await dialog.getByRole('button',{name:'Save record',exact:true}).click();await expect(dialog).not.toBeVisible();
 await page.getByLabel('Search titles').fill('Synthetic browser note');await page.getByRole('button',{name:'Search',exact:true}).click();await expect(page.getByLabel('Note title',{exact:true})).toHaveValue('Synthetic browser note');await page.getByLabel('Note title',{exact:true}).fill('Synthetic edited note');await page.getByRole('button',{name:'Save note',exact:true}).click();await expect(page.getByText('No notes on this page.',{exact:true})).toBeVisible();
 await page.getByLabel('Search titles').fill('Synthetic edited note');await page.getByRole('button',{name:'Search',exact:true}).click();await page.getByRole('button',{name:'Delete Synthetic edited note',exact:true}).click();await dialog.getByRole('button',{name:'Cancel',exact:true}).click();await expect(page.getByLabel('Note title',{exact:true})).toHaveValue('Synthetic edited note');await page.getByRole('button',{name:'Delete Synthetic edited note',exact:true}).click();await dialog.getByRole('button',{name:'Delete permanently',exact:true}).click();await expect(page.getByText('No notes on this page.',{exact:true})).toBeVisible();
});

test('linked forms validate values and calendar changes months',async({page})=>{
 await page.setViewportSize({width:1024,height:600});await page.goto('/demo/calendar');await page.getByRole('button',{name:'+ Add events',exact:true}).click();const dialog=page.getByRole('dialog');await dialog.getByLabel('Event',{exact:true}).fill('Synthetic invalid event');await dialog.getByLabel('Start date',{exact:true}).fill('2026-10-20');await dialog.getByLabel('End date',{exact:true}).fill('2026-10-19');await dialog.getByRole('button',{name:'Continue',exact:true}).click();await dialog.getByLabel('Start time',{exact:true}).fill('12:00');await dialog.getByLabel('End time',{exact:true}).fill('13:00');await dialog.getByRole('button',{name:'Save record',exact:true}).click();await expect(dialog.getByRole('alert')).toContainText('End date');await page.keyboard.press('Escape');await expect(dialog).not.toBeVisible();await expect(page.getByRole('region',{name:'Monthly calendar'})).toBeVisible();await page.getByLabel('Month',{exact:true}).fill('2026-11');await expect(page.locator('.calendar-grid button')).toHaveCount(30);
});
