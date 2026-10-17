'use server';
import {requireOwner} from '@/features/auth/server';
import {withOwnerDatabase} from '@/lib/owner-db';
import {bankState,bankHistory} from './repository';
import {startBankLink,resumeBankLink,completeBankLink,syncBank,disconnectBank} from './service';
export async function loadBankState(){await requireOwner();return bankState()}
export async function loadBankHistory(input:unknown){await requireOwner();return bankHistory(input)}
const unavailable={ok:false as const,message:'Bank operation unavailable. Check the Plaid setup, connection status and retry delay. Credentials and provider details are suppressed.'};
export async function beginBankLink(input:unknown){await requireOwner();try{return {ok:true as const,...await startBankLink(withOwnerDatabase,input)}}catch{return unavailable}}
export async function resumeBankSession(id:string){await requireOwner();try{return {ok:true as const,...await resumeBankLink(withOwnerDatabase,id)}}catch{return unavailable}}
export async function finishBankLink(input:unknown){await requireOwner();try{return {ok:true as const,...await completeBankLink(withOwnerDatabase,input)}}catch{return unavailable}}
export async function synchronizeBank(){await requireOwner();try{return {ok:true as const,...await syncBank(withOwnerDatabase)}}catch{return unavailable}}
export async function revokeBank(confirmed:boolean){await requireOwner();try{return {ok:true as const,...await disconnectBank(withOwnerDatabase,confirmed)}}catch{return unavailable}}
