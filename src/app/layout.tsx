import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "JARVIS · Personal Operating System", description: "Your private personal command center.", robots: { index: false, follow: false } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className="dark"><body>{children}</body></html>;
}
