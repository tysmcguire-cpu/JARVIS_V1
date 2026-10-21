export type HubRow={key:string;module:string;id:string;title:string;date:string;status:string;updated:string};
export type HubData={today:string;timezone:string;groups:Record<string,{total:number;rows:HubRow[]}>;spending:{currency:string;amount:string}[];unread:number;notifications?:{id:string;title:string}[];asOf:string};
export function recordHref(row:Pick<HubRow,'module'|'key'|'id'>,demo=false){return `${demo?'/demo':''}/${row.module}?type=${encodeURIComponent(row.key)}&record=${encodeURIComponent(row.id)}`}
