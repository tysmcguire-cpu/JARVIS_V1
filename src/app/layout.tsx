import {product} from '@/features/commercial/product';
import type { Metadata } from "next";
import "./globals.css";
import "./intelligence.css";
import "./admin.css";
import "./command-theme.css";
import "./orbital-dashboard.css";
import "./desktop-workspace.css";
import "./tracking.css";
import "./module-workspaces.css";
import "./integrations.css";
import "./assistant.css";
import "./notifications.css";
import "./finance-workspace.css";
import "./simple-interface.css";
import "./readability.css";
import "./detail-palette.css";
import "./appearance.css";
import "./notes-editor.css";
import "./module-polish.css";
import "./module-rail.css";
import "./grade-calculator.css";
import "./module-scrolling.css";
import "./commercial-responsive.css";
export const metadata: Metadata = { title: product.name+" · Personal Operating System", description: "Your private personal command center.", robots: { index: false, follow: false } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className="dark"><body>{children}</body></html>;
}
