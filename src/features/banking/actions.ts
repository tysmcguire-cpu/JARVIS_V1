'use server';
import {requireCustomer} from '@/features/auth/server';
import {withCustomerDatabase} from '@/lib/customer-db';
import {bankState,bankHistory} from './repository';
import {startBankLink,resumeBankLink,completeBankLink,syncBank,disconnectBank} from './service';
export async function loadBankState(){await requireCustomer();return bankState()}
export async function loadBankHistory(input:unknown){await requireCustomer();return bankHistory(input)}
const unavailable={ok:false as const,message:'Bank operation unavailable. Check the Plaid setup, connection status and retry delay. Credentials and provider details are suppressed.'};
export async function beginBankLink(input:unknown){await requireCustomer();try{return {ok:true as const,...await startBankLink(withCustomerDatabase,input)}}catch{return unavailable}}
export async function resumeBankSession(id:string){await requireCustomer();try{return {ok:true as const,...await resumeBankLink(withCustomerDatabase,id)}}catch{return unavailable}}
export async function finishBankLink(input:unknown){await requireCustomer();try{return {ok:true as const,...await completeBankLink(withCustomerDatabase,input)}}catch{return unavailable}}
export async function synchronizeBank(){await requireCustomer();try{return {ok:true as const,...await syncBank(withCustomerDatabase)}}catch{return unavailable}}
export async function revokeBank(confirmed:boolean){await requireCustomer();try{return {ok:true as const,...await disconnectBank(withCustomerDatabase,confirmed)}}catch{return unavailable}}
