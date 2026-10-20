import {it,expect} from 'vitest';
import {contrastRatio,visiblePalette,readableColor} from '@/features/settings/contrast';
import {defaultPalette} from '@/features/settings/appearance';
it('protects extreme and matching-background colors while preserving stored preferences',()=>{
 for(const background of ['current','black','white'] as const)for(const color of ['#000000','#ffffff','#131719','#262626','#f3f3f3','#ff0000','#00ff00','#0000ff','#808080']){
  const saved={...defaultPalette,background,primaryColor:color,secondaryColor:color,tertiaryColor:color},copy={...saved},visible=visiblePalette(saved);
  for(const key of ['primaryColor','secondaryColor','tertiaryColor'] as const)for(const surface of background==='white'?['#ffffff','#f3f3f3']:['#000000','#131719','#262626','#1b2938','#14212e','#223344'])expect(contrastRatio(visible[key],surface)).toBeGreaterThanOrEqual(4.5);
  expect(saved).toEqual(copy);
 }
 expect(readableColor('#69d8f3',false)).toBe('#69d8f3');expect(visiblePalette(defaultPalette)).toEqual(defaultPalette);
});
