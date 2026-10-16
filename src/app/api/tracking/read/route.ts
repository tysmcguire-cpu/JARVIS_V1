import {NextResponse} from 'next/server';
import {withOwnerRequest} from '@/features/auth/server';
import {readWorkspace} from '@/features/tracking/repository';
import {z} from 'zod';
const headers={'Cache-Control':'private, no-store','Vary':'Cookie'};
export async function POST(request:Request){
 return withOwnerRequest(async()=>{
  if(request.headers.get('origin')!==new URL(request.url).origin)return NextResponse.json({error:'Origin rejected'},{status:403,headers});
  const text=await request.text();if(text.length>8192)return NextResponse.json({error:'Request too large'},{status:413,headers});
  try{const {key,query}=z.object({key:z.string().max(40),query:z.unknown()}).strict().parse(JSON.parse(text));return NextResponse.json(await readWorkspace(key,query),{headers});}
  catch{return NextResponse.json({error:'Could not load records'},{status:400,headers});}
 });
}
