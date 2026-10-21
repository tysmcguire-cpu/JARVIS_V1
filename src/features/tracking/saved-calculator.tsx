'use client';
import {useEffect,useState,useTransition} from 'react';
import {GradeCalculator} from './grade-calculator';
import {readPersonalState,savePersonalState} from '@/features/productivity/state-actions';
import {scenarioSchema} from '@/features/productivity/contracts';
import type {z} from 'zod';
type Scenario=z.infer<typeof scenarioSchema>;
export function SavedCalculator({courseId,demo}:{courseId?:string;demo:boolean}){
 const [saved,setSaved]=useState<Scenario>(),[draft,setDraft]=useState<Scenario>(),[version,setVersion]=useState(0),[ready,setReady]=useState(!courseId),[message,setMessage]=useState(''),[pending,start]=useTransition();
 useEffect(()=>{let active=true;if(!courseId)return;start(async()=>{try{const result=demo?{value:JSON.parse(sessionStorage.getItem('calculator:'+courseId)??'null'),version:0}:await readPersonalState('calculator:'+courseId);if(active){const parsed=scenarioSchema.safeParse(result.value);setSaved(parsed.success?parsed.data:undefined);setVersion(result.version);setReady(true)}}catch{if(active){setReady(false);setMessage('Could not load the saved scenario. Reopen the calculator to retry.')}}});return()=>{active=false}},[courseId,demo]);
 return <div className="saved-calculator"><div className="scenario-controls"><span>{courseId?'Course scenario':'Choose a course to save a scenario across devices.'}</span><button disabled={!courseId||!draft||!ready||pending} onClick={()=>start(async()=>{try{if(demo)sessionStorage.setItem('calculator:'+courseId,JSON.stringify(draft));else{const next=await savePersonalState('calculator:'+courseId,draft,version);setVersion(next.version)}setMessage('Scenario saved for this course.')}catch{setMessage('Could not save. Reload if another device changed this scenario.')}})}>Save scenario</button><span role="status">{message}</span></div>{ready?<GradeCalculator initial={saved} onChange={setDraft}/>:<p>{pending?'Loading scenario…':message}</p>}</div>;
}
