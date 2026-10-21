import {z} from 'zod';
export function verifiedCustomer(user:{id?:string;email_confirmed_at?:string|null}|null|undefined){return !!user&&z.uuid().safeParse(user.id).success&&!!user.email_confirmed_at;}
// Historical policy helper retained only for migration-era tests; never used for commercial authorization.
export function isOwner(userId:string|undefined,ownerId:string|undefined){return !!userId&&!!ownerId&&z.uuid().safeParse(ownerId).success&&userId===ownerId}
export function demoEnabled(env:{NODE_ENV?:string;PLUTO_DEMO_MODE?:string}){return env.NODE_ENV!=='production'&&env.PLUTO_DEMO_MODE==='true'}
