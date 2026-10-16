import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity, ArrowDownRight, ArrowRight, Check, CheckCircle2, ChevronRight,
  CircleDot, Clock3, Cloud, Cpu, Download, ExternalLink, Github, Globe2,
  LayoutGrid, ListChecks, Menu, Plus, Radio, RefreshCw, ScanLine,
  Server, ShieldCheck, Terminal, Trash2, Wifi, WifiOff, X, Zap
} from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from 'recharts';

type Page = 'overview' | 'nodes' | 'sequence' | 'analytics';
type ServiceState = 'online' | 'attention' | 'offline';
type CheckState = 'idle' | 'running' | 'passed' | 'failed';

interface NodeRecord {
  id: string;
  name: string;
  description: string;
  state: ServiceState;
  createdAt: number;
}
interface ScanRecord {
  id: string;
  at: number;
  success: boolean;
  duration: number;
  steps: { name: string; duration: number; passed: boolean; detail: string }[];
}
interface EdgeHealth {
  status: string;
  service: string;
  colo: string | null;
  observedAt: string;
  version: string;
}
type Step = { name: string; detail: string; state: CheckState; duration?: number };

const initialSteps: Step[] = [
  { name: 'EDGE HANDSHAKE', detail: 'Reach the Cloudflare Worker runtime', state: 'idle' },
  { name: 'RUNTIME INTEGRITY', detail: 'Validate the diagnostics response', state: 'idle' },
  { name: 'ASSET DELIVERY', detail: 'Confirm static assets are served', state: 'idle' }
];
const sectionLabels: Record<Page, string> = {
  overview: 'Overview', nodes: 'Node grid', sequence: 'Sequence', analytics: 'Analytics'
};
const statusLabel: Record<ServiceState, string> = {
  online: 'Online', attention: 'Attention', offline: 'Offline'
};
const shortTime = (time: number) => new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
const shortDate = (time: number) => new Date(time).toLocaleDateString([], { month: 'short', day: 'numeric' });
function stored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}
function elapsed(value: number) { return Math.round(value) + ' ms'; }
const iconSize = 18;

export default function App() {
  const [page, setPage] = useState<Page>('overview');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [health, setHealth] = useState<EdgeHealth | null>(null);
  const [edgeError, setEdgeError] = useState('');
  const [latency, setLatency] = useState<number | null>(null);
  const [checking, setChecking] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [steps, setSteps] = useState<Step[]>(initialSteps);
  const [nodes, setNodes] = useState<NodeRecord[]>(() => stored('eclipse:nodes:v2', []));
  const [scans, setScans] = useState<ScanRecord[]>(() => stored('eclipse:scans:v2', []));
  const [newNode, setNewNode] = useState(false);
  const [nodeName, setNodeName] = useState('');
  const [nodeDescription, setNodeDescription] = useState('');
  const [lastChecked, setLastChecked] = useState<number | null>(null);
  const [clock, setClock] = useState(() => new Date());

  useEffect(() => {
    localStorage.setItem('eclipse:nodes:v2', JSON.stringify(nodes));
  }, [nodes]);
  useEffect(() => {
    localStorage.setItem('eclipse:scans:v2', JSON.stringify(scans));
  }, [scans]);
  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const ping = useCallback(async () => {
    setChecking(true);
    const start = performance.now();
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch('/api/health', { cache: 'no-store', signal: controller.signal });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const result = await response.json() as EdgeHealth;
      if (result.status !== 'operational' || result.service !== 'eclipse-os') throw new Error('Unexpected health response');
      setHealth(result);
      setLatency(Math.round(performance.now() - start));
      setEdgeError('');
    } catch (error) {
      setHealth(null);
      setLatency(null);
      setEdgeError(error instanceof Error ? error.message : 'Connection failed');
    } finally {
      window.clearTimeout(timeout);
      setLastChecked(Date.now());
      setChecking(false);
    }
  }, []);

  useEffect(() => { void ping(); }, [ping]);

  const scan = useCallback(async () => {
    if (scanning) return;
    setScanning(true);
    setSteps(initialSteps);
    const definitions: { name: string; path: string; check: (data: unknown, response: Response) => boolean }[] = [
      { name: 'EDGE HANDSHAKE', path: '/api/health', check: (data: unknown) => {
        const result = data as Partial<EdgeHealth>;
        return result.status === 'operational' && result.service === 'eclipse-os';
      }},
      { name: 'RUNTIME INTEGRITY', path: '/api/diagnostics', check: (data: unknown) => {
        const result = data as { checks?: { runtime?: boolean; securityHeaders?: boolean } };
        return result.checks?.runtime === true && result.checks?.securityHeaders === true;
      }},
      { name: 'ASSET DELIVERY', path: '/favicon.svg', check: (_data: unknown, response: Response) =>
        response.ok && (response.headers.get('content-type') || '').includes('image/svg+xml')
      }
    ];
    const outcomes: ScanRecord['steps'] = [];
    const started = performance.now();
    for (let index = 0; index < definitions.length; index++) {
      const definition = definitions[index];
      setSteps(previous => previous.map((step, i) => i === index ? { ...step, state: 'running' } : step));
      const began = performance.now();
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 10000);
      let passed = false;
      let detail = 'Validated';
      try {
        const response = await fetch(definition.path, { cache: 'no-store', signal: controller.signal });
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const data: unknown = index === 2 ? null : await response.json();
        passed = Boolean(definition.check(data, response));
        if (!passed) detail = 'Unexpected response';
      } catch (error) {
        detail = error instanceof Error ? error.message : 'Request failed';
      } finally {
        window.clearTimeout(timeout);
      }
      const duration = Math.round(performance.now() - began);
      outcomes.push({ name: definition.name, duration, passed, detail });
      setSteps(previous => previous.map((step, i) => i === index
        ? { ...step, state: passed ? 'passed' : 'failed', duration, detail } : step));
    }
    const record: ScanRecord = {
      id: crypto.randomUUID(),
      at: Date.now(),
      success: outcomes.every(outcome => outcome.passed),
      duration: Math.round(performance.now() - started),
      steps: outcomes
    };
    setScans(previous => [record, ...previous].slice(0, 60));
    setScanning(false);
    await ping();
  }, [ping, scanning]);

  const addNode = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = nodeName.trim();
    if (!name || name.length > 64) return;
    setNodes(previous => [{
      id: crypto.randomUUID(), name,
      description: nodeDescription.trim().slice(0, 140),
      state: 'online', createdAt: Date.now()
    }, ...previous]);
    setNodeName('');
    setNodeDescription('');
    setNewNode(false);
  };
  const changeNode = (id: string, state: ServiceState) =>
    setNodes(previous => previous.map(node => node.id === id ? { ...node, state } : node));
  const download = () => {
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), scans, nodes }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'eclipse-os-export.json';
    anchor.click();
    URL.revokeObjectURL(url);
  };
  const successCount = scans.filter(record => record.success).length;
  const successRate = scans.length ? Math.round(100 * successCount / scans.length) : null;
  const averageLatency = scans.length ? Math.round(scans.reduce((sum, record) => sum + record.duration, 0) / scans.length) : null;
  const lastScan = scans[0];
  const chart = useMemo(() => scans.slice(0, 18).reverse().map(record => ({
    time: shortTime(record.at), duration: record.duration, passed: record.success
  })), [scans]);
  const connected = Boolean(health);

  const navigation: { id: Page; icon: React.ReactNode; sub: string }[] = [
    { id: 'overview', icon: <Activity size={iconSize} />, sub: '01' },
    { id: 'nodes', icon: <LayoutGrid size={iconSize} />, sub: '02' },
    { id: 'sequence', icon: <ListChecks size={iconSize} />, sub: '03' },
    { id: 'analytics', icon: <Radio size={iconSize} />, sub: '04' }
  ];
  return (
    <div className="app-frame">
      <div className="ambient-light" aria-hidden="true" />
      <aside className={'sidebar ' + (mobileMenu ? 'sidebar-open' : '')}>
        <button className="brand" onClick={() => { setPage('overview'); setMobileMenu(false); }} aria-label="Eclipse OS home">
          <span className="brand-mark"><span /></span>
          <span className="brand-copy"><strong>ECLIPSE<span className="brand-dot">.</span>OS</strong><small>EDGE COMMAND SYSTEM</small></span>
        </button>
        <div className="sidebar-divider" />
        <p className="rail-label">WORKSPACE / 001</p>
        <nav aria-label="Main navigation" className="navigation">
          {navigation.map(item => (
            <button key={item.id} className={'nav-item ' + (page === item.id ? 'nav-active' : '')}
              onClick={() => { setPage(item.id); setMobileMenu(false); }}>
              {item.icon}<span>{sectionLabels[item.id]}</span><small>{item.sub}</small>
            </button>
          ))}
        </nav>
        <div className="sidebar-spacer" />
        <div className="rail-widget">
          <div className="small-icon"><Cloud size={18} /></div>
          <p>CLOUDFLARE EDGE</p>
          <strong>{connected ? 'Runtime connected' : 'Not connected'}</strong>
          <small>{connected ? 'Live Worker API' : 'Deploy to connect the API'}</small>
          <span className={'tiny-status ' + (connected ? 'positive' : 'neutral')} />
        </div>
        <a className="source-link" href="https://github.com/amiddlebrook/eclipse-os" target="_blank" rel="noopener noreferrer">
          <Github size={17} /> Source repository <ExternalLink size={13} />
        </a>
        <div className="rail-bottom">ECLIPSE OS <span>V2.0 / FREE TIER</span></div>
      </aside>
      {mobileMenu && <button className="menu-scrim" aria-label="Close navigation" onClick={() => setMobileMenu(false)} />}
      <main className="workspace">
        <header className="topbar">
          <div className="topbar-left">
            <button className="mobile-toggle icon-button" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Toggle navigation"><Menu size={20}/></button>
            <span className="crumb-muted">OPERATIONS</span><ChevronRight size={14} className="crumb-separator" />
            <span className="crumb-active">{sectionLabels[page].toUpperCase()}</span>
          </div>
          <div className="topbar-right">
            <span className="utc-clock">{clock.toLocaleTimeString('en-GB', { timeZone: 'UTC', hour12: false })} <span>UTC</span></span>
            <span className={'connection-indicator ' + (connected ? 'online' : '')}><span className="status-dot" />{connected ? 'EDGE ONLINE' : 'EDGE OFFLINE'}</span>
            <button onClick={() => void ping()} className="icon-button refresh-top" aria-label="Refresh edge status" title="Refresh edge status" disabled={checking}><RefreshCw className={checking ? 'spin' : ''} size={17}/></button>
          </div>
        </header>
        <div className="page-content">
          {page === 'overview' && <>
            <section className="page-intro">
              <div><p className="eyebrow"><span className="eyebrow-dash" /> OPERATIONS / COMMAND CENTER</p>
                <h1>Control the <em>edge.</em></h1>
                <p className="subheading">One interface for your runtime, nodes, diagnostics and operational history.</p></div>
              <button className="primary-button" onClick={() => { setPage('sequence'); void scan(); }} disabled={scanning}>
                <ScanLine size={17} /> Run diagnostics <ArrowRight size={16} />
              </button>
            </section>
            <div className="hero-grid">
              <div className="panel orbit-panel">
                <div className="panel-overline"><span><CircleDot size={15}/> EDGE TOPOLOGY</span><span className="muted-caption">LIVE CONNECTION</span></div>
                <div className="orbit-stage">
                  <div className="orbit orbit-outer"><span className="orbit-satellite satellite-outer" /></div>
                  <div className="orbit orbit-middle"><span className="orbit-satellite satellite-middle" /></div>
                  <div className="orbit orbit-inner" />
                  <div className="eclipse-core"><span className="eclipse-halo" /><span className="eclipse-disc" /><span className="eclipse-shine" /></div>
                  <div className="orbit-center-caption"><span>NODE / 001</span><strong>CORE</strong></div>
                  <span className="orbit-note note-top">CF EDGE / {health?.colo || '—'}</span>
                  <span className="orbit-note note-bottom">SYSTEM / ECLIPSE</span>
                  <span className="orbit-cross cross-top" /><span className="orbit-cross cross-bottom" />
                </div>
                <div className="orbit-footer"><span><span className={'tiny-status ' + (connected ? 'positive' : 'neutral')}/> {connected ? 'CONNECTED TO EDGE' : 'AWAITING EDGE LINK'}</span><span>CF / WORKERS</span></div>
              </div>
              <div className="right-stack">
                <div className="panel health-panel">
                  <div className="panel-overline"><span><ShieldCheck size={15}/> EDGE STATUS</span><span className="micro-index">01 / SYSTEM</span></div>
                  <div className={'health-icon ' + (connected ? 'health-good' : 'health-bad')}>{connected ? <Wifi size={26}/> : <WifiOff size={26}/>}</div>
                  <div className="health-title">{connected ? 'All systems online' : 'Connection unavailable'}</div>
                  <p className="health-description">{connected ? 'Cloudflare Worker responded successfully. The edge control channel is available.' : 'No live Worker response yet. Deploy to Cloudflare or check connectivity.'}</p>
                  <div className="health-list">
                    <div><span>RUNTIME</span><strong>{connected ? 'Operational' : 'Unknown'}</strong></div>
                    <div><span>COLO</span><strong>{health?.colo || '—'}</strong></div>
                    <div><span>LAST CONTACT</span><strong>{lastChecked ? shortTime(lastChecked) : '—'}</strong></div>
                  </div>
                  {edgeError && <p className="small-error" role="status">{edgeError}</p>}
                </div>
                <div className="panel quick-panel">
                  <div className="quick-icon"><Terminal size={20}/></div>
                  <div><small>QUICK ACTION</small><strong>Sequence runner</strong><span>Execute a three-step diagnostic check</span></div>
                  <button className="quick-arrow" onClick={() => setPage('sequence')} aria-label="Go to sequence runner"><ArrowRight size={19}/></button>
                </div>
              </div>
            </div>
            <div className="stat-grid">
              <Stat label="API ROUND TRIP" value={latency == null ? '—' : String(latency)} unit="ms" sub="Most recent health check" icon={<Zap size={18}/>} />
              <Stat label="SAVED NODES" value={String(nodes.length).padStart(2, '0')} sub="Locally managed inventory" icon={<Server size={18}/>} />
              <Stat label="DIAGNOSTIC RUNS" value={String(scans.length).padStart(2, '0')} sub="Stored in this browser" icon={<Activity size={18}/>} />
              <Stat label="SUCCESS RATE" value={successRate == null ? '—' : String(successRate)} unit={successRate == null ? '' : '%'} sub="Based on recorded runs" icon={<CheckCircle2 size={18}/>} />
            </div>
            <div className="bottom-grid">
              <div className="panel activity-panel">
                <div className="panel-heading"><div><p className="eyebrow">RECENT ACTIVITY</p><h2>Operation log</h2></div><button className="quiet-action" onClick={() => setPage('analytics')}>View history <ArrowRight size={15}/></button></div>
                {scans.length ? scans.slice(0, 4).map(record => <div className="activity-row" key={record.id}>
                  <span className={'activity-icon ' + (record.success ? 'success' : 'failed')}>{record.success ? <Check size={17}/> : <X size={17}/>}</span>
                  <div><strong>{record.success ? 'Diagnostics passed' : 'Diagnostics need attention'}</strong><small>{record.steps.filter(step => step.passed).length}/3 checks passed · {elapsed(record.duration)}</small></div>
                  <time>{shortDate(record.at)} · {shortTime(record.at)}</time>
                </div>) : <Empty title="No operations recorded" description="Run diagnostics to collect real results from the edge runtime."/>}
              </div>
              <div className="panel insight-panel">
                <div className="panel-overline"><span><Globe2 size={16}/> SYSTEM PROFILE</span><span className="micro-index">WORKSPACE / LOCAL</span></div>
                <div className="profile-row"><span>HOST PLATFORM</span><strong>Cloudflare Workers</strong></div>
                <div className="profile-row"><span>APPLICATION</span><strong>React + Vite</strong></div>
                <div className="profile-row"><span>PERSISTENCE</span><strong>Browser storage</strong></div>
                <div className="profile-row"><span>API VERSION</span><strong>{health?.version || '—'}</strong></div>
                <p className="footnote">Runtime checks are live. Node labels and scan history are stored only in this browser—no synthetic system telemetry.</p>
              </div>
            </div>
          </>}

          {page === 'nodes' && <>
            <section className="page-intro compact-intro">
              <div><p className="eyebrow"><span className="eyebrow-dash" /> WORKSPACE / NODE REGISTRY</p><h1>Node <em>grid.</em></h1>
                <p className="subheading">Organize services and set manual status labels. Inventory is private to this browser.</p></div>
              <button className="primary-button" onClick={() => setNewNode(true)}><Plus size={18}/> Add node <ArrowRight size={16}/></button>
            </section>
            <div className="node-summary">
              <div><span>ALL NODES</span><strong>{nodes.length}</strong></div>
              <div><span>MARKED ONLINE</span><strong>{nodes.filter(node => node.state === 'online').length}</strong></div>
              <div><span>ATTENTION</span><strong>{nodes.filter(node => node.state === 'attention').length}</strong></div>
              <div><span>MARKED OFFLINE</span><strong>{nodes.filter(node => node.state === 'offline').length}</strong></div>
            </div>
            {nodes.length ? <div className="node-grid">{nodes.map((node, i) => <article className="node-card" key={node.id}>
              <div className="node-card-top"><span className="node-serial">{String(i+1).padStart(2,'0')} / NODE</span><span className={'node-state state-' + node.state}><span className="status-dot"/>{statusLabel[node.state]}</span></div>
              <span className="node-symbol"><Cpu size={27} strokeWidth={1.3}/></span>
              <h3>{node.name}</h3><p>{node.description || 'No description provided'}</p>
              <div className="node-card-actions"><label htmlFor={'status-' + node.id}>MANUAL STATUS</label>
                <select id={'status-' + node.id} value={node.state} onChange={event => changeNode(node.id, event.target.value as ServiceState)}>
                  <option value="online">Online</option><option value="attention">Attention</option><option value="offline">Offline</option>
                </select>
                <button aria-label={'Remove ' + node.name} title="Remove node" className="remove-node" onClick={() => setNodes(previous => previous.filter(n => n.id !== node.id))}><Trash2 size={16}/></button>
              </div>
            </article>)}</div> : <div className="panel empty-nodes"><div className="empty-node-art"><LayoutGrid size={42}/></div><h2>Your grid is ready.</h2><p>Add a node to organize your services. Status labels are set manually, not inferred from live telemetry.</p><button className="secondary-button" onClick={() => setNewNode(true)}><Plus size={17}/> Create first node</button></div>}
            <p className="footnote spread-footnote"><ShieldCheck size={15}/> Node names and status labels never leave your browser.</p>
            {newNode && <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setNewNode(false); }}>
              <form className="node-modal" onSubmit={addNode} aria-label="Add a node">
                <div className="modal-header"><div><p className="eyebrow">NODE REGISTRY</p><h2>Create node</h2></div><button type="button" className="icon-button" onClick={() => setNewNode(false)} aria-label="Close"><X size={20}/></button></div>
                <label htmlFor="node-name">NODE NAME</label><input id="node-name" autoFocus maxLength={64} required placeholder="e.g. Production API" value={nodeName} onChange={event => setNodeName(event.target.value)}/>
                <label htmlFor="node-description">DESCRIPTION (OPTIONAL)</label><textarea id="node-description" maxLength={140} rows={3} placeholder="A short note about the service" value={nodeDescription} onChange={event => setNodeDescription(event.target.value)}/>
                <p>New nodes start with a manually assigned “Online” label. No automated probe is implied.</p>
                <button className="primary-button" type="submit">Create node <ArrowRight size={16}/></button>
              </form>
            </div>}
          </>}

          {page === 'sequence' && <>
            <section className="page-intro compact-intro">
              <div><p className="eyebrow"><span className="eyebrow-dash" /> DIAGNOSTICS / RUNNER</p><h1>Execution <em>sequence.</em></h1>
                <p className="subheading">Three genuine HTTP checks against your deployed Cloudflare application.</p></div>
              <button className="primary-button" disabled={scanning} onClick={() => void scan()}><ScanLine size={18}/>{scanning ? 'Running sequence…' : 'Execute sequence'}<ArrowRight size={16}/></button>
            </section>
            <div className="sequence-layout">
              <div className="panel sequence-card">
                <div className="panel-overline"><span><ListChecks size={16}/> EXECUTION PIPELINE</span><span className="micro-index">03 / STEPS</span></div>
                <div className="sequence-steps">
                  {steps.map((step,i) => <div className={'sequence-step step-' + step.state} key={step.name}>
                    <div className="sequence-track"><span className="sequence-marker">{step.state === 'passed' ? <Check size={17}/> : step.state === 'failed' ? <X size={17}/> : String(i+1).padStart(2,'0')}</span>{i<steps.length-1 && <span className="track-line" />}</div>
                    <div className="step-body"><div className="step-heading"><h3>{step.name}</h3><span>{step.duration == null ? step.state.toUpperCase() : elapsed(step.duration)}</span></div><p>{step.state === 'failed' ? step.detail : step.detail === 'Validated' ? 'Response validated successfully' : step.detail}</p></div>
                  </div>)}
                </div>
                <div className="sequence-note"><ShieldCheck size={17}/> Calls are read-only and same-origin. No API keys or paid services required.</div>
              </div>
              <div className="sequence-aside">
                <div className="panel result-card">
                  <div className="panel-overline"><span><Terminal size={16}/> LAST EXECUTION</span></div>
                  <div className="result-value">{lastScan ? (lastScan.success ? 'PASS' : 'FAIL') : 'READY'}</div>
                  <div className="result-caption">{lastScan ? lastScan.steps.filter(step => step.passed).length + ' of 3 checks successful' : 'Awaiting first execution'}</div>
                  <div className="health-list"><div><span>DURATION</span><strong>{lastScan ? elapsed(lastScan.duration) : '—'}</strong></div><div><span>EXECUTED</span><strong>{lastScan ? shortTime(lastScan.at) : '—'}</strong></div><div><span>HISTORY</span><strong>{scans.length} RUNS</strong></div></div>
                </div>
                <div className="panel guidance-card"><div className="guidance-icon"><Zap size={22}/></div><h3>From edge to insight.</h3><p>Every run measures actual request times. Open Analytics to track performance over multiple executions.</p><button className="quiet-action" onClick={() => setPage('analytics')}>Open analytics <ArrowRight size={16}/></button></div>
              </div>
            </div>
          </>}

          {page === 'analytics' && <>
            <section className="page-intro compact-intro"><div><p className="eyebrow"><span className="eyebrow-dash"/> TELEMETRY / LOCAL HISTORY</p><h1>Signal <em>analytics.</em></h1>
              <p className="subheading">Measure diagnostics, explore recorded runs and export your workspace.</p></div>
              <button className="secondary-button" onClick={download}><Download size={17}/> Export JSON</button></section>
            <div className="stat-grid analytics-stats">
              <Stat label="EXECUTIONS" value={String(scans.length)} sub="Total recorded sequences" icon={<ListChecks size={18}/>} />
              <Stat label="SUCCESS RATE" value={successRate == null ? '—' : String(successRate)} unit={successRate == null ? '' : '%'} sub="Successful full sequences" icon={<CheckCircle2 size={18}/>} />
              <Stat label="AVG. DURATION" value={averageLatency == null ? '—' : String(averageLatency)} unit="ms" sub="End-to-end execution" icon={<Clock3 size={18}/>} />
              <Stat label="FAILED RUNS" value={String(scans.length - successCount)} sub="Runs needing attention" icon={<ArrowDownRight size={18}/>} />
            </div>
            <div className="panel chart-panel">
              <div className="panel-heading"><div><p className="eyebrow">PERFORMANCE HISTORY</p><h2>Execution latency</h2></div><span className="chart-legend"><span/> TOTAL DURATION / MS</span></div>
              {chart.length ? <div className="chart-content"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chart} margin={{ top: 12, right: 12, bottom: 0, left: -20 }}>
                <defs><linearGradient id="latencyFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#d4f875" stopOpacity={0.26}/><stop offset="95%" stopColor="#d4f875" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid vertical={false} stroke="#252a2a" strokeDasharray="3 7"/><XAxis dataKey="time" tickLine={false} axisLine={false} tick={{ fill: '#858e8e', fontSize: 11 }} minTickGap={20}/>
                <Tooltip contentStyle={{background:'#111516', border:'1px solid #353b3c',color:'#eaf0ed',borderRadius:8}} formatter={(value) => [String(value) + ' ms', 'Duration']}/>
                <Area type="monotone" dataKey="duration" stroke="#d4f875" strokeWidth={2} fill="url(#latencyFill)"/>
              </AreaChart></ResponsiveContainer></div> : <Empty title="No measurements yet" description="Execute a diagnostic sequence to generate your first latency sample."/>}
            </div>
            <div className="panel history-panel">
              <div className="panel-heading"><div><p className="eyebrow">RUN ARCHIVE</p><h2>History</h2></div>
                {scans.length > 0 && <button className="quiet-action danger-text" onClick={() => { if(window.confirm('Clear saved diagnostic history from this browser?')) setScans([]); }}><Trash2 size={15}/> Clear history</button>}</div>
              {scans.length ? <div className="history-scroll"><table className="history-table"><thead><tr><th>RESULT</th><th>DATE</th><th>DURATION</th><th>CHECKS</th></tr></thead><tbody>{scans.map(record => <tr key={record.id}>
                <td><span className={'table-result ' + (record.success ? 'passed' : 'failed')}><span className="status-dot"/>{record.success ? 'PASSED':'FAILED'}</span></td>
                <td>{shortDate(record.at)} · {shortTime(record.at)}</td><td>{elapsed(record.duration)}</td><td>{record.steps.filter(step => step.passed).length} / 3</td>
              </tr>)}</tbody></table></div> : <Empty title="Your archive is empty" description="Diagnostic runs appear here automatically."/>}
            </div>
          </>}
          <footer className="workspace-footer"><span>© {clock.getFullYear()} ECLIPSE OS</span><span>DESIGNED FOR CLOUDFLARE WORKERS · NO PAID SERVICES</span><span>LOCAL-FIRST CONTROL ROOM</span></footer>
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value, unit, sub, icon }: { label: string; value: string; unit?: string; sub: string; icon: React.ReactNode }) {
  return <div className="panel stat-card"><div className="stat-top"><span>{label}</span>{icon}</div><div className="stat-value">{value}{unit && <small>{unit}</small>}</div><div className="stat-sub">{sub}</div></div>;
}
function Empty({ title, description }: { title: string; description: string }) {
  return <div className="empty-state"><span className="empty-indicator"><CircleDot size={19}/></span><strong>{title}</strong><p>{description}</p></div>;
}
