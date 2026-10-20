import {test,expect} from '@playwright/test';
test('compact module navigation reveals names on hover and focus without moving content',async({page})=>{
 for(const size of [{width:1024,height:600},{width:1440,height:900}]){
  await page.setViewportSize(size);await page.goto('/demo/calendar');await page.mouse.move(700,70);
  const sidebar=page.getByRole('complementary',{name:'Primary navigation'}),label=sidebar.getByRole('link',{name:'Finances',exact:true}).locator('.nav-copy'),main=page.locator('#main-content'),calendar=page.locator('.tracking-calendar');
  await expect(sidebar).toHaveCSS('width','72px');await expect(label).not.toBeVisible();const before=await main.boundingBox();expect(before!.x).toBeGreaterThanOrEqual(72);expect(before!.width).toBeGreaterThan(700);expect((await calendar.boundingBox())!.width).toBeGreaterThan(600);
  await sidebar.getByRole('link',{name:'Calendar',exact:true}).hover();await expect(sidebar).toHaveCSS('width','224px');await expect(label).toBeVisible();expect(await main.boundingBox()).toEqual(before);expect((await sidebar.boundingBox())!.height).toBe(size.height);await page.screenshot({path:`test-results/sidebar-popout-${size.width}.png`});
  await page.mouse.move(700,70);await expect(sidebar).toHaveCSS('width','72px');await sidebar.getByRole('link',{name:'Finances',exact:true}).focus();await expect(label).toBeVisible();await expect(sidebar).toHaveCSS('width','224px');await page.getByLabel('Search titles').focus();await expect(sidebar).toHaveCSS('width','72px');
  await expect(page.locator('.calendar-day-titles').first()).toHaveCSS('gap','4px');expect(await calendar.evaluate(e=>e.scrollHeight<=e.clientHeight&&e.scrollWidth<=e.clientWidth)).toBe(true);expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight&&document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
 await page.emulateMedia({reducedMotion:'reduce'});await expect(page.getByRole('complementary',{name:'Primary navigation'})).toHaveCSS('transition-duration','0s');
});
