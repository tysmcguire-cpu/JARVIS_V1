export const settingsSections=[
 {id:'profile',hash:'profile',label:'Profile and security'},
 {id:'preferences',hash:'preferences',label:'Preferences and connections'},
 {id:'appearance',hash:'appearance',label:'Appearance'},
 {id:'telegram',hash:'telegram',label:'Telegram'},
 {id:'integrations',hash:'integrations',label:'Integrations and CSV'},
 {id:'ai',hash:'ai',label:'AI permissions'},
 {id:'billing',hash:'subscription',label:'Subscription and usage'},
 {id:'data',hash:'data',label:'Data controls'}
] as const;
export type SettingsSection=typeof settingsSections[number]['id'];
export type SuggestedPlan='free'|'plus'|'pro';
export function suggestedPlan(value:unknown):SuggestedPlan|undefined{return value==='free'||value==='plus'||value==='pro'?value:undefined}
export function settingsSection(hash:string):SettingsSection{return settingsSections.find(section=>section.hash===hash.replace(/^#/, '')||section.id===hash.replace(/^#/, ''))?.id??'preferences'}
export function settingsHref(section:SettingsSection,demo=false,plan?:SuggestedPlan){return (demo?'/demo/settings':'/settings')+(plan?'?plan='+plan:'')+'#'+settingsSections.find(value=>value.id===section)!.hash}
