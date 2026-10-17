import {withOwnerRequest} from '@/features/auth/server';
import {deleteOwnerAppData} from '@/features/data-controls/repository';
import {createAuthClient} from '@/lib/supabase/server';
export async function POST(request:Request){return withOwnerRequest(async()=>{
 if(request.headers.get('origin')!==new URL(request.url).origin)return Response.json({error:'Origin rejected'},{status:403});
 const text=await request.text();if(text.length>128)return Response.json({error:'Invalid confirmation'},{status:400});
 try{const input=JSON.parse(text);await deleteOwnerAppData(input.confirmation);}catch(error){return Response.json({error:error instanceof Error&&error.message==='Disconnect and revoke the bank connection before deleting app data.'?error.message:'Deletion unavailable. Check the confirmation.'},{status:400,headers:{'Cache-Control':'private, no-store'}})}
 try{await (await createAuthClient()).auth.signOut({scope:'local'})}catch{/* App data is already deleted; do not misreport failure. */}
 return Response.json({deleted:true},{headers:{'Cache-Control':'private, no-store'}});
})}
