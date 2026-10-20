import {useState} from 'react';
import {formatMoney,type WorkspaceData} from './config';
export function FinanceBudgets({data,choose}:{data:WorkspaceData;choose:(key:string)=>void}){
 const [page,setPage]=useState(0),g=data.general;if(!g)return null;
 const index=Math.min(page,Math.max(0,g.budgets.length-1)),budget=g.budgets[index],money=(n:string)=>formatMoney(BigInt(n),data.finance?.currency??'USD');
 return <section className="overview-budgets" aria-label="Overview budgets"><header><h2>Budgets</h2><button onClick={()=>choose('Budget')}>View all ({g.budgetTotal})</button></header>{budget?<><div className="overview-budget-line"><strong title={budget.title}>{budget.title}</strong><span>{budget.limitCount?money(budget.spent)+' / '+money(budget.limit):'No category limits set'}</span></div><div className="overview-budget-footer"><small>{budget.startDate} → {budget.endDate}</small><div><button aria-label="Previous budget" disabled={index===0} onClick={()=>setPage(index-1)}>‹</button><span>{index+1} / {g.budgets.length}</span><button aria-label="Next budget" disabled={index+1>=g.budgets.length} onClick={()=>setPage(index+1)}>›</button></div></div></>:<p>No budgets for this month.</p>}</section>;
}
