import {test,expect} from '@playwright/test';
test('commercial intelligence sections remain usable without paid activation',async({page})=>{
 const posts:string[]=[];page.on('request',r=>{if(r.method()==='POST')posts.push(r.url())});
 await page.goto('/demo/assistant');await expect(page.getByRole('heading',{name:'Pluto assistant',exact:true})).toBeVisible();
 await page.getByLabel('Message to Pluto').fill('What is due this week?');await page.getByRole('button',{name:'Send message',exact:true}).click();await expect(page.getByRole('status')).toContainText('Synthetic preview');
 await page.getByRole('button',{name:'Reports',exact:true}).click();await expect(page.getByText('No saved reports.')).toBeVisible();
 await page.getByRole('button',{name:'Research',exact:true}).click();await expect(page.getByRole('button',{name:'Research',exact:true}).last()).toBeDisabled();
 await page.getByRole('button',{name:'Voice',exact:true}).click();await expect(page.getByText(/Voice is disabled/)).toBeVisible();expect(posts).toEqual([]);
});
test('external sharing and weekly reports default to off',async({page})=>{
 await page.goto('/demo/settings');await page.getByRole('button',{name:'AI permissions',exact:true}).click();
 await expect(page.getByLabel('Allow selected summaries',{exact:false})).not.toBeChecked();await expect(page.getByLabel('Weekly AI report (eligible paid plans only)',{exact:true})).toBeDisabled();
 await page.getByRole('button',{name:'Save AI preferences',exact:true}).click();await expect(page.getByRole('status')).toContainText('no AI is enabled');
});
