import 'server-only';
export const features={
 registration:()=>process.env.PLUTO_PUBLIC_REGISTRATION==='true',
 checkout:()=>process.env.PLUTO_CHECKOUT_ENABLED==='true',
 aiChat:()=>process.env.PLUTO_AI_CHAT_ENABLED==='true',
 weeklyReports:()=>process.env.PLUTO_WEEKLY_REPORTS_ENABLED==='true',
 research:()=>process.env.PLUTO_RESEARCH_ENABLED==='true',
 voice:()=>process.env.PLUTO_VOICE_ENABLED==='true',
 integrations:()=>process.env.PLUTO_NEW_INTEGRATIONS_ENABLED==='true',
 experimental:()=>process.env.PLUTO_EXPERIMENTAL_ENABLED==='true'
};
