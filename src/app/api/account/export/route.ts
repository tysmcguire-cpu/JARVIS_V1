import {withCustomerRequest} from '@/features/auth/server';
import {ownerExport} from '@/features/data-controls/repository';
export async function GET(){return withCustomerRequest(async()=>{try{return new Response(await ownerExport(),{headers:{'Content-Type':'application/json','Content-Disposition':'attachment; filename="pluto-data.json"','Cache-Control':'private, no-store','Vary':'Cookie','X-Content-Type-Options':'nosniff'}})}catch{return Response.json({error:'Export unavailable. Check export size/rate limits.'},{status:400,headers:{'Cache-Control':'private, no-store'}})}})}
