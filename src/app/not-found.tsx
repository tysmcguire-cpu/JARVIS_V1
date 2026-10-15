import Link from "next/link";
export default function NotFound() { return <main className="state-screen"><h1>Page not available</h1><p>This page does not exist or is not enabled.</p><Link href="/login">Return to sign in</Link></main>; }
