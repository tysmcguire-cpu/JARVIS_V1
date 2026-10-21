'use server';
import {requireCustomer} from '@/features/auth/server';
import {sendMessage,threadList,threadTurns,removeThread} from './chat';
import {research} from './research';
import {reports,reportDetail} from './reports';
import {readAiPreferences,writeAiPreferences} from './preferences';
export async function sendChat(input:unknown){await requireCustomer();return sendMessage(input)}
export async function chatThreads(page:unknown=1){await requireCustomer();return threadList(page)}
export async function chatTurns(thread:unknown,page:unknown=1){await requireCustomer();return threadTurns(thread,page)}
export async function deleteChat(thread:unknown){await requireCustomer();return removeThread(thread)}
export async function aiSettings(){await requireCustomer();return readAiPreferences()}
export async function saveAiSettings(input:unknown,version:unknown){await requireCustomer();return writeAiPreferences(input,version)}

export async function runResearch(input:unknown){await requireCustomer();return research(input)}
export async function weeklyReports(page:unknown=1){await requireCustomer();return reports(page)}
export async function weeklyReport(id:unknown){await requireCustomer();return reportDetail(id)}
