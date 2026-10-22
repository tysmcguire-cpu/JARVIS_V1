import 'server-only';
import {isIP} from 'node:net';
import {z} from 'zod';
import {withCustomerDatabase} from '@/lib/customer-db';
import {readBoundedText} from '@/lib/bounded-response';
import {features} from '@/features/commercial/flags';
import {reserveUsage,settleUsage} from '@/features/usage/service';
import {validAnswer,type Answer} from '@/features/assistant/contract';
import {applySelection,callGroundedModel,groundedModelRequest,estimateCost,modelConfig} from './model';
export function safeResearchUrl(value:string){const url=new URL(value),host=url.hostname.replace(/^\[|\]$/g,'');if(url.protocol!=='https:'||url.username||url.password||url.port||!host.includes('.')||isIP(host)||['localhost','local','internal','test','invalid','example'].some(s=>host===s||host.endsWith('.'+s))||value.length>2000)throw Error('Unsafe source URL');return url.toString()}
const inputSchema=z.object({requestId:z.uuid(),query:z.string().trim().min(1).max(300),consent:z.literal(true),freshness:z.enum(['any','week','month'])}).strict();
export async function research(input:unknown,fetcher:typeof fetch=fetch){
 const request=inputSchema.parse(input);if(!features.research()||!process.env.BRAVE_SEARCH_API_KEY)throw Error('Research is disabled or unconfigured.');
 const searchCost=Number(z.string().regex(/^\d{1,9}$/).refine(n=>Number(n)>0).parse(process.env.PLUTO_RESEARCH_CALL_MICROS)),config=modelConfig();
 const cap={tokens:26000,costMicros:searchCost+Math.ceil(estimateCost(23024,1400,config)*1.25),voiceSeconds:0,researchCalls:1},usageId=await reserveUsage('research','research:'+request.requestId,cap);
 try{
  const endpoint=new URL('https://api.search.brave.com/res/v1/web/search');endpoint.searchParams.set('q',request.query);endpoint.searchParams.set('count','5');endpoint.searchParams.set('result_filter','web');endpoint.searchParams.set('text_decorations','false');if(request.freshness!=='any')endpoint.searchParams.set('freshness',request.freshness==='week'?'pw':'pm');
  const response=await fetcher(endpoint,{headers:{'X-Subscription-Token':process.env.BRAVE_SEARCH_API_KEY,Accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(15000)});if(!response.ok)throw Error('Search unavailable.');
  const data=z.object({web:z.object({results:z.array(z.object({title:z.string().max(2000),url:z.string().max(4000),description:z.string().max(8000).optional()}).passthrough()).max(20)}).optional()}).passthrough().parse(JSON.parse(await readBoundedText(response,65536)));
  const urls=(data.web?.results??[]).flatMap(row=>{try{return [{title:row.title.slice(0,160),url:safeResearchUrl(row.url),snippet:(row.description??'').slice(0,800)}]}catch{return []}}).slice(0,5),asOf=new Date().toISOString();
  let answer:Answer=validAnswer({claims:urls.length?urls.map((row,i)=>({kind:'fact' as const,text:'Search excerpt (not independently verified): '+row.snippet,sourceIds:['research-'+i]})):[{kind:'fact',text:'No safe search results were returned.',sourceIds:['research-empty']}],sources:urls.length?urls.map((row,i)=>({id:'research-'+i,label:row.title,href:'/assistant' as const,updatedAt:asOf,fetchedAt:asOf,origin:'aggregate' as const,detail:'Retrieved from search index; publication date is not verified.'})):[{id:'research-empty',label:'Search query',href:'/assistant',updatedAt:asOf,fetchedAt:asOf,origin:'aggregate',detail:'No safe results returned.'}],asOf,engine:'Search index excerpts',limitations:['Public search only; no private workspace records were shared.','Search-index snippets are not independent verification of page contents or publication dates.','One search call, up to five results; source pages are not fetched by Pluto.']});
  let usage={inputTokens:0,outputTokens:0,costMicros:searchCost,voiceSeconds:0,researchCalls:1,model:'brave-search'};
  if(urls.length&&process.env.OPENAI_API_KEY){const prepared=groundedModelRequest(request.query,[],answer,config),result=await callGroundedModel(prepared,config,fetcher);answer=validAnswer(applySelection(answer,result.selection,false));usage={...result.usage,costMicros:result.usage.costMicros+searchCost,researchCalls:1,model:config.model+' + brave-search'}}
  const result={query:request.query,answer,urls:urls.map((row,i)=>({sourceId:'research-'+i,title:row.title,url:row.url})),fetchedAt:asOf};
  await withCustomerDatabase(async(tx,id)=>{await settleUsage(usageId,true,usage,work=>work(tx,id));await tx.$executeRawUnsafe('INSERT INTO "ResearchResult"(id,"userId",query,result)VALUES($1::uuid,$2::uuid,$3,$4::jsonb)',request.requestId,id,request.query,JSON.stringify(result))});return result;
 }catch{try{await settleUsage(usageId,false,{inputTokens:0,outputTokens:0,costMicros:0,voiceSeconds:0,researchCalls:0,model:config.model+' + brave-search'})}catch{}throw Error('Research could not complete. Check configuration and limits.');}
}
