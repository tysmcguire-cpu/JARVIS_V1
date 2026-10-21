'use client';

import {useState, type ReactNode} from 'react';
import {ArrowUpRight, Bell, CalendarDays, Circle, ListTodo, Wallet} from 'lucide-react';
import {NavigationLink as Link} from '@/features/shell/navigation-link';
import {formatMoney, moneyInput} from '@/features/tracking/config';
import {recordHref, type HubData, type HubRow} from '@/features/productivity/hub-query';
import styles from './today-overview.module.css';
import {WidgetCanvas} from './widget-canvas';
import {type CanvasWidget} from '@/features/productivity/contracts';

function dateLabel(date:string, today:string) {
  if(!date)return 'No date';
  const days=Math.round((Date.parse(date)-Date.parse(today))/86400000);
  if(days===0)return 'Today';
  if(days===1)return 'Tomorrow';
  return new Date(date+'T12:00:00Z').toLocaleDateString('en-US',{month:'short',day:'numeric',timeZone:'UTC'});
}

function SectionLink({href,label}:{href:string;label:string}) {
  return <Link className={styles.sectionLink} href={href} aria-label={label} title={label}><ArrowUpRight size={17}/></Link>;
}

function PanelHeading({icon,title,count,href}:{icon:ReactNode;title:string;count?:number;href:string}) {
  return <header className={styles.panelHeading}><span className={styles.symbol} aria-hidden="true">{icon}</span><h2>{title}</h2>{count!==undefined&&<span className={styles.count}>{count}</span>}<SectionLink href={href} label={`Open ${title}`}/></header>;
}

function TaskRows({rows,today,demo,deadline=false}:{rows:HubRow[];today:string;demo:boolean;deadline?:boolean}) {
  return <ul className={styles.taskRows}>{rows.slice(0,2).map(row=><li key={row.key+row.id}><Link href={recordHref(row,demo)} title={row.title}>
    <span className={deadline?styles.diamond:styles.taskDot} aria-hidden="true">{!deadline&&<Circle size={14}/>}</span>
    <span className={styles.recordTitle}>{row.title}</span>
    <span className={styles.due} data-past={row.date<today&&row.status!=='unknown'}>{dateLabel(row.date,today)}{row.status==='unknown'&&<span aria-label="Completion unknown" title="Canvas does not provide completion status"> ?</span>}</span>
  </Link></li>)}</ul>;
}

function Spending({hub,demo}:{hub:HubData;demo:boolean}) {
  const [selected,setSelected]=useState('');
  const currencies=[...new Set([...hub.spending.map(s=>s.currency),...(hub.dailySpending??[]).map(s=>s.currency)])];
  const currency=currencies.includes(selected)?selected:currencies.includes(hub.currency??'')?hub.currency!:currencies[0]??'USD';
  const amount=hub.spending.find(s=>s.currency===currency)?.amount??'0';
  const days=hub.dailySpending?.find(s=>s.currency===currency)?.days??[];
  const maximum=days.reduce((n,d)=>BigInt(d.amount)>n?BigInt(d.amount):n,0n);
  return <section className={`${styles.panel} ${styles.spending}`} data-today-panel="spending" aria-label="Spending summary">
    <PanelHeading icon={<Wallet size={16}/>} title="Spending" href={`${demo?'/demo':''}/finances`}/>
    <div className={styles.spendingBody}><div><span className={styles.caption}>Month to date</span><div className={styles.money}><span>{currency}</span><strong>{moneyInput(amount)}</strong></div></div>
      <div className={styles.chart}>{days.length>0?<svg viewBox="0 0 180 44" role="img" aria-label={`Daily spending over the last seven days in ${currency}`}><title>{days.map(d=>`${d.date}: ${formatMoney(BigInt(d.amount),currency)}`).join('; ')}</title><path d="M3 39H177"/>{days.map((day,i)=>{const height=maximum?Number(BigInt(day.amount)*3200n/maximum)/100:0;return <rect key={day.date} x={7+i*24} y={39-height} width={13} height={height} rx={2}><title>{day.date+': '+formatMoney(BigInt(day.amount),currency)}</title></rect>})}</svg>:<span className={styles.caption}>No daily history yet</span>}<span className={styles.caption}>Last 7 days</span></div>
      {currencies.length>1&&<select className={styles.currency} aria-label="Dashboard spending currency" value={currency} onChange={e=>setSelected(e.target.value)}>{currencies.map(c=><option key={c}>{c}</option>)}</select>}
    </div>
  </section>;
}

export function TodayOverview({hub,demo,configuration,pending,onSave}:{hub?:HubData;demo:boolean;configuration?:CanvasWidget[];pending:boolean;onSave:(widgets:CanvasWidget[])=>void}) {
  const path=(module:string)=>`${demo?'/demo':''}/${module}`;
  const schedule=hub?.groups.schedule, tasks=hub?.groups.tasks, deadlines=hub?.groups.deadlines;
  return <WidgetCanvas configuration={configuration} pending={pending} onSave={onSave} extra={kind=>{const group=hub?.groups[kind];return <section className={styles.panel}><PanelHeading icon={<ListTodo size={17}/>} title={kind[0].toUpperCase()+kind.slice(1)} count={group?.total} href={path(kind==='tasks'?'calendar':kind==='deadlines'?'education':kind)}/>{hub?<>{group?.rows.length?<TaskRows rows={group.rows} today={hub.today} demo={demo} deadline={kind==='deadlines'}/>:<p className={styles.empty}>Nothing to show.</p>}</>:<p className={styles.empty}>Loading…</p>}</section>}}>
    <section className={`${styles.panel} ${styles.schedule}`} data-today-panel="schedule" aria-label="Today schedule">
      <PanelHeading icon={<CalendarDays size={17}/>} title="Today’s schedule" count={schedule?.total} href={path('calendar')}/>
      {!hub?<p className={styles.empty}>Loading schedule…</p>:schedule?.rows.length?<ol className={styles.timeline}>{schedule.rows.slice(0,3).map((row,i)=><li key={row.key+row.id}>
        <div className={styles.timelineTime}>{row.date===hub.today&&row.time?<><strong>{row.time}</strong>{row.endTime&&<small>{row.endTime}</small>}</>:<small>{row.date<hub.today?'Continues':'Time not provided'}</small>}</div>
        <span className={styles.timelineTrack} aria-hidden="true"><i data-first={i===0}/></span>
        <Link href={recordHref(row,demo)} title={row.title}><strong>{row.title}</strong><small>{row.date<hub.today?'Multi-day event':row.sourceKind==='Assignment'?'Assignment deadline':row.time?'Scheduled event':'Calendar event'}</small></Link>
      </li>)}</ol>:<div className={styles.emptySchedule}><CalendarDays size={26} strokeWidth={1}/><p>No events scheduled.</p><Link href={path('calendar')}>Open calendar <ArrowUpRight size={13}/></Link></div>}
      {hub&&!!schedule?.total&&<footer className={styles.panelFooter}><span>{Math.min(3,schedule.total)} of {schedule.total} scheduled</span><Link href={path('calendar')}>View day <ArrowUpRight size={12}/></Link></footer>}
    </section>

    <section className={`${styles.panel} ${styles.priorities}`} data-today-panel="priorities" aria-label="Tasks and deadlines">
      <div className={styles.taskSection}><PanelHeading icon={<ListTodo size={17}/>} title="Open tasks" count={tasks?.total} href={path('calendar')+'?type=Task'}/>{hub?<>{tasks?.rows.length?<TaskRows rows={tasks.rows} today={hub.today} demo={demo}/>:<p className={styles.empty}>No open tasks.</p>}</>:<p className={styles.empty}>Loading tasks…</p>}</div>
      <div className={styles.deadlineSection}><PanelHeading icon={<span className={styles.deadlineIcon}/>} title="Deadlines" count={deadlines?.total} href={path('education')+'?type=Assignment'}/>{hub?<>{deadlines?.rows.length?<TaskRows rows={deadlines.rows} today={hub.today} demo={demo} deadline/>:<p className={styles.empty}>No deadlines in this window.</p>}</>:<p className={styles.empty}>Loading deadlines…</p>}<p className={styles.horizon}>Next 7 days + earlier dates</p></div>
    </section>

    <section className={`${styles.panel} ${styles.inbox}`} data-today-panel="inbox" aria-label="Notification summary"><PanelHeading icon={<Bell size={16}/>} title="Notifications" href={path('notifications')}/><div className={styles.inboxBody}><strong className={styles.inboxNumber}>{hub?.unread??'—'}<span>unread</span></strong><p>{!hub?'Loading inbox…':hub.notifications?.[0]?.title??(hub.unread?'Open inbox to review.':'No unread notifications.')}<Link href={path('notifications')}>View inbox <ArrowUpRight size={12}/></Link></p></div></section>
    {hub?<Spending hub={hub} demo={demo}/>:<section className={`${styles.panel} ${styles.spending}`}><PanelHeading icon={<Wallet size={16}/>} title="Spending" href={path('finances')}/><p className={styles.empty}>Loading spending…</p></section>}
  </WidgetCanvas>;
}
