'use client';
import {formatMoney,type WorkspaceData} from './config';
export function FinanceGeneral({data,choose}:{data:WorkspaceData;choose:(key:string)=>void}){
 const g=data.general,f=data.finance;if(!g||!f)return <p>Loading overview…</p>;const money=(n:string)=>formatMoney(BigInt(n),f.currency);
 return <div className="finance-general">
 <section className="general-accounts" aria-label="General accounts"><header><h2>Accounts</h2><button onClick={()=>choose('FinancialAccount')}>View all ({g.accountTotal})</button></header><div className="general-account-list">{g.accounts.map(a=><article key={a.id}><span title={a.title}>{a.title}</span><strong>{money(a.balance)}</strong></article>)}{!g.accounts.length&&<p>No accounts yet.</p>}</div></section>
 <section className="general-transactions" aria-label="General transactions"><header><h2>Transactions</h2><button onClick={()=>choose('Transaction')}>View all ({data.total})</button></header><ul>{data.rows.map(r=><li key={r.id}><time>{r.date}</time><div><strong title={r.title}>{r.title}</strong><small>{data.options.Category?.find(c=>c.id===r.categoryId)?.title??'Uncategorized'}</small></div><span data-kind={r.categoryKind}>{r.categoryKind==='income'?'+':'−'}{money(r.amount)}</span></li>)}</ul>{!data.rows.length&&<p>No transactions for this month.</p>}</section>
 <section className="general-budgets" aria-label="General budgets"><header><h2>Budgets</h2><button onClick={()=>choose('Budget')}>View all ({g.budgetTotal})</button></header><ul>{g.budgets.map(b=><li key={b.id}><strong title={b.title}>{b.title}</strong><small>{b.startDate} → {b.endDate}</small>{b.limitCount?<><span>Spent {money(b.spent)} / {money(b.limit)}</span><small>{BigInt(b.spent)>BigInt(b.limit)?'Over budget':money((BigInt(b.limit)-BigInt(b.spent)).toString())+' remaining'}</small></>:<span>No category limits set</span>}</li>)}</ul>{!g.budgets.length&&<p>No budgets for this month.</p>}</section>
 </div>;
}
