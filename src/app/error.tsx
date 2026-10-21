'use client';
import Link from 'next/link';
export default function ErrorPage({reset}:{reset:()=>void}){return <section className="state-screen" role="alert"><h1>This view is unavailable</h1><p>Try again, or sign in again if your session expired. Your saved records have not been replaced.</p><button onClick={reset}>Try again</button><Link href="/login">Return to sign in</Link></section>}
