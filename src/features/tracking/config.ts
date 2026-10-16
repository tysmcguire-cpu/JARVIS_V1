import definitions from './entities.json';
export type Field = { name: string; label: string; type: string; target?: string; options?: string[]; max?: number };
export type Entity = { key: string; module: string; label: string; fields: Field[] };
export const entities: Entity[] = definitions;
export const trackingModules = ['finances', 'education', 'calendar', 'career', 'projects', 'goals', 'notes'];
export function entityFor(key: string) { const entity = entities.find(e => e.key === key); if (!entity) throw new Error('Unknown record type.'); return entity; }
export type RecordRow = { id: string; updatedAt: string; [key: string]: string };
export type WorkspaceData = { rows: RecordRow[]; total: number; page: number; pageSize: number; options: Record<string, {id: string; title: string}[]>; relationsTruncated: boolean; summary: {label: string; value: string}[]; chart: {label: string; value: number}[]; calendar: {date: string; title: string}[] };
export const currencies = ['USD', 'CAD', 'EUR', 'GBP'];
export function parseMoney(input: string): bigint {
  if (!/^-?\d{1,12}(\.\d{1,2})?$/.test(input)) throw new Error('Use a monetary amount with at most two decimal places.');
  const negative = input.startsWith('-'); const [whole, fraction = ''] = input.replace(/^-/, '').split('.');
  const result = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
  return negative ? -result : result;
}
export function moneyInput(minor: string): string { const n = BigInt(minor); const abs = n < 0n ? -n : n; return `${n < 0n ? '-' : ''}${abs / 100n}.${String(abs % 100n).padStart(2, '0')}`; }
export function formatMoney(minor: bigint, currency: string) { return `${currency} ${moneyInput(minor.toString())}`; }
