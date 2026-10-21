import {z} from 'zod';
export function eventSeriesDates(start:string,end:string,frequency:string,count:number){
 z.iso.date().parse(start);z.iso.date().parse(end);z.enum(['none','daily','weekly','monthly']).parse(frequency);z.number().int().min(1).max(52).parse(count);
 const anchor=new Date(start+'T12:00:00Z'),duration=Date.parse(end)-Date.parse(start);if(duration<0)throw Error('End must follow start.');
 return Array.from({length:frequency==='none'?1:count},(_,i)=>{let date=new Date(anchor);if(frequency==='daily'||frequency==='weekly')date.setUTCDate(anchor.getUTCDate()+i*(frequency==='weekly'?7:1));else if(frequency==='monthly'){const month=anchor.getUTCMonth()+i,last=new Date(Date.UTC(anchor.getUTCFullYear(),month+1,0,12)).getUTCDate();date=new Date(Date.UTC(anchor.getUTCFullYear(),month,Math.min(last,anchor.getUTCDate()),12))}return {startDate:date.toISOString().slice(0,10),endDate:new Date(date.getTime()+duration).toISOString().slice(0,10)}});
}
export function eventConflicts(items:{id?:string;date:string;time?:string;endTime?:string;key?:string}[]){
 const conflicts=new Set<string>();for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++){const a=items[i],b=items[j];if(a.date===b.date&&a.key==='Event'&&b.key==='Event'&&a.time&&b.time&&a.endTime&&b.endTime&&a.time<b.endTime&&b.time<a.endTime){if(a.id)conflicts.add(a.id);if(b.id)conflicts.add(b.id)}}return conflicts;
}
