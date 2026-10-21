// Bound each application process's pool. Extra roles must not exhaust a small
// Supabase project merely because Prisma detects a large host CPU count.
export function runtimeDatabaseUrl(input:string,maximum=2){const url=new URL(input);const requested=Number(url.searchParams.get('connection_limit')??maximum);url.searchParams.set('connection_limit',String(Number.isInteger(requested)&&requested>0?Math.min(requested,maximum):maximum));url.searchParams.set('pool_timeout','10');return url.toString()}
