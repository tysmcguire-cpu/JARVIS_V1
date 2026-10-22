import 'server-only';
type InstallationQuery={$queryRawUnsafe:<T=unknown>(query:string,...values:unknown[])=>Promise<T>};
export async function assertInstallation(tx:InstallationQuery){const ref=process.env.PLUTO_SUPABASE_PROJECT_REF;if(ref)await tx.$queryRawUnsafe('SELECT public.pluto_assert_installation($1)::text',ref)}
