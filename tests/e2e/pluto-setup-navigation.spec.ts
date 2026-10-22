import {test,expect} from '@playwright/test';
import {settingsSections} from '../../src/features/settings/navigation';
test('every Settings section supports direct links and reload',async({page})=>{
 for(const section of settingsSections){await page.goto('/demo/settings#'+section.hash);await expect(page.getByRole('button',{name:section.label,exact:true})).toHaveAttribute('aria-pressed','true')}
 await page.reload();await expect(page.getByRole('button',{name:'Data controls',exact:true})).toHaveAttribute('aria-pressed','true');
});
test('Settings tab changes update history and back/forward restore the section',async({page})=>{
 await page.goto('/demo/settings#ai');await expect(page.getByRole('button',{name:'AI permissions',exact:true})).toHaveAttribute('aria-pressed','true');
 await page.getByRole('button',{name:'Appearance',exact:true}).click();await expect(page).toHaveURL(/#appearance$/);
 await page.getByRole('button',{name:'Subscription and usage',exact:true}).click();await expect(page).toHaveURL(/#subscription$/);
 await page.goBack();await expect(page.getByRole('button',{name:'Appearance',exact:true})).toHaveAttribute('aria-pressed','true');
 await page.goBack();await expect(page.getByRole('button',{name:'AI permissions',exact:true})).toHaveAttribute('aria-pressed','true');
 await page.goForward();await expect(page.getByRole('button',{name:'Appearance',exact:true})).toHaveAttribute('aria-pressed','true');
});
test('onboarding plan hints are review only and cannot unlock checkout',async({page})=>{
 await page.goto('/demo/settings?plan=pro#subscription');await expect(page.getByRole('note')).toContainText('You selected Pro');await expect(page.getByText('Current plan:',{exact:false})).toContainText('free');await expect(page.getByRole('button',{name:'Choose pro',exact:true})).toBeDisabled();
 await page.goto('/demo/settings?plan=ultimate#subscription');await expect(page.getByRole('note')).toHaveCount(0);
});
