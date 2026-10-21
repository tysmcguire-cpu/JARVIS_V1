'use client';
import {useState} from 'react';
import {ChatPanel} from './chat-panel';
import {ReportsPanel,ResearchPanel} from './report-research-panels';
import {AssistantPanel} from '@/features/assistant/panel';
export function IntelligencePanel({demo}:{demo:boolean}){const [tab,setTab]=useState('chat');return <div className="intelligence-module"><header><h1>Pluto assistant</h1><nav aria-label="Assistant sections">{[['chat','Chat'],['reports','Reports'],['research','Research'],['analysis','Local analysis'],['voice','Voice']].map(([id,label])=><button key={id} aria-pressed={tab===id} onClick={()=>setTab(id)}>{label}</button>)}</nav></header><div className="intelligence-content">{tab==='chat'?<ChatPanel demo={demo}/>:tab==='reports'?<ReportsPanel demo={demo}/>:tab==='research'?<ResearchPanel demo={demo}/>:tab==='analysis'?<AssistantPanel demo={demo}/>:<section className="panel"><h2>Voice</h2><p>Voice is disabled pending provider cost approval. Text chat and local analysis remain available.</p></section>}</div></div>}
