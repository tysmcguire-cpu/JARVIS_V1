'use client';
import Script from 'next/script';
import Link from 'next/link';
import {useEffect,useState,useTransition} from 'react';
import {beginBankLink,resumeBankSession,finishBankLink} from './actions';
type Link={token:string;sessionId:string;updating:boolean};
type Handler={open:()=>void;destroy:()=>void};
declare global{interface Window{Plaid?:{create:(options:{token:string;receivedRedirectUri?:string;onSuccess:(token:string|null)=>void;onExit:()=>void})=>Handler}}}
const storageKey='pluto-plaid-session';
export function BankLink({resume=false,disabled=false,approved=false,historyDays=730,syncMinutes=360,onConnected}:{resume?:boolean;disabled?:boolean;approved?:boolean;historyDays?:number;syncMinutes?:number;onConnected?:()=>void}){
 const [link,setLink]=useState<Link>(),[ready,setReady]=useState(false),[message,setMessage]=useState(''),[pending,startTransition]=useTransition();
 useEffect(()=>{if(!resume)return;let active=true;const id=sessionStorage.getItem(storageKey);if(!id)return;resumeBankSession(id).then(result=>{if(active){if(result.ok)setLink(result);else setMessage(result.message)}}).catch(()=>{if(active)setMessage('Could not resume the Chase connection. Return to Bank sync settings.')});return()=>{active=false}},[resume]);
 useEffect(()=>{if(!link||!ready||!window.Plaid)return;
  const handler=window.Plaid.create({token:link.token,...(resume?{receivedRedirectUri:window.location.href}:{}),onSuccess:token=>{startTransition(async()=>{try{const result=await finishBankLink({sessionId:link.sessionId,publicToken:token});if(result.ok){sessionStorage.removeItem(storageKey);setLink(undefined);setMessage('Chase authorization verified. Transactions will download in the background. Open Finances → Bank transactions.');onConnected?.()}else setMessage(result.message)}catch{setMessage('Could not finish the connection. Keep this page open and retry from Bank sync settings.')}})},onExit:()=>setMessage('Connection window closed. No successful connection is claimed. You can resume from Bank sync settings.')});handler.open();return()=>handler.destroy();
 },[link,ready,resume,onConnected]);
 const begin=()=>startTransition(async()=>{try{setMessage('');const result=await beginBankLink({approved:true,historyDays,syncMinutes});if(result.ok){sessionStorage.setItem(storageKey,result.sessionId);setLink(result)}else setMessage(result.message)}catch{setMessage('Could not start bank authorization. Check setup and try again.')}});
 return <div className="bank-link-controls">{link&&<Script src="https://cdn.plaid.com/link/v2/stable/link-initialize.js" strategy="afterInteractive" onReady={()=>setReady(true)} onError={()=>setMessage('Could not load Plaid. Check your browser network settings.')}/>}<p role="status">{pending?'Working…':message|| (resume?'Resuming your authorized Chase sign-in. Stay signed in to PLUTO.':'Chase credentials are entered only in the bank authorization flow. PLUTO stores an encrypted access token.')}</p>{!resume&&<button disabled={disabled||!approved||pending} onClick={begin}>Connect / reconnect Chase</button>}{resume&&<Link href="/settings">Return to Bank sync settings</Link>}</div>;
}
