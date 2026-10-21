import Link from 'next/link';
import {signIn} from '@/features/auth/actions';
import {getAuthConfig} from '@/lib/env';
import {features} from '@/features/commercial/flags';
import {product} from '@/features/commercial/product';
export const dynamic='force-dynamic';
export default async function Login({searchParams}:{searchParams:Promise<{status?:string;next?:string}>}){
 const params=await searchParams,status=params.status;
 return <main className="login-screen"><section className="login-card"><div className="login-brand">{product.name}</div><h1>Welcome back</h1>{getAuthConfig()?<form action={signIn} className="login-form"><input type="hidden" name="next" value={params.next==='admin'?'admin':'workspace'}/><label>Email<input name="email" type="email" autoComplete="username" maxLength={254} required/></label><label>Password<input name="password" type="password" autoComplete="current-password" maxLength={128} required/></label><button type="submit">Sign in</button></form>:<p role="status">Commercial authentication is not configured. Access is locked.</p>}{status&&<p role="status">{status==='verify-email'?'Check your email to verify your account.':status==='password-reset'?'Password updated. Sign in again.':'Unable to sign in. Check your credentials and email verification.'}</p>}<Link href="/forgot-password">Forgot password?</Link>{features.registration()&&<Link href="/register">Create an account</Link>}</section></main>;
}
