import {expect,it} from 'vitest';
import {defaultRuleSettings,ruleSettingsSchema,repetitionKey} from '@/features/notifications/rules';
import {scheduledSlots,type Settings} from '@/features/notifications/schedule';
const settings:Settings={timezone:'America/Chicago',weeklyReviewEnabled:true,weeklyReviewDay:0,weeklyReviewTime:'18:00',deadlineReminders:true,financialAlerts:true,morningBriefingEnabled:true,morningBriefingTime:'08:00',notificationTelegramEnabled:false};
it('supports selected weekdays and explicit multiweek cycles without changing review contents',()=>{
 const policy={telegram:false,days:[1,3],everyWeeks:2,startDate:'2026-10-18'};
 expect(scheduledSlots('weekly',settings,new Date('2026-10-18T00:00Z'),new Date('2026-10-22T00:00Z'),policy).map(s=>s.date)).toEqual(['2026-10-19','2026-10-21']);
 expect(scheduledSlots('weekly',settings,new Date('2026-10-25T00:00Z'),new Date('2026-10-29T00:00Z'),policy)).toEqual([]);
 expect(scheduledSlots('weekly',settings,new Date('2026-11-01T00:00Z'),new Date('2026-11-05T01:00Z'),policy).map(s=>s.date)).toEqual(['2026-11-02','2026-11-04']);
 expect(scheduledSlots('weekly',settings,new Date('2026-10-18T00:00Z'),new Date('2026-10-22T00:00Z'),{...policy,startDate:'2026-11-01'})).toEqual([]);
});
it('deduplicates local hourly intervals and daily occurrences across scans',()=>{
 const p={repeat:'interval' as const,intervalHours:2};
 expect(repetitionKey(p,'2026-10-19','09:00','2026-10-19','09:00')).toBe('interval:0');
 expect(repetitionKey(p,'2026-10-19','10:59','2026-10-19','09:00')).toBe('interval:0');
 expect(repetitionKey(p,'2026-10-19','11:00','2026-10-19','09:00')).toBe('interval:1');
 expect(repetitionKey({...p,repeat:'daily'},'2026-10-19','11:00','2026-10-18')).toBe('2026-10-19');
});
it('rejects unsafe or empty schedules and keeps the legacy cadence by default',()=>{
 const defaults=defaultRuleSettings(settings);expect(defaults.reminder.repeat).toBe('once');expect(defaults.weekly.days).toEqual([0]);
 for(const patch of [{weekly:{...defaults.weekly,days:[]}},{weekly:{...defaults.weekly,days:[1,1]}},{morning:{...defaults.morning,everyWeeks:0}},{deadline:{...defaults.deadline,entities:['arbitrary SQL']}},{reminder:{...defaults.reminder,intervalHours:0}},{financial:{...defaults.financial,time:'25:00'}}])expect(ruleSettingsSchema.safeParse({...defaults,...patch}).success).toBe(false);
});
it('custom morning days retain DST gap and repeated-hour safety',()=>{
 const p={telegram:true,days:[0],everyWeeks:1};
 const fall=scheduledSlots('morning',{...settings,morningBriefingTime:'01:30'},new Date('2026-11-01T05:00Z'),new Date('2026-11-01T09:00Z'),p);
 expect(fall).toHaveLength(1);
 const spring=scheduledSlots('morning',{...settings,morningBriefingTime:'02:30'},new Date('2026-03-08T06:00Z'),new Date('2026-03-08T10:00Z'),p);
 expect(spring[0].at.toISOString()).toBe('2026-03-08T08:00:00.000Z');
});
