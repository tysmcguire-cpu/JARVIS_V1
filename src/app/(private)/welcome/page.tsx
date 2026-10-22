import {SetupGuide} from '@/features/auth/setup-guide';
import {features} from '@/features/commercial/flags';
import {suggestedPlan} from '@/features/settings/navigation';
export default async function WelcomePage({searchParams}:{searchParams:Promise<{plan?:string}>}){
 const plan=suggestedPlan((await searchParams).plan);
 return <SetupGuide plan={plan} availability={{checkout:features.checkout(),integrations:features.integrations(),telegram:process.env.TELEGRAM_ENABLED==='true'&&!!process.env.TELEGRAM_BOT_TOKEN,ai:features.aiChat()}}/>;
}
