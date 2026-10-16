'use client';
import type {Preferences} from './schedule';
import {defaultRuleSettings,deadlineEntities,type Kind,type RuleSettings} from './rules';

export const schedulePages=['Review timing','Review frequency','Deadline timing','Deadline frequency','Deadline sources','Financial threshold','Financial frequency','Briefing timing','Briefing frequency','Stored reminders'];
type Props={prefs:Preferences;page:number;change:(key:keyof Preferences,value:unknown)=>void};
export function ScheduleFields({prefs,page,change}:Props){
 const rules=prefs.rules??defaultRuleSettings(prefs);
 const policy=<K extends Kind>(kind:K,key:keyof RuleSettings[K],value:unknown)=>change('rules',{...rules,[kind]:{...rules[kind],[key]:value}});
 const checkbox=(key:keyof Preferences,label:string)=><label><input type="checkbox" checked={Boolean(prefs[key])} onChange={e=>change(key,e.target.checked)}/>{label}</label>;
 const telegram=(kind:Kind,label:string)=><label><input type="checkbox" checked={rules[kind].telegram} onChange={e=>policy(kind,'telegram',e.target.checked)}/>{label}</label>;
 const calendar=(kind:'weekly'|'morning')=><>
  <fieldset className="notification-checks"><legend>Selected days</legend>{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((name,day)=><label key={name}><input type="checkbox" aria-label={`${kind==='weekly'?'Review':'Briefing'} ${name}`} checked={rules[kind].days.includes(day)} onChange={e=>{const selected=e.target.checked?[...rules[kind].days,day].sort():rules[kind].days.filter(d=>d!==day);policy(kind,'days',selected);if(kind==='weekly'&&selected.length)change('weeklyReviewDay',selected[0]);}}/>{name}</label>)}</fieldset>
  <label>Repeat every (weeks)<input type="number" min={1} max={12} required value={rules[kind].everyWeeks} onChange={e=>policy(kind,'everyWeeks',Number(e.target.value))}/></label>
  <label>Cycle start date (optional)<input type="date" value={rules[kind].startDate??''} onChange={e=>policy(kind,'startDate',e.target.value||undefined)}/></label>
  {telegram(kind,kind==='weekly'?'Telegram for reviews':'Telegram for briefings')}
 </>;
 const repetition=(kind:'deadline'|'financial'|'reminder')=><>
  <label>Repeat frequency<select aria-label="Repeat frequency" value={rules[kind].repeat} onChange={e=>policy(kind,'repeat',e.target.value)}><option value="once">{kind==='financial'?'Once per month at threshold':'Once per unchanged record'}</option><option value="daily">Every day</option><option value="interval">Every N hours</option></select></label>
  <label>Repeat interval (hours)<input type="number" min={1} max={168} required disabled={rules[kind].repeat!=='interval'} value={rules[kind].intervalHours} onChange={e=>policy(kind,'intervalHours',Number(e.target.value))}/></label>
 </>;
 return <div className="notification-fields notification-custom-fields">
 {page===0?<>{checkbox('weeklyReviewEnabled','Weekly review enabled')}<label>Weekly review day<select value={prefs.weeklyReviewDay} onChange={e=>{const day=Number(e.target.value);change('weeklyReviewDay',day);change('rules',{...rules,weekly:{...rules.weekly,days:[day]}})}}>{['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map((d,i)=><option key={d} value={i}>{d}</option>)}</select></label><label>Weekly review time<input type="time" required value={prefs.weeklyReviewTime} onChange={e=>change('weeklyReviewTime',e.target.value)}/></label><label>Workspace timezone<input required maxLength={100} value={prefs.timezone} onChange={e=>change('timezone',e.target.value)}/></label><p>Use Review frequency to choose multiple days. Each review summarizes seven calendar days.</p></>
 :page===1?calendar('weekly')
 :page===2?<>{checkbox('deadlineReminders','Deadline reminders enabled')}<label>Days before deadline<input type="number" min={0} max={30} required value={prefs.leadDays} onChange={e=>change('leadDays',Number(e.target.value))}/></label><label>Deadline reminder time<input type="time" required value={prefs.deadlineTime} onChange={e=>change('deadlineTime',e.target.value)}/></label><p>Repeat while inside the lead window, at or after this daily time. Stop when completed or past due.</p></>
 :page===3?<>{repetition('deadline')}{telegram('deadline','Telegram for deadlines')}<p>Choose which records trigger alerts on Deadline sources. Intervals use workspace wall-clock hours.</p></>
 :page===4?<><fieldset className="notification-checks"><legend>Notify me about</legend>{deadlineEntities.map(entity=><label key={entity}><input type="checkbox" checked={rules.deadline.entities.includes(entity)} onChange={e=>policy('deadline','entities',e.target.checked?[...rules.deadline.entities,entity]:rules.deadline.entities.filter(v=>v!==entity))}/>{({Task:'Tasks',Assignment:'Assignments',Exam:'Exams',Milestone:'Milestones',FollowUp:'Follow-ups'})[entity]}</label>)}</fieldset><p>Choose at least one source. Stored task reminders have their own controls and are independent of deadline alerts.</p></>
 :page===5?<>{checkbox('financialAlerts','Financial alerts enabled')}<label>Monthly recorded expense threshold<input inputMode="decimal" maxLength={20} placeholder="Not configured" value={prefs.threshold} onChange={e=>change('threshold',e.target.value)}/></label><label>Alert currency<select value={prefs.currency} onChange={e=>change('currency',e.target.value)}>{['USD','CAD','EUR','GBP'].map(c=><option key={c}>{c}</option>)}</select></label><p>A blank threshold pauses this alert. Uses recorded expenses only; no bank access or currency conversion.</p></>
 :page===6?<>{repetition('financial')}<label>Financial alert time<input type="time" required value={rules.financial.time} onChange={e=>policy('financial','time',e.target.value)}/></label>{telegram('financial','Telegram for financial alerts')}<p>Repeat while this monthly recorded expenses are at or above the threshold. Intervals anchor to the first day of the month at this time.</p></>
 :page===7?<>{checkbox('morningBriefingEnabled','Daily morning briefing enabled')}<label>Morning briefing time<input type="time" required value={prefs.morningBriefingTime} onChange={e=>change('morningBriefingTime',e.target.value)}/></label><p>Choose days and frequency on Briefing frequency. Disabled by default; uses the current day of recorded facts.</p></>
 :page===8?calendar('morning')
 :<>{<label><input type="checkbox" checked={rules.reminder.enabled} onChange={e=>policy('reminder','enabled',e.target.checked)}/>Stored reminders enabled</label>}{repetition('reminder')}{telegram('reminder','Telegram for stored reminders')}<p>Set each reminder first date/time in Calendar or with /remind. Daily repeats use that time; hourly repeats anchor to it. Repeats stop when the task is completed.</p></>}
 </div>;
}
