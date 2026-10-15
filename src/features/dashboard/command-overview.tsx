import Link from "next/link";
import { ArrowUpRight, Database, Fingerprint, Network, ScanLine } from "lucide-react";
import { CommandCore } from "@/components/ui/command-core";

export function CommandOverview({ demo }: { demo: boolean }) {
  const href = (slug: string) => demo ? `/demo/${slug}` : `/${slug}`;
  return <section className="command-overview" aria-label="Command interface">
    <div className="interface-readout">
      <p className="instrument-label"><ScanLine size={14} /> WORKSPACE PROTOCOL</p>
      <div className="protocol-item"><Fingerprint size={19} /><div><span>ACCESS CONTROL</span><strong>{demo ? "Synthetic preview" : "Owner verified"}</strong></div><i /></div>
      <div className="protocol-item"><Database size={19} /><div><span>DATA SOURCE</span><strong>{demo ? "Demonstration data" : "Private workspace"}</strong></div><i /></div>
      <div className="protocol-item protocol-inactive"><Network size={19} /><div><span>DOMAIN INTEGRATIONS</span><strong>Not connected</strong></div><span className="protocol-dash">—</span></div>
      <p className="protocol-footnote">{demo ? "All example records are synthetic." : "Your information. Your authorization."}</p>
    </div>
    <div className="core-stage"><CommandCore /><div className="core-stage-baseline"><span /> WORKSPACE INTERFACE <span /></div></div>
    <div className="directory-readout"><p className="instrument-label">WORKSPACE DIRECTORY</p>
      {[{ slug: "finances", code: "01", title: "Finances", description: "Accounts & spending" }, { slug: "education", code: "02", title: "Education", description: "Courses & deadlines" }, { slug: "projects", code: "03", title: "Projects", description: "Ideas & milestones" }, { slug: "goals", code: "04", title: "Goals", description: "Progress & habits" }].map(item => <Link className="directory-item" href={href(item.slug)} key={item.slug}><span className="directory-code">{item.code}</span><div><strong>{item.title}</strong><span>{item.description}</span></div><ArrowUpRight size={14} /></Link>)}
      <span className="directory-phase">CORE TRACKING · PLANNED PHASE 2</span>
    </div>
  </section>;
}
