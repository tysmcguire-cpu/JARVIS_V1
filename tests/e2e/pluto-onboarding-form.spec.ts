import {test,expect} from '@playwright/test';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import path from 'node:path';

// Use the esbuild compiler already required by tsx to exercise the real form
// with a synthetic action, without adding an authenticated route or Auth bypass.
const fromTsx=createRequire(createRequire(path.join(process.cwd(),'package.json')).resolve('tsx'));
const {build}=fromTsx('esbuild') as {build:(options:Record<string,unknown>)=>Promise<{outputFiles:{text:string}[]}>};
let bundle:string;
test.beforeAll(async()=>{
 const result=await build({stdin:{contents:`
 import React from 'react';
 import {createRoot} from 'react-dom/client';
 import {OnboardingForm} from './src/features/auth/onboarding-form';
 let attempts=0;
 window.onboardingCalls=[];
 async function submit(_previous,form){
  attempts++;window.onboardingCalls.push(Object.fromEntries(form));
  return new Promise(resolve=>{window.finishOnboarding=()=>resolve({message:attempts===1?'Could not create your workspace. Your choices are still here. Try again.':'Synthetic retry succeeded.'})});
 }
 createRoot(document.getElementById('root')).render(<OnboardingForm checkout={false} submit={submit}/>);
 `,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,platform:'browser',format:'iife',jsx:'automatic',alias:{'@':path.join(process.cwd(),'src')},define:{'process.env.NODE_ENV':'"development"'}});
 bundle=result.outputFiles[0].text;
});
for(const viewport of [{width:1280,height:720},{width:390,height:844}]){
 test(`onboarding retains choices after failure and allows a controlled retry at ${viewport.width}px`,async({page})=>{
  await page.setViewportSize(viewport);
  const styles=readFileSync('src/app/globals.css','utf8')+'\n'+readFileSync('src/app/commercial-responsive.css','utf8');
  await page.goto('about:blank');await page.setContent(`<style>${styles}</style><main class="login-screen"><div id="root"></div></main>`);await page.addScriptTag({content:bundle});
  await expect(page.getByRole('heading',{name:'Choose your starting plan'})).toBeVisible();await page.getByRole('button',{name:'Continue',exact:true}).click();
  await page.getByLabel('Name',{exact:true}).fill('   ');await page.getByRole('button',{name:'Continue',exact:true}).click();await expect(page.getByRole('alert')).toHaveText('Enter your name.');
  await page.getByLabel('Name',{exact:true}).fill('Synthetic retry customer');await page.getByLabel('Timezone',{exact:true}).fill('Not/A_Timezone');await page.getByRole('button',{name:'Continue',exact:true}).click();await expect(page.getByRole('alert')).toContainText('valid timezone');
  await page.getByLabel('Timezone',{exact:true}).fill('America/Chicago');await page.getByLabel('Default currency').selectOption('GBP');
  await page.getByLabel('Name',{exact:true}).press('Enter');await expect(page.getByRole('heading',{name:'Your modules',exact:true})).toBeVisible();expect(await page.evaluate(()=>Reflect.get(window,'onboardingCalls').length)).toBe(0);
  await page.getByRole('checkbox',{name:'career',exact:true}).uncheck();await page.getByRole('button',{name:'Continue',exact:true}).click();await page.getByRole('button',{name:'Create my workspace'}).click();
  await expect(page.getByRole('button',{name:'Creating workspace…'})).toBeDisabled();await expect(page.getByRole('button',{name:'Back',exact:true})).toBeDisabled();
  await page.evaluate(()=>Reflect.get(window,'finishOnboarding')());await expect(page.getByRole('alert')).toContainText('Your choices are still here');await expect(page.getByRole('button',{name:'Create my workspace'})).toBeEnabled();
  await page.getByRole('button',{name:'Back',exact:true}).click();await expect(page.getByRole('checkbox',{name:'career',exact:true})).not.toBeChecked();await page.getByRole('button',{name:'Back',exact:true}).click();
  await expect(page.getByLabel('Name',{exact:true})).toHaveValue('Synthetic retry customer');await expect(page.getByLabel('Timezone',{exact:true})).toHaveValue('America/Chicago');await expect(page.getByLabel('Default currency')).toHaveValue('GBP');
  await page.getByRole('button',{name:'Continue',exact:true}).click();await page.getByRole('button',{name:'Continue',exact:true}).click();await page.getByRole('button',{name:'Create my workspace'}).click();await page.evaluate(()=>Reflect.get(window,'finishOnboarding')());await expect(page.getByRole('alert')).toHaveText('Synthetic retry succeeded.');
  expect(await page.evaluate(()=>Reflect.get(window,'onboardingCalls').length)).toBe(2);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:`test-results/onboarding-retry-${viewport.width}.png`,fullPage:true});
 });
}
