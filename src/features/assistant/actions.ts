'use server';
import {requireCustomer} from '@/features/auth/server';
import {ask,history,detail,removeConversation} from './repository';
export async function askAssistant(input:unknown){await requireCustomer();return ask(input)}
export async function assistantHistory(page:unknown=1){await requireCustomer();return history(page)}
export async function assistantDetail(id:unknown){await requireCustomer();return detail(id)}
export async function deleteAssistantConversation(id:unknown){await requireCustomer();return removeConversation(id)}
