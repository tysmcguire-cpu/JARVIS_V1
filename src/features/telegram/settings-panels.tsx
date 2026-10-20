'use client';
import {AppearancePanel} from '@/features/settings/appearance-panel';
import {useState,type ReactNode} from 'react';
import {IntegrationsPanel} from '@/features/integrations/panel';
import {TelegramPanel} from './panel';
import {DataControls} from '@/features/data-controls/panel';
export function SettingsPanels({children,demo}:{children:ReactNode;demo:boolean}){const [tab,setTab]=useState('preferences');return <><nav className="tracking-tabs" aria-label="Settings sections"><button aria-pressed={tab==='preferences'} onClick={()=>setTab('preferences')}>Preferences and connections</button><button aria-pressed={tab==='appearance'} onClick={()=>setTab('appearance')}>Appearance</button><button aria-pressed={tab==='telegram'} onClick={()=>setTab('telegram')}>Telegram</button><button aria-pressed={tab==='integrations'} onClick={()=>setTab('integrations')}>Integrations and CSV</button><button aria-pressed={tab==='data'} onClick={()=>setTab('data')}>Data controls</button></nav>{tab==='preferences'?<div className="settings-grid">{children}</div>:tab==='appearance'?<AppearancePanel demo={demo}/>:tab==='telegram'?<div className="settings-telegram-grid"><TelegramPanel demo={demo}/></div>:tab==='data'?<DataControls demo={demo}/>:<IntegrationsPanel demo={demo}/>}</>}
