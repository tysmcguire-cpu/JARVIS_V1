'use client';
import {useState,type ReactNode} from 'react';
import {IntegrationsPanel} from '@/features/integrations/panel';
import {TelegramPanel} from './panel';
export function SettingsPanels({children,demo}:{children:ReactNode;demo:boolean}){const [tab,setTab]=useState('preferences');return <><nav className="tracking-tabs" aria-label="Settings sections"><button aria-pressed={tab==='preferences'} onClick={()=>setTab('preferences')}>Preferences and connections</button><button aria-pressed={tab==='telegram'} onClick={()=>setTab('telegram')}>Telegram</button><button aria-pressed={tab==='integrations'} onClick={()=>setTab('integrations')}>Integrations and CSV</button></nav>{tab==='preferences'?<div className="settings-grid">{children}</div>:tab==='telegram'?<div className="settings-telegram-grid"><TelegramPanel demo={demo}/></div>:<IntegrationsPanel demo={demo}/>}</>}
