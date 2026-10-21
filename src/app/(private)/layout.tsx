import {AppearanceProvider} from '@/features/settings/appearance-provider';
import {readSettings} from '@/features/settings/repository';
import { requireCustomer } from "@/features/auth/server";
export const dynamic = "force-dynamic";
export default async function PrivateLayout({ children }: { children: React.ReactNode }) {
  await requireCustomer();
  const settings=await readSettings();
  return <AppearanceProvider initial={settings?{clockFormat:settings.clockFormat as '12h'|'24h',primaryColor:settings.primaryColor,secondaryColor:settings.secondaryColor,tertiaryColor:settings.tertiaryColor,wordmarkStyle:settings.wordmarkStyle as import('@/features/settings/appearance').Palette['wordmarkStyle'],background:settings.background as 'current'|'black'|'white'}:undefined}>{children}</AppearanceProvider>;
}
