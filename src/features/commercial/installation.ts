import 'server-only';
import type {Prisma} from '@prisma/client';
export async function assertInstallation(tx:Pick<Prisma.TransactionClient,'$queryRawUnsafe'>){const ref=process.env.PLUTO_SUPABASE_PROJECT_REF;if(ref)await tx.$queryRawUnsafe('SELECT public.pluto_assert_installation($1)',ref)}
