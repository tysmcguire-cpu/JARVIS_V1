'use client';
import {useEffect,useRef,useState,useTransition} from 'react';
import {providers,type ProviderId} from './contract';
import {saveProviderAuthorization,discoverAppleCalendarOptions} from './actions';
export function AuthorizationDialog({provider,onClose,onSaved,previewOnly=false}:{previewOnly?:boolean;provider:ProviderId;onClose:()=>void;onSaved:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null);
 const [step,setStep]=useState(0),[token,setToken]=useState(''),[expiry,setExpiry]=useState(''),[nonexpiring,setNonexpiring]=useState(false),[resources,setResources]=useState(''),[refreshToken,setRefreshToken]=useState(''),[clientId,setClientId]=useState(''),[clientSecret,setClientSecret]=useState(''),[approved,setApproved]=useState(false),[message,setMessage]=useState(''),[pending,startTransition]=useTransition();
 const [appleUsername,setAppleUsername]=useState(''),[discoveryApproved,setDiscoveryApproved]=useState(false),[calendars,setCalendars]=useState<{url:string;name:string}[]>([]),[calendarPage,setCalendarPage]=useState(0);
 const [syncIntervalMinutes,setSyncIntervalMinutes]=useState(0);
 const canvas=provider==='canvas';
 const apple=provider==='apple-calendar',google=provider==='google-calendar';
 const selected=resources.split(/[\n,]/).map(r=>r.trim()).filter(Boolean);
 useEffect(()=>{dialog.current?.showModal()},[]);
 const findCalendars=()=>startTransition(async()=>{
  if(previewOnly)return;setMessage('');if(!discoveryApproved){setMessage('Approve listing your iCloud calendars first.');return;}
  try{const result=await discoverAppleCalendarOptions({approved:true,username:appleUsername,password:token});if(!result.ok){setMessage(result.message);return;}setCalendars(result.calendars);setResources('');setApproved(false);setCalendarPage(0);setStep(1);if(!result.calendars.length)setMessage('No event calendars were found in this iCloud account.');}catch{setMessage('Calendar discovery unavailable. No credentials saved.');}
 });
 const save=()=>startTransition(async()=>{
  if(previewOnly)return;setMessage('');if(!approved){setMessage('Approve access to the selected resources before saving.');return;}
  const expiresAt=canvas||apple||nonexpiring&&!google?Number.MAX_SAFE_INTEGER:new Date(expiry).getTime();
  if(!token||!Number.isFinite(expiresAt)){setMessage('Enter the credential and its expiry, or explicitly select a nonexpiring token.');return;}
  if(!canvas&&(!selected.length||selected.length>20)){setMessage('Select between one and twenty resources.');return;}
  if(refreshToken&&(!clientId||!clientSecret)){setMessage('Google refresh requires its authorized client ID and secret.');return;}
  const grant={provider,approved:true,credentials:{accessToken:token,expiresAt,...(refreshToken?{refreshToken}:{})},resources:canvas?['calendar-feed']:selected,...(apple?{appleUsername}:{}),...(canvas?{canvasTransport:'feed',syncIntervalMinutes}:{}),...(clientId&&clientSecret?{googleClient:{id:clientId,secret:clientSecret}}:{})};
  try{const result=await saveProviderAuthorization(grant);if(result.ok){setToken('');setRefreshToken('');setClientSecret('');setAppleUsername('');onSaved();onClose();}else setMessage(result.message);}catch{setMessage('Authorization could not be saved. No provider request was made.');}
 });
 return <dialog ref={dialog} className="tracking-dialog authorization-dialog" aria-labelledby="authorization-title" onCancel={e=>{e.preventDefault();if(!pending)onClose()}}>
 <h3 id="authorization-title">Authorize {providers.find(p=>p.id===provider)?.label}</h3>
 <div className="tracking-fields">
 {canvas?<>
  <label>Private Canvas Calendar Feed URL<input aria-label="Canvas calendar feed URL" type="password" autoComplete="off" maxLength={2000} value={token} onChange={e=>setToken(e.target.value)}/></label>
  <label>Automatic refresh<select aria-label="Canvas refresh frequency" value={syncIntervalMinutes} onChange={e=>setSyncIntervalMinutes(Number(e.target.value))}><option value={0}>Manual only</option><option value={15}>Every 15 minutes</option><option value={60}>Every hour</option><option value={360}>Every 6 hours</option></select></label>
  <p className="authorization-note">In Canvas, open Calendar → Calendar Feed and copy its private HTTPS link. No Microsoft password or API token needed. Reads dated assignments and events; grades and submission status are unavailable.</p>
  <label className="csv-ack"><input type="checkbox" checked={approved} onChange={e=>setApproved(e.target.checked)}/>Allow JARVIS to read this feed at the selected frequency and use its deadlines for my enabled assignment notifications.</label>
 </>:step===0?apple?<>
  <label>Apple Account email<input aria-label="Apple Account email" type="email" autoComplete="off" maxLength={254} value={appleUsername} onChange={e=>{setAppleUsername(e.target.value);setDiscoveryApproved(false)}}/></label>
  <label>App-specific password<input aria-label="Apple app-specific password" type="password" autoComplete="off" maxLength={100} value={token} onChange={e=>{setToken(e.target.value);setDiscoveryApproved(false)}}/></label>
  <p className="authorization-note">Use an Apple app-specific password with two-factor authentication. Never enter your main Apple Account password. Calendars stay private.</p>
  <label className="csv-ack"><input type="checkbox" checked={discoveryApproved} onChange={e=>setDiscoveryApproved(e.target.checked)}/>Allow JARVIS to list my iCloud calendars so I can choose which ones to read.</label>
 </>:<>
  <label>Access token<input aria-label="Provider access token" type="password" autoComplete="off" value={token} onChange={e=>setToken(e.target.value)}/></label>
  <label>Token expiry (with timezone)<input aria-label="Token expiry" placeholder="2026-10-16T12:00:00Z" value={expiry} onChange={e=>setExpiry(e.target.value)} disabled={nonexpiring&&!google}/></label>
  {!google&&<label className="csv-ack"><input type="checkbox" checked={nonexpiring} onChange={e=>setNonexpiring(e.target.checked)}/>My approved provider token has no expiry.</label>}
 </>:step===1?apple?<>
  <p className="authorization-note">Select iCloud calendars ({selected.length}/20). This connection is independent of Google Calendar.</p>
  <fieldset className="apple-calendar-options"><legend>Available iCloud calendars</legend>{calendars.slice(calendarPage*5,calendarPage*5+5).map(calendar=><label key={calendar.url} title={calendar.name}><input type="checkbox" checked={selected.includes(calendar.url)} disabled={!selected.includes(calendar.url)&&selected.length>=20} onChange={e=>setResources((e.target.checked?[...selected,calendar.url]:selected.filter(url=>url!==calendar.url)).join('\n'))}/><span>{calendar.name}</span></label>)}</fieldset>
  <div className="csv-pagination"><span>Page {calendarPage+1} / {Math.max(1,Math.ceil(calendars.length/5))}</span><button type="button" disabled={calendarPage===0||pending} onClick={()=>setCalendarPage(p=>p-1)}>Previous calendars</button><button type="button" disabled={(calendarPage+1)*5>=calendars.length||pending} onClick={()=>setCalendarPage(p=>p+1)}>Next calendars</button></div>
  <label className="csv-ack"><input type="checkbox" checked={approved} onChange={e=>setApproved(e.target.checked)}/>I authorize read-only access to these selected calendars. App-specific passwords can grant broader access, but JARVIS only reads calendars.</label>
 </>:<>
  <label>{google?'One selected calendar ID':provider==='github'?'Selected owner/repository names':'Selected numeric course IDs'}<textarea aria-label="Selected provider resources" value={resources} maxLength={10500} onChange={e=>setResources(e.target.value)} placeholder="One selected resource per line"/></label>
  <label className="csv-ack"><input type="checkbox" checked={approved} onChange={e=>setApproved(e.target.checked)}/>I authorize read-only access to these selected resources.</label>
 </>:<>
  <label>Refresh token (optional)<input aria-label="Google refresh token" type="password" autoComplete="off" value={refreshToken} onChange={e=>setRefreshToken(e.target.value)}/></label>
  <label>OAuth client ID (for refresh)<input aria-label="Google OAuth client ID" autoComplete="off" value={clientId} onChange={e=>setClientId(e.target.value)}/></label>
  <label>OAuth client secret (for refresh)<input aria-label="Google OAuth client secret" type="password" autoComplete="off" value={clientSecret} onChange={e=>setClientSecret(e.target.value)}/></label>
 </>}
 </div>
 <p role="status">{pending?'Working…':message||(previewOnly?'Synthetic form preview. Saving and account access are disabled.':'Nothing is connected until saved. Canvas automatic refresh runs only at your selected frequency; other providers use Sync now.')}</p>
 <div className="dialog-buttons"><button disabled={pending} onClick={onClose}>Cancel</button>{step>0&&<button disabled={pending} onClick={()=>setStep(s=>s-1)}>Back</button>}{!canvas&&step<(google?2:1)?<button disabled={pending||apple&&step===0&&(!discoveryApproved||previewOnly)} onClick={apple&&step===0?findCalendars:()=>setStep(s=>s+1)}>{apple&&step===0?'Find iCloud calendars':'Continue'}</button>:<button disabled={previewOnly||pending||!approved||apple&&!selected.length} onClick={save}>Save selected authorization</button>}</div>
 </dialog>;
}
