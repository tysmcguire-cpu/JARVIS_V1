import {getAuthConfig} from '@/lib/env';
import {NextResponse,type NextRequest} from 'next/server';
import {createAuthClient} from '@/lib/supabase/server';
export async function GET(request:NextRequest){
 const code=request.nextUrl.searchParams.get('code'),hash=request.nextUrl.searchParams.get('token_hash'),type=request.nextUrl.searchParams.get('type');
 if(!getAuthConfig())return NextResponse.redirect(new URL('/login?status=configuration',request.url));
 const client=await createAuthClient();let ok=false;
 if(code&&code.length<=2048){const {error}=await client.auth.exchangeCodeForSession(code);ok=!error}
 else if(hash&&hash.length<=2048&&(type==='email'||type==='recovery')){const {error}=await client.auth.verifyOtp({token_hash:hash,type});ok=!error}
 const next=request.nextUrl.searchParams.get('next');return NextResponse.redirect(new URL(ok?(next==='reset-password'?'/reset-password':'/onboarding'):'/login?status=invalid',request.url));
}
