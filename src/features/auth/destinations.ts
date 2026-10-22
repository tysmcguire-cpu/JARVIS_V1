export const authDestinations={workspace:'/',admin:'/admin','reset-password':'/reset-password'} as const;
export type AuthDestination=keyof typeof authDestinations;
export function authDestination(value:unknown):AuthDestination{return value==='admin'||value==='reset-password'?value:'workspace'}
export function mfaHref(value:AuthDestination){return value==='workspace'?'/mfa':'/mfa?next='+value}
