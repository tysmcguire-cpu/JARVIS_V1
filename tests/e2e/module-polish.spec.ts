import {test,expect} from '@playwright/test';

test('module styling stays readable and bounded across desktop sizes and reduced motion',async({page})=>{
 test.setTimeout(300000);
 for(const size of [{width:1024,height:600},{width:1440,height:900},{width:1920,height:1080}]){
  await page.setViewportSize(size);
  for(const slug of ['finances','education','calendar','career','projects','goals','notes','assistant','notifications','settings']){
   await page.goto('/demo/'+slug);await expect(page.locator('#main-content')).toBeVisible();if(await page.locator('.module-rail').count()){const rail=await page.locator('.module-rail').boundingBox(),body=await page.locator('.module-body,.module-layout>.panel').first().boundingBox();expect(rail).not.toBeNull();expect(body).not.toBeNull();expect(rail!.x+rail!.width).toBeLessThanOrEqual(body!.x);expect(body!.y).toBeLessThan(180);}
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight)).toBe(true);
   const panel=page.locator('.tracking-content,.assistant-panel,.notification-panel,.settings-grid').first();
   if(await panel.count())expect(await panel.evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
   await page.screenshot({path:`test-results/polish-${size.width}-${slug}.png`});
  }
 }
 await page.goto('/demo/calendar');await page.emulateMedia({reducedMotion:'reduce'});
 const day=page.locator('.calendar-grid>button').first();await day.focus();await expect(day).toBeFocused();await expect(day).toHaveCSS('outline-style','solid');await expect(day).toHaveCSS('transition-duration','0s');
});
