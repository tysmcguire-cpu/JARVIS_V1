import { requireOwner } from "@/features/auth/server";
export const dynamic = "force-dynamic";
export default async function PrivateLayout({ children }: { children: React.ReactNode }) {
  await requireOwner();
  return children;
}
