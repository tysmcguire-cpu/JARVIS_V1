import type { Metadata } from "next";
import "./globals.css";
import "./command-theme.css";
import "./orbital-dashboard.css";
import "./desktop-workspace.css";
import "./tracking.css";
import "./module-workspaces.css";
import "./integrations.css";
import "./assistant.css";
import "./notifications.css";
export const metadata: Metadata = { title: "JARVIS · Personal Operating System", description: "Your private personal command center.", robots: { index: false, follow: false } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className="dark"><body>{children}<div className="desktop-size-notice"><span>JARVIS / DESKTOP WORKSPACE</span><h1>A little more room.</h1><p>Open JARVIS in a desktop window at least 1024 pixels wide and 600 pixels tall.</p><p>The interface is designed to fit on one screen.</p></div></body></html>;
}
