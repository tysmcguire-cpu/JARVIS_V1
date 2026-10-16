'use server';
import {withOwnerRequest} from '@/features/auth/server';
import {notificationState,saveNotificationPreferences,refreshNotifications,updateNotification} from './repository';
export async function loadNotifications(page:unknown=1){return withOwnerRequest(()=>notificationState(page))}
export async function saveNotifications(input:unknown){return withOwnerRequest(()=>saveNotificationPreferences(input))}
export async function refreshNotificationInbox(){return withOwnerRequest(()=>refreshNotifications())}
export async function changeNotification(id:unknown,operation:unknown){return withOwnerRequest(()=>updateNotification(id,operation))}
