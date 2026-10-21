export const planNames=['free','plus','pro','ultimate'] as const;
export type Plan=typeof planNames[number];
export const plans={free:{name:'Free',monthlyMinor:0,messages:15,voiceMinutes:0},plus:{name:'Plus',monthlyMinor:999,messages:250,voiceMinutes:15},pro:{name:'Pro',monthlyMinor:1999,messages:1000,voiceMinutes:90},ultimate:{name:'Ultimate',monthlyMinor:3999,messages:2500,voiceMinutes:180}} as const;
