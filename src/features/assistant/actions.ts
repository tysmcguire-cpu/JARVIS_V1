'use server';
import {requireOwner} from '@/features/auth/server';
import {ask,history,detail,removeConversation} from './repository';
export async function askAssistant(input:unknown){await requireOwner();return ask(input)}
export async function assistantHistory(page:unknown=1){await requireOwner();return history(page)}
export async function assistantDetail(id:unknown){await requireOwner();return detail(id)}
export async function deleteAssistantConversation(id:unknown){await requireOwner();return removeConversation(id)}
