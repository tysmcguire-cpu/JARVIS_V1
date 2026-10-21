import 'server-only';
import {z} from 'zod';
const authSchema=z.object({NEXT_PUBLIC_SUPABASE_URL:z.url(),NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:z.string().min(1),PLUTO_SUPABASE_PROJECT_REF:z.string().regex(/^[-a-z0-9]{10,40}$/)});
export function getAuthConfig(){
 if(process.env.JARVIS_OWNER_ID)return null;
 const parsed=authSchema.safeParse(process.env);if(!parsed.success)return null;
 const url=new URL(parsed.data.NEXT_PUBLIC_SUPABASE_URL);
 if(url.protocol!=='https:'||url.hostname!==parsed.data.PLUTO_SUPABASE_PROJECT_REF+'.supabase.co')return null;
 return parsed.data;
}
