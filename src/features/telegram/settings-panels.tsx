'use client';
import {AiPreferencesPanel} from '@/features/intelligence/preferences-panel';
import {BillingPanel} from '@/features/billing/panel';
import {AppearancePanel} from '@/features/settings/appearance-panel';
import {ProfilePanel} from '@/features/settings/profile-panel';
import {useState,useEffect,type ReactNode} from 'react';
import {IntegrationsPanel} from '@/features/integrations/panel';
import {TelegramPanel} from './panel';
import {DataControls} from '@/features/data-controls/panel';
import {settingsSections,settingsSection,suggestedPlan,type SettingsSection,type SuggestedPlan} from '@/features/settings/navigation';
export function SettingsPanels({children,demo}:{children:ReactNode;demo:boolean}){
 const [tab,setTab]=useState<SettingsSection>('preferences'),[plan,setPlan]=useState<SuggestedPlan>();
 useEffect(()=>{
  const sync=()=>{setTab(settingsSection(window.location.hash));setPlan(suggestedPlan(new URLSearchParams(window.location.search).get('plan')))};
  const initial=setTimeout(sync,0);window.addEventListener('hashchange',sync);window.addEventListener('popstate',sync);
  return()=>{clearTimeout(initial);window.removeEventListener('hashchange',sync);window.removeEventListener('popstate',sync)};
 },[]);
 function select(section:typeof settingsSections[number]){
  const url=new URL(window.location.href);url.hash=section.hash;
  if(url.href!==window.location.href)window.history.pushState(null,'',url);
  setTab(section.id);
 }
 return <div className="module-layout"><aside className="module-rail"><div className="page-heading"><h1>Settings</h1></div><nav className="tracking-tabs" aria-label="Settings sections">{settingsSections.map(section=><button key={section.id} aria-pressed={tab===section.id} onClick={()=>select(section)}>{section.label}</button>)}</nav></aside><div className="module-body">{tab==='profile'?<ProfilePanel demo={demo}/>:tab==='preferences'?<div className="settings-grid">{children}</div>:tab==='appearance'?<AppearancePanel demo={demo}/>:tab==='telegram'?<div className="settings-telegram-grid"><TelegramPanel demo={demo}/></div>:tab==='ai'?<AiPreferencesPanel demo={demo}/>:tab==='billing'?<BillingPanel demo={demo} suggested={plan}/>:tab==='data'?<DataControls demo={demo}/>:<IntegrationsPanel demo={demo}/>}</div></div>;
}
