'use server';
import {withCustomerRequest} from '@/features/auth/server';
import {notificationState,saveNotificationPreferences,refreshNotifications,updateNotification} from './repository';
export async function loadNotifications(page:unknown=1){return withCustomerRequest(()=>notificationState(page))}
export async function saveNotifications(input:unknown){return withCustomerRequest(()=>saveNotificationPreferences(input))}
export async function refreshNotificationInbox(){return withCustomerRequest(()=>refreshNotifications())}
export async function changeNotification(id:unknown,operation:unknown){return withCustomerRequest(()=>updateNotification(id,operation))}
