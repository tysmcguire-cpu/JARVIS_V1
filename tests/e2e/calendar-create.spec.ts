import {test,expect} from '@playwright/test';

test('selected calendar days create dated events, including from task and reminder tabs',async({page})=>{
 await page.setViewportSize({width:1024,height:600});await page.goto('/demo/calendar');
 const dialog=page.getByRole('dialog');
 for(const [index,tab] of ['Events','Tasks','Reminders'].entries()){
  await page.getByRole('navigation',{name:'Record types'}).getByRole('button',{name:tab,exact:true}).click();
  await page.getByLabel('Month',{exact:true}).fill('2026-11');const day='2026-11-'+String(index+20);
  await page.locator('.calendar-grid').getByRole('button',{name:new RegExp('^'+day+':')}).click();
  await expect(dialog.getByRole('heading')).toHaveText(day);await dialog.getByRole('button',{name:'Add event',exact:true}).click();
  await expect(dialog.getByRole('heading')).toHaveText('Add events');await expect(dialog.getByLabel('Start date',{exact:true})).toHaveValue(day);await expect(dialog.getByLabel('End date',{exact:true})).toHaveValue(day);
  await dialog.getByLabel('Event',{exact:true}).fill('Synthetic day event '+index);await dialog.getByRole('button',{name:'Continue',exact:true}).click();await dialog.getByLabel('Start time',{exact:true}).fill('10:00');await dialog.getByLabel('End time',{exact:true}).fill('11:00');await dialog.getByLabel('Location',{exact:true}).fill('Synthetic location');
  expect(await dialog.evaluate(e=>e.scrollHeight<=e.clientHeight)).toBe(true);await dialog.getByRole('button',{name:'Save record',exact:true}).click();await expect(dialog).not.toBeVisible();
  const cell=page.locator('.calendar-grid').getByRole('button',{name:new RegExp('^'+day+':')});await expect(cell).toContainText('Synthetic day event '+index);await cell.click();await expect(dialog).toContainText('Synthetic day event '+index);await expect(dialog).toContainText('10:00');await dialog.getByRole('button',{name:'Close',exact:true}).click();
 }
 const cell=page.locator('.calendar-grid').getByRole('button',{name:/^2026-11-22:/});await cell.click();await dialog.getByRole('button',{name:'Add event',exact:true}).click();await expect(dialog.getByLabel('Start date',{exact:true})).toHaveValue('2026-11-22');await page.keyboard.press('Escape');await expect(dialog).not.toBeVisible();await expect(cell).toContainText('Synthetic day event 2');
 expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight&&document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:'test-results/calendar-day-create.png'});
});
