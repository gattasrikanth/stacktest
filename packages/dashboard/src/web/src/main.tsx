import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  type ArtifactTreeNode,
  type DashboardRunDetail,
  type DashboardRunEvent,
  type DashboardRunListItem,
  type DashboardRunStatus,
  type DashboardSettings,
} from "../../shared/types.js";
import "./styles.css";

type View =
  | { name: "runs" }
  | { name: "detail"; runId: string }
  | { name: "artifacts"; runId: string }
  | { name: "settings" }
  | { name: "launch" };

function currentView(): View {
  const path = window.location.pathname;
  const artifactMatch = path.match(/^\/runs\/([^/]+)\/artifacts/);
  if (artifactMatch) return { name: "artifacts", runId: decodeURIComponent(artifactMatch[1]) };
  const runMatch = path.match(/^\/runs\/([^/]+)/);
  if (runMatch) return { name: "detail", runId: decodeURIComponent(runMatch[1]) };
  if (path === "/settings") return { name: "settings" };
  if (path === "/launch") return { name: "launch" };
  return { name: "runs" };
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(await response.text());
  return response.json() as Promise<T>;
}

function navigate(path: string): void {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function formatDuration(ms: number): string {
  if (!ms) return "live";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(ms > 10000 ? 0 : 1)}s`;
}

function formatDate(value?: string): string {
  if (!value) return "Active";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function StatusBadge({ status }: { status: DashboardRunStatus | string }): React.ReactElement {
  return <span className={`status ${String(status).toLowerCase()}`}>{status}</span>;
}

function AppShell({ children }: { children: React.ReactNode }): React.ReactElement {
  const items = [
    { label: "Runs", path: "/runs" },
    { label: "Settings", path: "/settings" },
    { label: "Launch Test", path: "/launch" },
  ];
  return (
    <div className="app">
      <aside className="sidebar">
        <button className="brand" onClick={() => navigate("/runs")}>
          <span className="brand-mark">ST</span>
          <span>
            <strong>StackTest</strong>
            <small>Local Dashboard</small>
          </span>
        </button>
        <nav>
          {items.map((item) => (
            <button key={item.path} onClick={() => navigate(item.path)}>
              {item.label}
            </button>
          ))}
        </nav>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}

function Loading(): React.ReactElement {
  return <div className="panel muted">Loading...</div>;
}

function ErrorPanel({ message }: { message: string }): React.ReactElement {
  return <div className="panel error">Error: {message}</div>;
}

function RunsPage(): React.ReactElement {
  const [runs, setRuns] = useState<DashboardRunListItem[]>([]);
  const [status, setStatus] = useState<DashboardRunStatus | "ALL">("ALL");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getJson<DashboardRunListItem[]>("/api/runs")
      .then(setRuns)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () =>
      runs.filter((run) => {
        const matchesStatus = status === "ALL" || run.status === status;
        const haystack = `${run.runId} ${run.scenarioName} ${run.provider} ${run.regions.join(" ")}`.toLowerCase();
        return matchesStatus && haystack.includes(query.toLowerCase());
      }),
    [runs, status, query],
  );

  if (loading) return <Loading />;
  if (error) return <ErrorPanel message={error} />;

  return (
    <>
      <section className="page-header">
        <div>
          <h1>Runs</h1>
          <p>Local test history from `.stacktest/runs`.</p>
        </div>
        <div className="metrics">
          <div><strong>{runs.length}</strong><span>Total</span></div>
          <div><strong>{runs.filter((run) => run.status === "FAILED").length}</strong><span>Failed</span></div>
          <div><strong>{runs.filter((run) => run.status === "RUNNING").length}</strong><span>Running</span></div>
        </div>
      </section>
      <section className="toolbar">
        <input aria-label="Search runs" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search run ID, project, provider, region" />
        {(["ALL", "PASSED", "FAILED", "RUNNING", "UNKNOWN"] as const).map((item) => (
          <button key={item} className={status === item ? "active" : ""} onClick={() => setStatus(item)}>
            {item}
          </button>
        ))}
      </section>
      {filtered.length === 0 ? (
        <div className="panel muted">No runs found. Run `stacktest run ./stacktest.yaml` first.</div>
      ) : (
        <section className="run-list">
          {filtered.map((run) => (
            <button key={run.runId} className="run-row" onClick={() => navigate(`/runs/${encodeURIComponent(run.runId)}`)}>
              <span>
                <strong>{run.scenarioName}</strong>
                <code>{run.runId}</code>
              </span>
              <span>{run.provider}</span>
              <span>{run.regions.join(", ") || "unknown"}</span>
              <span>{formatDate(run.startedAt)}</span>
              <span>{formatDuration(run.durationMs)}</span>
              <StatusBadge status={run.status} />
            </button>
          ))}
        </section>
      )}
    </>
  );
}

function EventTimeline({ events }: { events: DashboardRunEvent[] }): React.ReactElement {
  if (events.length === 0) return <div className="panel muted">No event stream is available for this run.</div>;
  return (
    <div className="timeline">
      {events.map((event) => (
        <div key={event.eventId} className={`timeline-item ${String(event.status || event.type).toLowerCase()}`}>
          <time>{formatDate(event.timestamp)}</time>
          <strong>{event.status || event.type}</strong>
          <span>{event.resourceLogicalId || event.deploymentId || "run"}</span>
          <p>{event.message || event.statusReason || "No message"}</p>
        </div>
      ))}
    </div>
  );
}

function RunDetailPage({ runId }: { runId: string }): React.ReactElement {
  const [run, setRun] = useState<DashboardRunDetail>();
  const [events, setEvents] = useState<DashboardRunEvent[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    getJson<DashboardRunDetail>(`/api/runs/${encodeURIComponent(runId)}`)
      .then((detail) => {
        setRun(detail);
        setEvents(detail.events);
      })
      .catch((err: Error) => setError(err.message));
  }, [runId]);

  useEffect(() => {
    const source = new EventSource(`/api/runs/${encodeURIComponent(runId)}/events/stream`);
    source.addEventListener("stacktest-event", (message) => {
      const next = JSON.parse((message as MessageEvent).data) as DashboardRunEvent;
      setEvents((current) => (current.some((event) => event.eventId === next.eventId) ? current : [...current, next]));
    });
    source.onerror = () => source.close();
    return () => source.close();
  }, [runId]);

  if (error) return <ErrorPanel message={error} />;
  if (!run) return <Loading />;

  return (
    <>
      <section className="page-header">
        <div>
          <button className="link" onClick={() => navigate("/runs")}>Back to runs</button>
          <h1>{run.scenarioName}</h1>
          <p><code>{run.runId}</code>{run.isPartial ? " · partial legacy metadata" : ""}</p>
        </div>
        <StatusBadge status={run.status} />
      </section>
      <section className="metrics wide">
        <div><strong>{run.totals.tests}</strong><span>Total tests</span></div>
        <div><strong>{run.totals.passed}</strong><span>Passed</span></div>
        <div><strong>{run.totals.failed}</strong><span>Failed</span></div>
        <div><strong>{formatDuration(run.durationMs)}</strong><span>Duration</span></div>
      </section>
      <section className="section-grid">
        <div>
          <h2>Deployments</h2>
          {run.deployments.map((deployment) => (
            <article className="panel" key={deployment.id}>
              <div className="panel-title">
                <strong>{deployment.name}</strong>
                <StatusBadge status={deployment.status} />
              </div>
              <dl>
                <dt>Provider</dt><dd>{deployment.provider}</dd>
                <dt>Region</dt><dd>{deployment.region}</dd>
                <dt>Template</dt><dd><code>{deployment.template || "unknown"}</code></dd>
                <dt>Stack</dt><dd><code>{deployment.stackName || deployment.id}</code></dd>
              </dl>
              {deployment.error ? <p className="error-text">{deployment.error}</p> : null}
            </article>
          ))}
        </div>
        <div>
          <div className="panel-title">
            <h2>Execution Event Stream</h2>
            <button onClick={() => navigate(`/runs/${encodeURIComponent(runId)}/artifacts`)}>Artifacts</button>
          </div>
          <EventTimeline events={events} />
        </div>
      </section>
    </>
  );
}

function ArtifactNode({ node, onSelect }: { node: ArtifactTreeNode; onSelect: (path: string) => void }): React.ReactElement {
  if (node.type === "directory") {
    return (
      <li>
        <span className="tree-dir">{node.name}</span>
        <ul>{(node.children || []).map((child) => <ArtifactNode key={child.path} node={child} onSelect={onSelect} />)}</ul>
      </li>
    );
  }
  return (
    <li>
      <button className="tree-file" onClick={() => onSelect(node.path)}>{node.name}</button>
      <small>{node.size ? `${node.size} bytes` : ""}</small>
    </li>
  );
}

function ArtifactsPage({ runId }: { runId: string }): React.ReactElement {
  const [files, setFiles] = useState<ArtifactTreeNode[]>([]);
  const [selected, setSelected] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    getJson<ArtifactTreeNode[]>(`/api/runs/${encodeURIComponent(runId)}/artifacts`)
      .then(setFiles)
      .catch((err: Error) => setError(err.message));
  }, [runId]);

  const openFile = (filePath: string): void => {
    setSelected(filePath);
    fetch(`/api/runs/${encodeURIComponent(runId)}/artifacts/file?path=${encodeURIComponent(filePath)}`)
      .then((response) => response.text())
      .then(setContent)
      .catch((err: Error) => setContent(err.message));
  };

  return (
    <>
      <section className="page-header">
        <div>
          <button className="link" onClick={() => navigate(`/runs/${encodeURIComponent(runId)}`)}>Back to run</button>
          <h1>Artifacts</h1>
          <p><code>{runId}</code></p>
        </div>
      </section>
      {error ? <ErrorPanel message={error} /> : null}
      <section className="artifacts">
        <div className="panel">
          {files.length === 0 ? <p className="muted-text">No artifacts found.</p> : <ul className="tree">{files.map((node) => <ArtifactNode key={node.path} node={node} onSelect={openFile} />)}</ul>}
        </div>
        <div className="panel viewer">
          <div className="panel-title">
            <strong>{selected || "Select a file"}</strong>
            {selected ? <button onClick={() => navigator.clipboard?.writeText(content)}>Copy</button> : null}
          </div>
          <pre>{content || "File contents will appear here."}</pre>
        </div>
      </section>
    </>
  );
}

function SettingsPage(): React.ReactElement {
  const [settings, setSettings] = useState<DashboardSettings>();
  const [message, setMessage] = useState("");

  useEffect(() => {
    getJson<DashboardSettings>("/api/settings").then(setSettings).catch((err: Error) => setMessage(err.message));
  }, []);

  if (!settings) return <Loading />;

  const save = (): void => {
    fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    })
      .then(() => setMessage("Settings saved locally."))
      .catch((err: Error) => setMessage(err.message));
  };

  return (
    <>
      <section className="page-header"><h1>Settings</h1></section>
      <section className="panel settings">
        <label>Dashboard port<input type="number" value={settings.port} onChange={(event) => setSettings({ ...settings, port: Number(event.target.value) })} /></label>
        <label>Runs directory<input value={settings.runsDir} onChange={(event) => setSettings({ ...settings, runsDir: event.target.value })} /></label>
        <label>Theme<select value={settings.theme} onChange={(event) => setSettings({ ...settings, theme: event.target.value as DashboardSettings["theme"] })}><option>system</option><option>light</option><option>dark</option></select></label>
        <label className="check"><input type="checkbox" checked={settings.autoOpen} onChange={(event) => setSettings({ ...settings, autoOpen: event.target.checked })} /> Auto-open browser</label>
        <button onClick={save}>Save</button>
        {message ? <p className="muted-text">{message}</p> : null}
      </section>
    </>
  );
}

function LaunchPage(): React.ReactElement {
  return (
    <>
      <section className="page-header"><h1>Launch Test</h1></section>
      <div className="panel muted">Browser-based test launching is disabled in this release. Use `stacktest run ./stacktest.yaml` from the CLI.</div>
    </>
  );
}

function App(): React.ReactElement {
  const [view, setView] = useState(currentView());
  useEffect(() => {
    const listener = (): void => setView(currentView());
    window.addEventListener("popstate", listener);
    if (window.location.pathname === "/") navigate("/runs");
    return () => window.removeEventListener("popstate", listener);
  }, []);

  return (
    <AppShell>
      {view.name === "runs" ? <RunsPage /> : null}
      {view.name === "detail" ? <RunDetailPage runId={view.runId} /> : null}
      {view.name === "artifacts" ? <ArtifactsPage runId={view.runId} /> : null}
      {view.name === "settings" ? <SettingsPage /> : null}
      {view.name === "launch" ? <LaunchPage /> : null}
    </AppShell>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
