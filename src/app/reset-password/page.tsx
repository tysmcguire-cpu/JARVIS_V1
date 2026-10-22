export const dynamic='force-dynamic';
import {resetPassword,finishPasswordReset} from '@/features/auth/actions';
import {requireCustomer} from '@/features/auth/server';
export default async function Reset({searchParams}:{searchParams:Promise<{status?:string}>}){
 await requireCustomer('reset-password');const status=(await searchParams).status;
 return <main className="login-screen"><section className="login-card"><h1>{status==='signout-failed'?'Finish securing your account':'Choose a new password'}</h1>
 {status==='signout-failed'?<><p role="alert">Your password was updated, but we could not sign out your other sessions. Retry signing out before continuing.</p><form action={finishPasswordReset} className="login-form"><button>Sign out all sessions</button></form></>:<>
 {status==='invalid'&&<p role="alert">Could not update your password. Use 12–128 characters and try again. If your recovery link expired, request a new one.</p>}
 <form action={resetPassword} className="login-form"><label>New password<input type="password" name="password" autoComplete="new-password" minLength={12} maxLength={128} required/></label><button>Save password</button></form></>}
 </section></main>;
}
