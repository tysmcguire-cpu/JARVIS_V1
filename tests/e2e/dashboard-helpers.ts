import {expect,type Page} from '@playwright/test';
export async function chooseDashboard(page:Page,layout:'default'|'custom'){
 await page.goto('/demo/settings');await page.getByRole('button',{name:'Appearance',exact:true}).click();const select=page.getByLabel('Dashboard layout');await expect(select).toBeEnabled();if(await select.inputValue()!==layout){await select.selectOption(layout);await expect(page.getByText('Dashboard layout saved.',{exact:true})).toBeVisible()}await page.goto('/demo');
}
