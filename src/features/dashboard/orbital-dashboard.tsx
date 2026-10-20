'use client';
import {useState,type CSSProperties} from 'react';
import {NavigationLink as Link} from '@/features/shell/navigation-link';
import {ArrowUpRight,Bell,BookOpen,BriefcaseBusiness,CalendarDays,FolderKanban,NotebookPen,Pause,Play,Settings,Sparkles,Target,Wallet} from 'lucide-react';
import {FlowingCore} from '@/components/ui/flowing-core';
import {navigation} from '@/features/shell/navigation';
import styles from './dashboard.module.css';
const modules=[
 {slug:'finances',icon:Wallet,color:'#6ee0bb'},
 {slug:'education',icon:BookOpen,color:'#b1a0ff'},
 {slug:'calendar',icon:CalendarDays,color:'#69d8f3'},
 {slug:'career',icon:BriefcaseBusiness,color:'#edbb7c'},
 {slug:'projects',icon:FolderKanban,color:'#8eaeff'},
 {slug:'goals',icon:Target,color:'#d1a1f4'},
 {slug:'notes',icon:NotebookPen,color:'#8bd9ca'},
 {slug:'assistant',icon:Sparkles,color:'#96baff'},
 {slug:'notifications',icon:Bell,color:'#e0bd86'},
 {slug:'settings',icon:Settings,color:'#88b9cc'}
] as const;
export function OrbitalDashboard({demo}:{demo:boolean}){
 const [selected,setSelected]=useState<string|null>(null),[paused,setPaused]=useState(false);
 const label=(slug:string)=>navigation.find(m=>m.slug===slug)!.label;
 return <div className={styles.dashboard} data-paused={paused}>
 <header className={styles.heading}><h1>JARVIS</h1><button className={styles.motion} aria-label={paused?'Resume interface animations':'Pause interface animations'} aria-pressed={paused} onClick={()=>setPaused(p=>!p)}>{paused?<Play size={13}/>:<Pause size={13}/>}<span>{paused?'Resume motion':'Pause motion'}</span></button></header>
 <section className={styles.stage} aria-label="JARVIS command hub">
 <div className={styles.ambient} aria-hidden="true"/>
 <svg className={styles.connections} viewBox="0 0 1000 600" preserveAspectRatio="none" fill="none" aria-hidden="true">{modules.map((m,i)=>{const left=i<5,y=60+(i%5)*120,d=left?`M260 ${y} C345 ${y} 355 300 412 300`:`M740 ${y} C655 ${y} 645 300 588 300`;return <g key={m.slug} data-selected={selected===m.slug}><path d={d}/><path d={d} className={styles.packet} style={{animationDelay:`${(i%5)*.85}s`}}/></g>})}</svg>
 <div className={styles.center}>
 <div className={styles.orbits} aria-hidden="true"><i/><i/><i/><span/><b/></div>
 <div className={styles.core}><FlowingCore paused={paused}/></div>
 <div className={`hub-selection ${styles.selection}`} aria-live="polite">{selected&&<strong>{label(selected)}</strong>}</div>
 </div>
 <nav className={styles.modules} aria-label="Workspace modules">{modules.map((m,i)=>{const Icon=m.icon;return <Link key={m.slug} href={demo?`/demo/${m.slug}`:`/${m.slug}`} aria-label={`Open ${label(m.slug)}`} className={styles.module} data-side={i<5?'left':'right'} data-selected={selected===m.slug} style={{gridColumn:i<5?1:3,gridRow:i%5+1,'--accent':m.color} as CSSProperties} onMouseEnter={()=>setSelected(m.slug)} onMouseLeave={()=>setSelected(null)} onFocus={()=>setSelected(m.slug)} onBlur={()=>setSelected(null)} onClick={e=>{if(!e.metaKey&&!e.ctrlKey&&!e.shiftKey&&!e.altKey)setPaused(true)}}><span className={styles.icon}><Icon size={21}/></span><strong>{label(m.slug)}</strong><ArrowUpRight className={styles.arrow} size={14}/></Link>})}</nav>
 </section>
 </div>;
}
