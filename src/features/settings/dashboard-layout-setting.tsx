'use client';
import {useEffect,useState,useTransition} from 'react';
import {dashboardSchema,defaultDashboard} from '@/features/productivity/contracts';
import {readPersonalState} from '@/features/productivity/state-actions';
import {saveDashboardLayout} from './dashboard-layout-actions';
export function DashboardLayoutSetting({demo}:{demo:boolean}){
 const [layout,setLayout]=useState('default'),[loaded,setLoaded]=useState(false),[message,setMessage]=useState(''),[pending,start]=useTransition();
 useEffect(()=>{let alive=true;const timer=setTimeout(async()=>{try{const current=demo?{value:JSON.parse(localStorage.getItem('jarvis-demo-dashboard')??'null')}:await readPersonalState('dashboard');const parsed=dashboardSchema.safeParse(current.value);if(current.value!==null&&!parsed.success)throw Error();if(alive){setLayout(parsed.success&&parsed.data.layout!=='default'?'custom':'default');setLoaded(true)}}catch{if(alive)setMessage('Could not load dashboard preferences. Reopen Appearance to retry.')}},0);return()=>{alive=false;clearTimeout(timer)}},[demo]);
 return <div><label className="clock-format-setting">Dashboard layout<select aria-label="Dashboard layout" value={layout} disabled={!loaded||pending} onChange={e=>{const next=e.target.value;start(async()=>{try{if(demo){const raw=JSON.parse(localStorage.getItem('jarvis-demo-dashboard')??'null'),parsed=dashboardSchema.safeParse(raw);if(raw!==null&&!parsed.success)throw Error();localStorage.setItem('jarvis-demo-dashboard',JSON.stringify({...(parsed.success?parsed.data:defaultDashboard),layout:next}))}else await saveDashboardLayout(next);setLayout(next);setMessage('Dashboard layout saved.')}catch{setMessage('Could not save dashboard layout. Try again.')}})}}><option value="default">Default</option><option value="custom">Custom</option></select></label>{message&&<p role="status">{message}</p>}</div>;
}
