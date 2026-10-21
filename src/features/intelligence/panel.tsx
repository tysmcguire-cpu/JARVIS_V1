'use client';
import {useState} from 'react';
import {VoicePanel} from './voice-panel';
import {ChatPanel} from './chat-panel';
import {ReportsPanel,ResearchPanel} from './report-research-panels';
import {AssistantPanel} from '@/features/assistant/panel';
export function IntelligencePanel({demo,voiceEnabled=false}:{demo:boolean;voiceEnabled?:boolean}){const [tab,setTab]=useState('chat');return <div className="intelligence-module"><header><h1>Pluto assistant</h1><nav aria-label="Assistant sections">{[['chat','Chat'],['reports','Reports'],['research','Research'],['analysis','Local analysis'],['voice','Voice']].map(([id,label])=><button key={id} aria-pressed={tab===id} onClick={()=>setTab(id)}>{label}</button>)}</nav></header><div className="intelligence-content">{tab==='chat'?<ChatPanel demo={demo}/>:tab==='reports'?<ReportsPanel demo={demo}/>:tab==='research'?<ResearchPanel demo={demo}/>:tab==='analysis'?<AssistantPanel demo={demo}/>:<VoicePanel demo={demo} enabled={voiceEnabled}/>}</div></div>}
