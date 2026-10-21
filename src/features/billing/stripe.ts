import {z} from 'zod';
import 'server-only';
import Stripe from 'stripe';
export function stripeClient(){const mode=z.enum(['test','live']).parse(process.env.PLUTO_BILLING_MODE??'test'),key=process.env.STRIPE_SECRET_KEY;if(mode==='live'&&process.env.PLUTO_BILLING_LIVE_APPROVED!=='true')throw Error('Live billing has not been approved.');if(!key||(mode==='test'?!(/^(sk|rk)_test_/).test(key):!(/^(sk|rk)_live_/).test(key)))throw Error('Stripe mode/key is not configured.');return new Stripe(key,{maxNetworkRetries:1,timeout:8000})}
export function billingSite(){const url=new URL(process.env.PLUTO_SITE_URL??'');if(url.protocol!=='https:'&&!(process.env.NODE_ENV!=='production'&&url.protocol==='http:'&&['localhost','127.0.0.1'].includes(url.hostname)))throw Error('Secure commercial site URL required.');return url.origin}
