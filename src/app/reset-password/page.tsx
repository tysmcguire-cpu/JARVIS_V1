export const dynamic='force-dynamic';
import {resetPassword} from '@/features/auth/actions';
import {requireIdentity} from '@/features/auth/server';
export default async function Reset(){await requireIdentity();return <main className="login-screen"><section className="login-card"><h1>Choose a new password</h1><form action={resetPassword} className="login-form"><label>New password<input type="password" name="password" autoComplete="new-password" minLength={12} maxLength={128} required/></label><button>Save password</button></form></section></main>}
