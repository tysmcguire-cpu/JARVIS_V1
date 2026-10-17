import Link from 'next/link';
import {requireOwner} from '@/features/auth/server';
import {BankLink} from '@/features/banking/link-panel';
export default async function BankReturn(){await requireOwner();return <main className="tracking-dialog" style={{position:'relative',margin:'60px auto',display:'block'}}><h1>Chase connection</h1><BankLink resume/><p><Link href="/finances">Open Finances</Link></p></main>}
