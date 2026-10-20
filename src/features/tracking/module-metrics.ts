import {entityFor, type RecordRow} from './config';
export type ModuleFacts={today:string;upcoming:number;overdue:number;unknown:number;done:number;active:number;interviews:number;offers:number;minutes:number;earned:string;possible:string;reached:number;tags:number;tagged:number;units:string[]};
export function workspaceToday(timezone='America/Chicago'){return new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())}
export function rowFacts(key:string,rows:RecordRow[],today:string):ModuleFacts{
 const entity=entityFor(key),date=entity.fields.find(f=>f.type==='date')?.name;
 const open=rows.filter(r=>!['done','rejected','withdrawn'].includes(r.status));
 return {today,upcoming:date?open.filter(r=>r[date]>=today).length:0,overdue:date?open.filter(r=>r[date]<today&&r.status!=='unknown').length:0,unknown:rows.filter(r=>r.status==='unknown').length,done:rows.filter(r=>r.status==='done').length,active:rows.filter(r=>r.status==='active').length,interviews:rows.filter(r=>r.status==='interview').length,offers:rows.filter(r=>r.status==='offer').length,minutes:rows.reduce((n,r)=>n+Number(r.minutes??0),0),earned:rows.reduce((n,r)=>n+BigInt(r.pointsEarned||0),0n).toString(),possible:rows.reduce((n,r)=>n+BigInt(r.pointsPossible||0),0n).toString(),reached:rows.filter(r=>Number(r.target)>0&&Number(r.current)>=Number(r.target)).length,tags:new Set(rows.map(r=>r.tag).filter(Boolean)).size,tagged:rows.filter(r=>r.tag).length,units:[...new Set(rows.map(r=>r.unit).filter(Boolean))].sort().slice(0,4)};
}
export function moduleSummary(key:string,total:number,f:ModuleFacts){
 const entity=entityFor(key),out=[{label:entity.label==='Activity'?'Activity entries':entity.label,value:String(total)}];
 const add=(label:string,value:unknown)=>out.push({label,value:String(value)});
 if(['Assignment','Exam','Task','FollowUp','Milestone','Project','Goal'].includes(key)){add('Upcoming / open',f.upcoming);add('Past due / not done',f.overdue);if(f.unknown)add('Canvas status unknown',f.unknown);else add('Completed',f.done)}
 if(key==='CareerApplication'){add('Interview stage',f.interviews);add('Offers',f.offers)}
 if(key==='Grade'){add('Points earned / possible',f.earned+' / '+f.possible);add('Recorded points · unweighted',BigInt(f.possible)>0n?(Number(f.earned)/Number(f.possible)*100).toFixed(1)+'%':'Not recorded')}
 if(key==='StudySession'){add('Study time',Math.floor(f.minutes/60)+'h '+f.minutes%60+'m');add('Average session',total?Math.round(f.minutes/total)+' min':'Not recorded')}
 if(key==='Goal')add('Target reached',f.reached);
 if(key==='Habit')add('Target units · up to 4',f.units.length?f.units.join(' · '):'Not recorded');
 if(key==='HabitEntry')add('Log coverage','Individual entries');
 if(key==='Note'){add('Distinct tags',f.tags);add('Untagged',total-f.tagged)}
 if(key==='Event'||key==='Reminder'||key==='RecurringExpense'){add('On / after today',f.upcoming);add('Before today',f.overdue)}
 return out;
}
