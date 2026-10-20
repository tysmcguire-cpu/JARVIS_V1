import {AppearanceProvider} from '@/features/settings/appearance-provider';
import {readSettings} from '@/features/settings/repository';
import { requireOwner } from "@/features/auth/server";
export const dynamic = "force-dynamic";
export default async function PrivateLayout({ children }: { children: React.ReactNode }) {
  await requireOwner();
  const settings=await readSettings();
  return <AppearanceProvider initial={settings?{primaryColor:settings.primaryColor,secondaryColor:settings.secondaryColor,tertiaryColor:settings.tertiaryColor,wordmarkStyle:settings.wordmarkStyle as import('@/features/settings/appearance').Palette['wordmarkStyle'],background:settings.background as 'current'|'black'|'white'}:undefined}>{children}</AppearanceProvider>;
}
