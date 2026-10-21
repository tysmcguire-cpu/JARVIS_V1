'use server';
import {z} from 'zod';
import {requireCustomer} from '@/features/auth/server';
import {withCustomerDatabase} from '@/lib/customer-db';
import {features} from '@/features/commercial/flags';
import {checkoutForCustomer} from './service';
import {stripeClient,billingSite} from './stripe';
export async function beginCheckout(input:unknown){const customer=await requireCustomer();if(!features.checkout())throw Error('Checkout is disabled during development.');const next=z.object({plan:z.enum(['plus','pro']),cadence:z.enum(['monthly','annual'])}).strict().parse(input);await withCustomerDatabase(async()=>undefined);return {url:await checkoutForCustomer(customer.id,next.plan,next.cadence)}}
export async function openBillingPortal(){await requireCustomer();const customer=await withCustomerDatabase(async(tx,id)=>{const [row]=await tx.$queryRawUnsafe<{stripeCustomerId:string}[]>('SELECT "stripeCustomerId" FROM "BillingCustomer" WHERE "userId"=$1::uuid',id);return row});if(!customer)throw Error('No billing account is connected.');return {url:(await stripeClient().billingPortal.sessions.create({customer:customer.stripeCustomerId,return_url:billingSite()+'/settings'})).url}}
export async function billingStatus(){return withCustomerDatabase(async(tx,id)=>{
 const [subscription]=await tx.$queryRawUnsafe<{plan:string;status:string;periodEnd:Date;cancelAtPeriodEnd:boolean;syncedAt:Date}[]>('SELECT plan,status,"periodEnd","cancelAtPeriodEnd","syncedAt" FROM "Subscription" WHERE "userId"=$1::uuid',id);
 const catalog=await tx.$queryRawUnsafe<{id:string;monthlyPriceMinor:number;messages:number;voiceSeconds:number;researchCalls:number}[]>('SELECT id,"monthlyPriceMinor",messages,"voiceSeconds","researchCalls" FROM "PlanCatalog" WHERE enabled=true ORDER BY "monthlyPriceMinor"');
 const [usage]=await tx.$queryRawUnsafe<{messages:string;tokens:string;voice:string;research:string}[]>('SELECT count(*) FILTER(WHERE kind=\'chat\')::text AS messages,COALESCE(sum(COALESCE("tokensActual","tokensReserved")),0)::text AS tokens,COALESCE(sum(COALESCE("voiceActualSeconds","voiceReservedSeconds")),0)::text AS voice,COALESCE(sum(COALESCE("researchActualCalls","researchReservedCalls")),0)::text AS research FROM "UsageReservation" WHERE "userId"=$1::uuid AND "periodStart"=date_trunc(\'month\',now())::date',id);
 const effective=subscription?.status==='active'&&subscription.periodEnd>new Date()&&subscription.syncedAt>new Date(Date.now()-86400000)?subscription.plan:'free';
 return {plan:effective,subscription:subscription?{...subscription,periodEnd:subscription.periodEnd.toISOString(),syncedAt:subscription.syncedAt.toISOString()}:null,catalog,usage,checkoutEnabled:features.checkout()};
})}
