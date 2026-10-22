import {test,expect} from '@playwright/test';
test('original blue-gray stays visibly distinct from black across pages and detail colors',async({page})=>{
 test.setTimeout(120000);
 await page.setViewportSize({width:1024,height:600});
 for(const detail of ['#000000','#ffffff','#ef9060']){
  await page.goto('/demo/settings');await page.getByRole('button',{name:'Appearance',exact:true}).click();await page.getByLabel('Third color hex',{exact:true}).fill(detail);await page.getByRole('radio',{name:'Original blue-gray',exact:true}).check();await page.getByRole('button',{name:'Save palette',exact:true}).click();await expect(page.getByRole('status')).toContainText('Saved');
  for(const path of ['/demo','/demo/settings','/demo/calendar','/demo/finances']){await page.goto(path);await expect(page.locator('.appearance-root')).toHaveAttribute('data-background','current');await expect(page.locator('.workspace')).toHaveCSS('background-color','rgb(27, 41, 56)');await expect(page.locator('#main-content')).toHaveCSS('background-color','rgb(27, 41, 56)');expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight)).toBe(true)}
 }
 await page.goto('/demo/settings');await page.getByRole('button',{name:'Appearance',exact:true}).click();await expect(page.getByRole('radio',{name:'Original blue-gray',exact:true})).toBeChecked();await page.screenshot({path:'test-results/original-blue-gray.png'});await page.getByRole('radio',{name:'Black',exact:true}).check();await page.getByRole('button',{name:'Save palette',exact:true}).click();await expect(page.locator('.workspace')).toHaveCSS('background-color','rgb(0, 0, 0)');
});
