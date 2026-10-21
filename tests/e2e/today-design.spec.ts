import {chooseDashboard} from './dashboard-helpers';
import {test,expect} from '@playwright/test';
import {defaultPalette} from '../../src/features/settings/appearance';

test('Today has a readable bounded timeline, priorities and real spending chart across desktop sizes',async({page})=>{
 test.setTimeout(90000);
 for(const size of [{width:1024,height:600},{width:1280,height:720},{width:1440,height:900},{width:1920,height:1080},{width:1024,height:900},{width:1920,height:600}]){
  await page.setViewportSize(size);await page.goto('/demo');await chooseDashboard(page,'custom');
  await expect(page.locator('[data-today-panel]')).toHaveCount(4);
  await expect(page.getByRole('heading',{name:'Today',exact:true})).toHaveCount(0);
  const panels=await page.locator('[data-today-panel]').evaluateAll(nodes=>nodes.map(node=>{const r=node.getBoundingClientRect();return {height:node.clientHeight,scrollHeight:node.scrollHeight,width:node.clientWidth,scrollWidth:node.scrollWidth,name:node.getAttribute('data-today-panel'),x:r.x,y:r.y,right:r.right,bottom:r.bottom,clipped:node.scrollHeight>node.clientHeight+1||node.scrollWidth>node.clientWidth+1,hiddenLinks:[...node.querySelectorAll('a')].filter(a=>{const b=a.getBoundingClientRect();return b.width>0&&(b.x<r.x||b.right>r.right+1||b.y<r.y||b.bottom>r.bottom+1)}).length}}));
  for(const panel of panels){expect(panel.clipped,JSON.stringify({size,panel})).toBe(false);expect(panel.hiddenLinks,panel.name!).toBe(0);expect(panel.x).toBeGreaterThan(0);expect(panel.bottom).toBeLessThan(size.height-30)}
  const timeline=page.getByRole('region',{name:'Today schedule'}).locator('ol');expect(await timeline.evaluate(e=>e.scrollHeight<=e.clientHeight+1)).toBe(true);
  const core=await page.locator('.flowing-core').boundingBox();expect(panels.find(p=>p.name==='schedule')!.right).toBeLessThan(core!.x);expect(panels.find(p=>p.name==='priorities')!.x).toBeGreaterThan(core!.x+core!.width);
  expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight&&document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await expect(page.getByRole('img',{name:/Daily spending over the last seven days/})).toBeVisible();
  if(size.width===1440)await page.screenshot({path:'test-results/today-redesign-large.png'});
 }
 await page.getByRole('link',{name:'Open Open tasks',exact:true}).focus();expect(await page.getByRole('link',{name:'Open Open tasks',exact:true}).evaluate(e=>getComputedStyle(e).outlineStyle)).not.toBe('none');
 await page.getByRole('button',{name:'Pause interface animations'}).click();await expect(page.locator('.flowing-core canvas')).toHaveAttribute('data-motion','paused');
});

test('Today respects background and palette choices with readable text',async({page})=>{
 test.setTimeout(90000);
 await page.setViewportSize({width:1024,height:600});
 for(const background of ['current','black','white'])for(const tertiaryColor of ['#000000','#ffffff','#87a8bc']){
  await page.context().addCookies([{name:'jarvis-demo-palette',value:JSON.stringify({...defaultPalette,background,primaryColor:'#37a66e',secondaryColor:'#bd73a7',tertiaryColor}),url:'http://127.0.0.1:3100'}]);await page.goto('/demo');await chooseDashboard(page,'custom');
  const contrast=await page.locator('[data-today-panel="spending"]').evaluate(panel=>{
   const canvas=document.createElement('canvas');canvas.width=1;canvas.height=1;const ctx=canvas.getContext('2d')!;const rgb=(color:string)=>{ctx.clearRect(0,0,1,1);ctx.fillStyle=color;ctx.fillRect(0,0,1,1);return [...ctx.getImageData(0,0,1,1).data].slice(0,3)};
   const lum=(values:number[])=>values.map(v=>{const n=v/255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4}).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
   // Resolve the actual surface variable into a browser color for this background.
   const swatch=document.createElement('span');swatch.style.setProperty('color','var(--app-surface)','important');panel.append(swatch);const bg=lum(rgb(getComputedStyle(swatch).color));swatch.remove();
   return [...panel.querySelectorAll('h2,span,strong')].filter(e=>e.textContent?.trim()).map(e=>{const fg=lum(rgb(getComputedStyle(e).color));return (Math.max(fg,bg)+.05)/(Math.min(fg,bg)+.05)});
  });expect(Math.min(...contrast)).toBeGreaterThanOrEqual(4.49);
  if(tertiaryColor==='#87a8bc')await page.screenshot({path:`test-results/today-redesign-${background}.png`});
 }
 await page.emulateMedia({reducedMotion:'reduce'});await page.reload();await expect(page.locator('.flowing-core canvas')).toHaveAttribute('data-motion','paused');
});
