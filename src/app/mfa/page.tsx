import {requireIdentity} from '@/features/auth/server';
import {MfaPanel} from '@/features/auth/mfa-panel';
import {authDestination} from '@/features/auth/destinations';
export const dynamic='force-dynamic';
export default async function MfaPage({searchParams}:{searchParams:Promise<{next?:string}>}){const next=authDestination((await searchParams).next);const owner=await requireIdentity();return <main className="login-screen"><MfaPanel next={next} factors={(owner.factors??[]).filter(f=>f.factor_type==='totp').map(f=>({id:f.id,name:f.friendly_name??'Authenticator',verified:f.status==='verified'}))}/></main>}
