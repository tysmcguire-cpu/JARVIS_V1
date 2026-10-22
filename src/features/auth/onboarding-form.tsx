'use client';
import {useActionState,useState,type FormEvent} from 'react';
import {optionalModules,profileSchema} from '@/features/settings/profile-contract';
import type {OnboardingState} from './onboarding-actions';
type Props={checkout:boolean;submit:(previous:OnboardingState,form:FormData)=>Promise<OnboardingState>};
export function OnboardingForm({checkout,submit}:Props){
 const [step,setStep]=useState(0),[plan,setPlan]=useState('free'),[name,setName]=useState(''),[timezone,setTimezone]=useState('UTC'),[currency,setCurrency]=useState('USD'),[modules,setModules]=useState<string[]>([...optionalModules]),[validation,setValidation]=useState('');
 const [result,action,pending]=useActionState(submit,{message:''});
 function next(){
  if(step===1){
   const parsed=profileSchema.safeParse({displayName:name,timezone,currency,enabledModules:modules});
   if(!parsed.success){setValidation(name.trim()?'Enter a valid timezone, such as America/Chicago or UTC.':'Enter your name.');return}
  }
  if(step===2&&!modules.length){setValidation('Choose at least one module.');return}
  if(step===0)setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC');
  setValidation('');setStep(current=>Math.min(3,current+1));
 }
 function submitStep(event:FormEvent<HTMLFormElement>){
  if(step<3){event.preventDefault();next()}
 }
 return <section className="login-card onboarding-card"><div className="login-brand">Pluto</div><h1>{['Choose your starting plan','Your profile','Your modules','Ready to begin'][step]}</h1><p>Step {step+1} of 4 · Your email is verified.</p>
 <form action={action} className="login-form" onSubmit={submitStep} aria-busy={pending}>
  <input type="hidden" name="displayName" value={name}/><input type="hidden" name="timezone" value={timezone}/><input type="hidden" name="currency" value={currency}/><input type="hidden" name="plan" value={plan}/>{modules.map(module=><input key={module} type="hidden" name="modules" value={module}/>)}
  {step===0&&<fieldset><legend>Personal tracking is included in every plan.</legend>{[['free','Free','$0/month'],['plus','Plus','$9.99/month'],['pro','Pro','$19.99/month']].map(([id,label,price])=><label key={id}><input type="radio" name="starting-plan" checked={plan===id} disabled={id!=='free'&&!checkout} onChange={()=>setPlan(id)}/><strong>{label}</strong> · {price}{id!=='free'&&!checkout?' · checkout is not open yet':''}</label>)}<p>Choose a plan to review after setup. Paid checkout requires a separate confirmation.</p></fieldset>}
  {step===1&&<><label>Name<input required maxLength={100} value={name} onChange={event=>{setName(event.target.value);setValidation('')}} autoComplete="name"/></label><label>Timezone<input required maxLength={100} list="timezone-examples" value={timezone} onChange={event=>{setTimezone(event.target.value);setValidation('')}}/></label><datalist id="timezone-examples">{['UTC','America/Chicago','America/New_York','America/Los_Angeles','Europe/London','Europe/Paris','Asia/Tokyo','Australia/Sydney'].map(zone=><option key={zone}>{zone}</option>)}</datalist><label>Default currency<select value={currency} onChange={event=>setCurrency(event.target.value)}>{['USD','EUR','GBP','CAD','AUD'].map(value=><option key={value}>{value}</option>)}</select></label></>}
  {step===2&&<fieldset><legend>Choose what appears in navigation. You can change this later.</legend>{optionalModules.map(module=><label key={module}><input type="checkbox" checked={modules.includes(module)} onChange={event=>{setModules(event.target.checked?[...modules,module]:modules.filter(value=>value!==module));setValidation('')}}/>{module}</label>)}</fieldset>}
  {step===3&&<><p>{name} · {timezone} · {currency}</p><p>Your setup guide offers optional services, Telegram pairing and links to add your first records. You can start tracking immediately with no connected accounts.</p><p>AI sharing and paid voice remain off until you explicitly enable eligible features.</p></>}
  {(validation||(step===3&&result.message))&&<p role="alert">{validation||(step===3?result.message:'')}</p>}
  <div className="onboarding-controls">{step>0&&<button type="button" disabled={pending} onClick={()=>{setValidation('');setStep(step-1)}}>Back</button>}{step<3?<button type="submit" disabled={step===2&&!modules.length}>Continue</button>:<button type="submit" disabled={pending||!modules.length}>{pending?'Creating workspace…':'Create my workspace'}</button>}</div>
 </form></section>;
}
