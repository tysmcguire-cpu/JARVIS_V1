import {stripeClient} from '@/features/billing/stripe';
import {applyStripeEvent} from '@/features/billing/service';
export async function POST(request:Request){
 if(!process.env.STRIPE_WEBHOOK_SECRET)return Response.json({error:'Billing not configured'},{status:503});
 const length=Number(request.headers.get('content-length')??0);if(length>262144)return new Response(null,{status:413});
 const raw=await request.text();if(Buffer.byteLength(raw)>262144)return new Response(null,{status:413});
 let event;let stripe;
 try{stripe=stripeClient();event=stripe.webhooks.constructEvent(raw,request.headers.get('stripe-signature')??'',process.env.STRIPE_WEBHOOK_SECRET,300);if(event.livemode!==((process.env.PLUTO_BILLING_MODE??'test')==='live'))throw Error()}catch{return Response.json({error:'Webhook rejected'},{status:400})}
 try{await applyStripeEvent(event,stripe);return Response.json({received:true})}catch{return Response.json({error:'Billing update unavailable'},{status:503})}
}
