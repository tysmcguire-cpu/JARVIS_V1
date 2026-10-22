import Link from 'next/link';
import {settingsHref,type SuggestedPlan} from '@/features/settings/navigation';
export type SetupAvailability={checkout:boolean;integrations:boolean;telegram:boolean;ai:boolean};
export function SetupGuide({plan,availability,demo=false}:{plan?:SuggestedPlan;availability:SetupAvailability;demo?:boolean}){
 const settings=(section:Parameters<typeof settingsHref>[0])=>settingsHref(section,demo,section==='billing'?plan:undefined);
 return <main className="setup-guide"><p>PLUTO / SETUP{demo?' · Synthetic preview':''}</p><h1>Your workspace is ready</h1><p>Start tracking now. Connected services are optional.</p>
 {plan&&plan!=='free'&&<p>You selected <strong>{plan==='plus'?'Plus':'Pro'}</strong>. Review it in Subscription and usage; selecting a plan does not start a subscription or charge you.</p>}
 <nav>
  <Link href={settings('billing')}><strong>Review plan and usage</strong><span>{availability.checkout?'Review plans and confirm any purchase separately.':'Free tracking is available. New paid subscriptions are not open yet.'}</span></Link>
  <Link href={settings('integrations')}><strong>Optional connections and CSV</strong><span>{availability.integrations?'Connect Google Calendar, Apple Calendar, Canvas or GitHub with your own read-only permissions.':'New service connections are not available yet. Manual tracking and financial CSV imports remain available.'}</span></Link>
  <Link href={settings('telegram')}><strong>Telegram</strong><span>{availability.telegram?'Create a one-time pairing code in Settings for the separate Pluto bot.':'The Pluto bot is not available yet. You can add records directly in the app.'}</span></Link>
  <Link href={demo?'/demo/notes':'/notes'}><strong>Add your first note</strong><span>Add finance entries, goals, projects and tasks from their modules too.</span></Link>
  <Link href={settings('profile')}><strong>Profile and security</strong><span>Review your timezone, currency, visible modules and authenticator settings.</span></Link>
  <Link href={settings('ai')}><strong>AI permissions</strong><span>{availability.ai?'Review what you want to share before using AI. Account permissions, plan limits and service budgets still apply.':'Paid AI is not active. Your information is not shared unless you give permission and the service is enabled.'}</span></Link>
 </nav><Link className="setup-open" href={demo?'/demo':'/'}>Open dashboard</Link></main>;
}
