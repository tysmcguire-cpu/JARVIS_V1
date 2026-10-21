'use server';
import {administratorMetrics} from './server';
export async function loadAdminMetrics(input:unknown){return administratorMetrics(input)}
