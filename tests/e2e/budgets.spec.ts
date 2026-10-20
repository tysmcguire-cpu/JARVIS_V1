import {test,expect} from '@playwright/test';
test('budgets combine list, remaining graph and three-field category creation without scrolling',async({page})=>{
 await page.setViewportSize({width:1024,height:600});await page.goto('/demo/finances');
 await page.getByRole('button',{name:'Budgets',exact:true}).click();await expect(page.getByRole('button',{name:'Budget limits',exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:'+ Add budget',exact:true}).click();const dialog=page.getByRole('dialog');
 await expect(dialog.locator('input')).toHaveCount(3);
 await dialog.getByLabel('Label',{exact:true}).fill('Weekly groceries');await dialog.getByLabel('Category',{exact:true}).fill('New grocery category');await dialog.getByLabel('Limit',{exact:true}).fill('200.25');await dialog.getByRole('button',{name:'Save budget',exact:true}).click();
 await expect(dialog).not.toBeVisible();await expect(page.getByRole('region',{name:'Budgets list'})).toContainText('Weekly groceries');await expect(page.getByRole('region',{name:'Remaining budget graph'})).toContainText('USD 200.25 left');
 await expect(page.getByRole('region',{name:'Remaining budget graph'})).toContainText('USD 0.00 spent / USD 200.25 limit');
 await page.getByRole('button',{name:'Edit Weekly groceries',exact:true}).click();await dialog.getByLabel('Limit',{exact:true}).fill('180');await dialog.getByRole('button',{name:'Save budget',exact:true}).click();await expect(dialog).not.toBeVisible();await expect(page.getByRole('region',{name:'Remaining budget graph'})).toContainText('USD 180.00 left');
 expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight&&document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.getByRole('button',{name:'Delete Weekly groceries',exact:true}).click();await dialog.getByRole('button',{name:'Delete permanently',exact:true}).click();await expect(dialog).not.toBeVisible();await expect(page.getByRole('region',{name:'Budgets list'})).not.toContainText('Weekly groceries');
 for(const selector of ['.budget-workspace','.tracking-pagination'])expect((await page.locator(selector).boundingBox())!.y+(await page.locator(selector).boundingBox())!.height).toBeLessThanOrEqual(600);
 await page.getByRole('button',{name:'+ Add budget',exact:true}).click();await dialog.getByLabel('Label',{exact:true}).fill('Food allowance');await dialog.getByLabel('Category',{exact:true}).fill(' food ');await dialog.getByLabel('Limit',{exact:true}).fill('10');await dialog.getByRole('button',{name:'Save budget',exact:true}).click();await expect(dialog).not.toBeVisible();await expect(page.getByRole('region',{name:'Remaining budget graph'})).toContainText('USD 10.00 over budget');
 await page.screenshot({path:'test-results/budgets-desktop.png'});
 await page.getByRole('button',{name:'Categories',exact:true}).click();await expect(page.locator('.tracking-content')).toContainText('New grocery category');
});
test('selected module tabs and filter controls hover with primary in every background',async({page})=>{
 test.setTimeout(90000);await page.setViewportSize({width:1024,height:600});
 const primary=async(selector:string)=>page.locator(selector).first().evaluate(e=>{const c=document.createElement('canvas'),x=c.getContext('2d')!;x.fillStyle=getComputedStyle(e).backgroundColor;x.fillRect(0,0,1,1);const p=x.getImageData(0,0,1,1).data;return p[1]>p[0]+5&&p[1]>p[2]+5});
 for(const background of ['Original blue-gray','Black','White']){
  await page.goto('/demo/settings');await page.getByRole('button',{name:'Appearance',exact:true}).click();await page.getByLabel('Primary color hex',{exact:true}).fill('#32c879');await page.getByLabel('Third color hex',{exact:true}).fill('#ff3030');await page.getByRole('radio',{name:background,exact:true}).check();await page.getByRole('button',{name:'Save palette',exact:true}).click();await expect(page.getByRole('status')).toContainText('Saved');
  for(const slug of ['finances','education','calendar','career','projects','goals','notes']){await page.goto('/demo/'+slug);const active=page.locator('.tracking-tabs button[aria-pressed=true]').first();await active.hover();await expect.poll(()=>primary('.tracking-tabs button:hover')).toBe(true);await page.getByRole('button',{name:'Search',exact:true}).hover();await expect.poll(()=>primary('.tracking-toolbar button:hover')).toBe(true)}
  await page.goto('/demo/notifications');await page.getByRole('button',{name:'Inbox',exact:true}).hover();await expect.poll(()=>primary('.notification-panel nav button:hover')).toBe(true);await page.goto('/demo/settings');await page.getByRole('button',{name:'Preferences and connections',exact:true}).hover();await expect.poll(()=>primary('.tracking-tabs button:hover')).toBe(true);
 }
});
