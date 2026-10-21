'use server';
import {startVoice,stopVoice} from './voice';
export async function beginVoice(input:unknown){return startVoice(input)}
export async function endVoice(id:unknown){return stopVoice(id)}
