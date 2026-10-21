import 'server-only';
import {z} from 'zod';
export function bankConfig(){
 if(process.env.PLAID_ENABLED!=='true')throw Error('Bank sync is disabled.');
 const env=z.enum(['sandbox','production']).parse(process.env.PLAID_ENV??'sandbox');
 if(env==='production'&&process.env.PLAID_TRIAL_CONFIRMED!=='true')throw Error('Confirm the free Plaid Trial plan before enabling real data.');
 const clientId=z.string().min(10).max(200).parse(process.env.PLAID_CLIENT_ID),secret=z.string().min(10).max(300).parse(process.env.PLAID_SECRET);
 if(!/^[a-fA-F0-9]{64}$/.test(process.env.PLUTO_CONNECTOR_ENCRYPTION_KEY??''))throw Error('Connector encryption is not configured.');
 const redirect=new URL(process.env.PLAID_REDIRECT_URI??'');
 if(redirect.username||redirect.password||redirect.search||redirect.hash||redirect.pathname!=='/bank-link'||(redirect.protocol!=='https:'&&!(env==='sandbox'&&redirect.protocol==='http:'&&['localhost','127.0.0.1'].includes(redirect.hostname))))throw Error('Configure the approved bank-link redirect URL.');
 return {env,clientId,secret,redirectUri:redirect.href,base:env==='production'?'https://production.plaid.com':'https://sandbox.plaid.com'};
}
export function bankAvailability(){try{const config=bankConfig();return {ready:true,environment:config.env}}catch{return {ready:false,environment:process.env.PLAID_ENV==='production'?'production':'sandbox'}}}
