'use client';
import {useState,type ReactNode} from 'react';
import {TelegramPanel} from './panel';
export function SettingsPanels({children,demo}:{children:ReactNode;demo:boolean}){const [tab,setTab]=useState('preferences');return <><nav className="tracking-tabs" aria-label="Settings sections"><button aria-pressed={tab==='preferences'} onClick={()=>setTab('preferences')}>Preferences and connections</button><button aria-pressed={tab==='telegram'} onClick={()=>setTab('telegram')}>Telegram</button></nav>{tab==='preferences'?<div className="settings-grid">{children}</div>:<div className="settings-telegram-grid"><TelegramPanel demo={demo}/></div>}</>}
