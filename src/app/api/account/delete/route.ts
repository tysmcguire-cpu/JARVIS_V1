import {readBoundedText} from '@/lib/bounded-response';
import {matchesRequestOrigin} from '@/lib/request-origin';
import {withCustomerRequest} from '@/features/auth/server';
import {deleteOwnerAppData} from '@/features/data-controls/repository';
import {createAuthClient} from '@/lib/supabase/server';
export async function POST(request:Request){return withCustomerRequest(async()=>{
 if(!matchesRequestOrigin(request))return Response.json({error:'Origin rejected'},{status:403});
 let text:string;try{text=await readBoundedText(request,128)}catch{return Response.json({error:'Invalid confirmation'},{status:400})}
 try{const input=JSON.parse(text);await deleteOwnerAppData(input.confirmation);}catch(error){return Response.json({error:error instanceof Error&&error.message==='Disconnect and revoke the bank connection before deleting app data.'?error.message:'Deletion unavailable. Check the confirmation.'},{status:400,headers:{'Cache-Control':'private, no-store'}})}
 try{await (await createAuthClient()).auth.signOut({scope:'local'})}catch{/* App data is already deleted; do not misreport failure. */}
 return Response.json({deleted:true},{headers:{'Cache-Control':'private, no-store'}});
})}
