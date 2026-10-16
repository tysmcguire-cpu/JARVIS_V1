import {requireIdentity} from '@/features/auth/server';
import {MfaPanel} from '@/features/auth/mfa-panel';
export const dynamic='force-dynamic';
export default async function MfaPage(){const owner=await requireIdentity();return <main className="login-screen"><MfaPanel factors={(owner.factors??[]).filter(f=>f.factor_type==='totp').map(f=>({id:f.id,name:f.friendly_name??'Authenticator',verified:f.status==='verified'}))}/></main>}
