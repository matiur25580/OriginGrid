import { Activity, ArrowUpRight, Boxes, Factory, Fingerprint, ShieldCheck, Truck } from "lucide-react";

const metrics = [
  { label: "Registered products", value: "—", note: "Connect your product registry", icon: Boxes },
  { label: "Verified suppliers", value: "—", note: "Supplier verification pending", icon: ShieldCheck },
  { label: "Active batches", value: "—", note: "Manufacturing data not connected", icon: Factory },
  { label: "Traceability events", value: "—", note: "Event ledger not configured", icon: Activity }
];

const steps = [
  { title: "Register a product", description: "Create a product identity and define its materials and components.", icon: Fingerprint },
  { title: "Connect your suppliers", description: "Build a trusted supplier network and collect supporting evidence.", icon: Factory },
  { title: "Capture lifecycle events", description: "Record manufacturing, inspection, shipment, and custody milestones.", icon: Truck }
];

export default function App() {
  return (
    <main className="shell">
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="OriginGrid home">
          <span className="brand-mark"><Fingerprint size={22} /></span>
          <span>Origin<span className="brand-accent">Grid</span><small>PROVENANCE CLOUD</small></span>
        </a>
        <div className="workspace-label">WORKSPACE</div>
        <div className="workspace"><span className="workspace-dot" /> Demo organization <span className="chevron">⌄</span></div>
        <nav aria-label="Main navigation">
          <a className="nav-item active" href="#overview">Overview</a>
          <a className="nav-item" href="#products">Products <span>01</span></a>
          <a className="nav-item" href="#suppliers">Suppliers</a>
          <a className="nav-item" href="#traceability">Traceability</a>
          <a className="nav-item" href="#passports">Digital passports</a>
          <a className="nav-item" href="#compliance">Compliance</a>
          <a className="nav-item" href="#analytics">Analytics</a>
        </nav>
        <div className="sidebar-footer"><span className="status-dot" /> Foundation environment <small>Milestone 1 · Development</small></div>
      </aside>

      <section className="main-panel" id="overview">
        <header className="topbar">
          <div><span className="eyebrow">ENTERPRISE CONTROL TOWER</span><h1>Overview</h1></div>
          <div className="user-chip"><span className="avatar">OG</span><span>Workspace admin<small>Demo environment</small></span></div>
        </header>

        <section className="welcome">
          <div>
            <span className="eyebrow light">PRODUCT TRANSPARENCY, BUILT ON EVIDENCE</span>
            <h2>Every product has a story.<br /><em>Every story has proof.</em></h2>
            <p>Establish product identity, connect your supply chain, and build an evidence-backed lifecycle record.</p>
            <a className="welcome-link" href="#getting-started">Explore the foundation <ArrowUpRight size={16} /></a>
          </div>
          <div className="orb" aria-hidden="true"><div className="orb-core"><Fingerprint size={58} /></div><span className="orb-ring ring-one" /><span className="orb-ring ring-two" /></div>
        </section>

        <div className="section-heading"><div><span className="eyebrow">WORKSPACE SNAPSHOT</span><h2>Operational overview</h2></div><span className="muted-pill">Awaiting connected data</span></div>
        <section className="metrics">
          {metrics.map(({ label, value, note, icon: Icon }) => (
            <article className="metric-card" key={label}>
              <div className="metric-top"><span>{label}</span><Icon size={18} /></div>
              <strong>{value}</strong><small>{note}</small>
            </article>
          ))}
        </section>

        <section className="getting-started" id="getting-started">
          <div className="section-heading"><div><span className="eyebrow">YOUR FIRST WORKFLOW</span><h2>Build your provenance foundation</h2></div><span className="step-count">0 of 3 complete</span></div>
          <div className="steps">
            {steps.map(({ title, description, icon: Icon }, index) => (
              <article className="step-card" key={title}>
                <div className="step-icon"><Icon size={20} /></div><span className="step-number">STEP 0{index + 1}</span>
                <h3>{title}</h3><p>{description}</p><span className="coming-soon">Available in upcoming milestones</span>
              </article>
            ))}
          </div>
        </section>
        <footer>OriginGrid · Enterprise Product Provenance <span>Foundation preview · Not connected to live business data</span></footer>
      </section>
    </main>
  );
}
