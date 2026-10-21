import {voiceTurn} from '@/features/intelligence/voice';
import {matchesRequestOrigin} from '@/lib/request-origin';
import {requireCustomer} from '@/features/auth/server';
export const runtime='nodejs';export const dynamic='force-dynamic';
const reply=(data:unknown,status:number)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store','Vary':'Cookie'}});
export async function POST(request:Request){if(!matchesRequestOrigin(request))return reply({error:'origin_rejected'},403);if(request.headers.get('content-type')!=='audio/wav')return reply({error:'unsupported_audio'},415);await requireCustomer();const reader=request.body?.getReader();if(!reader)return reply({error:'audio_required'},400);let bytes=0;const chunks:Uint8Array[]=[];try{while(true){const part=await reader.read();if(part.done)break;bytes+=part.value.length;if(bytes>960044){await reader.cancel();return reply({error:'audio_too_large'},413)}chunks.push(part.value)}return reply(await voiceTurn(request.headers.get('x-pluto-voice-session'),request.headers.get('x-pluto-request-id'),Buffer.concat(chunks),fetch,request.signal),200)}catch{return reply({error:'voice_unavailable'},400)}}
