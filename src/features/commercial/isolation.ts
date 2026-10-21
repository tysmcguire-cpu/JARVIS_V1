import {z} from 'zod';
export function assertCommercialDatabase(url:string,projectRef=process.env.PLUTO_SUPABASE_PROJECT_REF,administrative=false){
 if(process.env.JARVIS_OWNER_ID)throw Error('Personal application environment is prohibited in Pluto.');
 if(!projectRef||!/^[-a-z0-9]{10,40}$/.test(projectRef))throw Error('Separate Pluto Supabase project reference required.');
 let parsed:URL;try{parsed=new URL(url)}catch{throw Error('Commercial database URL is invalid.')}if(!['postgresql:','postgres:'].includes(parsed.protocol)||parsed.searchParams.get('sslmode')!=='require')throw Error('Commercial database requires PostgreSQL and TLS.');
 const username=decodeURIComponent(parsed.username);
 if(!administrative&&!/^pluto_runtime(?:\.|$)/.test(username))throw Error('Use the restricted Pluto runtime login, never an administrator connection.');
 if(parsed.hostname!==`db.${projectRef}.supabase.co`&&!(parsed.hostname.endsWith('.pooler.supabase.com')&&username.endsWith('.'+projectRef)))throw Error('Database does not match the approved commercial project.');
 if(!z.string().min(1).safeParse(parsed.password).success)throw Error('Database credentials missing.');
}
