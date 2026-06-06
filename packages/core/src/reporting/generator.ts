import * as fs from "fs";
import * as path from "path";
import { type DeploymentPlan } from "../planner/planner.js";
import { type DeploymentResult } from "../providers/types.js";
import { writeNormalizedRunArtifacts } from "../runs/run-artifacts.js";

export interface ReportSummary {
  passed: number;
  failed: number;
  total: number;
  durationMs: number;
}

export interface ReportJson {
  projectName: string;
  runId: string;
  timestamp: string;
  summary: ReportSummary;
  deployments: Array<{
    testName: string;
    provider: string;
    region: string;
    deploymentName: string;
    template: string;
    parameters: Record<string, string | number | boolean | null>;
    success: boolean;
    status: string;
    durationMs: number;
    error?: string;
    events?: Array<{
      timestamp: string;
      resourceType: string;
      logicalResourceId: string;
      status: string;
      statusReason?: string;
    }>;
  }>;
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
      default:
        return c;
    }
  });
}

export class ReportGenerator {
  static generateJson(
    projectName: string,
    runId: string,
    plans: DeploymentPlan[],
    results: DeploymentResult[],
  ): ReportJson {
    const totalDuration = results.reduce((sum, r) => sum + r.durationMs, 0);
    const passed = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    const deployments = results.map((res) => {
      const plan = plans.find((p) => p.deploymentName === res.deploymentName) || {
        testName: "unknown",
        providerName: "unknown",
        region: "unknown",
        template: "unknown",
        parameters: {},
      };

      return {
        testName: plan.testName,
        provider: plan.providerName,
        region: plan.region,
        deploymentName: res.deploymentName,
        template: plan.template,
        parameters: plan.parameters,
        success: res.success,
        status: res.status,
        durationMs: res.durationMs,
        error: res.error?.message,
        events: res.events?.map((e) => ({
          timestamp: new Date(e.timestamp).toISOString(),
          resourceType: e.resourceType,
          logicalResourceId: e.logicalResourceId,
          status: e.status,
          statusReason: e.statusReason,
        })),
      };
    });

    return {
      projectName,
      runId,
      timestamp: new Date().toISOString(),
      summary: {
        passed,
        failed,
        total: results.length,
        durationMs: totalDuration,
      },
      deployments,
    };
  }

  static generateJunit(
    projectName: string,
    runId: string,
    plans: DeploymentPlan[],
    results: DeploymentResult[],
  ): string {
    const totalDurationSec = (results.reduce((sum, r) => sum + r.durationMs, 0) / 1000).toFixed(3);
    const failed = results.filter((r) => !r.success).length;
    const total = results.length;

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<testsuites name="StackTest Run" tests="${total}" failures="${failed}" time="${totalDurationSec}">\n`;
    xml += `  <testsuite name="${escapeXml(runId)}" tests="${total}" failures="${failed}" id="0" time="${totalDurationSec}">\n`;

    for (const res of results) {
      const plan = plans.find((p) => p.deploymentName === res.deploymentName);
      const testName = plan?.testName || "unknown";
      const provider = plan?.providerName || "unknown";
      const region = plan?.region || "unknown";
      const classname = `${escapeXml(provider)}.${escapeXml(region)}.${escapeXml(testName)}`;
      const name = escapeXml(res.deploymentName);
      const durationSec = (res.durationMs / 1000).toFixed(3);

      xml += `    <testcase classname="${classname}" name="${name}" time="${durationSec}">\n`;
      if (!res.success) {
        const errMsg = res.error?.message || "Deployment failed";
        let errContent = `Status: ${res.status}\n`;
        if (res.events && res.events.length > 0) {
          errContent += `Events:\n`;
          for (const ev of res.events) {
            errContent += `- [${new Date(ev.timestamp).toISOString()}] ${ev.logicalResourceId} (${ev.resourceType}): ${ev.status}`;
            if (ev.statusReason) {
              errContent += ` - ${ev.statusReason}`;
            }
            errContent += `\n`;
          }
        }
        xml += `      <failure message="${escapeXml(errMsg)}">${escapeXml(errContent)}</failure>\n`;
      }
      xml += `    </testcase>\n`;
    }

    xml += `  </testsuite>\n`;
    xml += `</testsuites>\n`;
    return xml;
  }

  static generateHtml(
    projectName: string,
    runId: string,
    plans: DeploymentPlan[],
    results: DeploymentResult[],
  ): string {
    const reportJson = this.generateJson(projectName, runId, plans, results);

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>StackTest Report - ${escapeXml(projectName)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-dark: #090d16;
      --bg-card: rgba(22, 30, 49, 0.65);
      --bg-card-hover: rgba(30, 41, 67, 0.8);
      --border-color: rgba(255, 255, 255, 0.08);
      --border-color-hover: rgba(255, 255, 255, 0.15);
      --text-main: #f3f4f6;
      --text-muted: #9ca3af;
      --text-dim: #6b7280;
      --color-purple: #a855f7;
      --color-success: #10b981;
      --color-success-bg: rgba(16, 185, 129, 0.1);
      --color-success-border: rgba(16, 185, 129, 0.2);
      --color-failure: #ef4444;
      --color-failure-bg: rgba(239, 68, 68, 0.1);
      --color-failure-border: rgba(239, 68, 68, 0.2);
      --color-info: #3b82f6;
      --color-info-bg: rgba(59, 130, 246, 0.1);
      --color-info-border: rgba(59, 130, 246, 0.2);
      --shadow-primary: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: var(--bg-dark);
      background-image: 
        radial-gradient(at 0% 0%, rgba(120, 119, 198, 0.08) 0px, transparent 50%),
        radial-gradient(at 50% 0%, rgba(168, 85, 247, 0.05) 0px, transparent 50%),
        radial-gradient(at 100% 0%, rgba(59, 130, 246, 0.08) 0px, transparent 50%);
      background-attachment: fixed;
      color: var(--text-main);
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      min-height: 100vh;
      padding: 2.5rem 1.5rem;
    }

    .container {
      max-width: 1100px;
      margin: 0 auto;
    }

    /* Header styling */
    header {
      background: var(--bg-card);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid var(--border-color);
      border-radius: 1rem;
      padding: 2rem;
      margin-bottom: 2rem;
      box-shadow: var(--shadow-primary);
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    @media (min-width: 768px) {
      header {
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
      }
    }

    .header-main h1 {
      font-size: 1.8rem;
      font-weight: 700;
      letter-spacing: -0.025em;
      margin-bottom: 0.3rem;
      background: linear-gradient(to right, #fff, #9ca3af);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .header-main p {
      font-size: 0.9rem;
      color: var(--text-muted);
      display: flex;
      gap: 1.5rem;
      flex-wrap: wrap;
    }

    .header-main span strong {
      color: var(--text-main);
    }

    /* Metrics Grid */
    .metrics {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .metric-card {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 0.75rem;
      padding: 1rem 1.5rem;
      text-align: center;
      min-width: 100px;
      flex-grow: 1;
    }

    .metric-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-main);
      margin-bottom: 0.2rem;
    }

    .metric-label {
      font-size: 0.75rem;
      font-weight: 500;
      text-transform: uppercase;
      color: var(--text-muted);
      letter-spacing: 0.05em;
    }

    .metric-card.passed .metric-value { color: var(--color-success); }
    .metric-card.failed .metric-value { color: var(--color-failure); }

    /* Filters */
    .filters {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
    }

    .filter-btn {
      background: transparent;
      border: 1px solid var(--border-color);
      color: var(--text-muted);
      padding: 0.5rem 1.2rem;
      border-radius: 9999px;
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.20s ease-in-out;
    }

    .filter-btn:hover {
      border-color: var(--border-color-hover);
      color: var(--text-main);
      background: rgba(255, 255, 255, 0.02);
    }

    .filter-btn.active {
      background: var(--color-purple);
      border-color: var(--color-purple);
      color: #fff;
      box-shadow: 0 4px 14px 0 rgba(168, 85, 247, 0.4);
    }

    /* Cards */
    .deployments-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .card {
      background: var(--bg-card);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid var(--border-color);
      border-radius: 0.75rem;
      overflow: hidden;
      box-shadow: var(--shadow-primary);
      transition: border-color 0.2s, background-color 0.2s;
    }

    .card:hover {
      border-color: var(--border-color-hover);
      background-color: var(--bg-card-hover);
    }

    .card-header {
      padding: 1.25rem 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      user-select: none;
    }

    .card-title-area {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .badge {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      padding: 0.25rem 0.6rem;
      border-radius: 0.375rem;
      letter-spacing: 0.02em;
    }

    .badge.passed {
      background-color: var(--color-success-bg);
      border: 1px solid var(--color-success-border);
      color: var(--color-success);
    }

    .badge.failed {
      background-color: var(--color-failure-bg);
      border: 1px solid var(--color-failure-border);
      color: var(--color-failure);
    }

    .card-info {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }

    .card-name {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-main);
    }

    .card-meta {
      font-size: 0.8rem;
      color: var(--text-muted);
      display: flex;
      gap: 1rem;
    }

    .card-right {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }

    .card-duration {
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--text-muted);
    }

    .chevron {
      width: 1.25rem;
      height: 1.25rem;
      color: var(--text-dim);
      transition: transform 0.2s;
    }

    .card.expanded .chevron {
      transform: rotate(180deg);
    }

    /* Expanded Details Drawer */
    .card-details {
      display: none;
      padding: 1.5rem;
      border-top: 1px solid var(--border-color);
      background: rgba(0, 0, 0, 0.15);
    }

    .card.expanded .card-details {
      display: block;
    }

    .details-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }

    @media (min-width: 900px) {
      .details-grid {
        grid-template-columns: 4fr 5fr;
      }
    }

    .detail-section-title {
      font-size: 0.85rem;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--text-muted);
      letter-spacing: 0.05em;
      margin-bottom: 0.75rem;
    }

    .info-panel {
      background: rgba(255, 255, 255, 0.01);
      border: 1px solid rgba(255, 255, 255, 0.04);
      border-radius: 0.5rem;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.03);
      padding-bottom: 0.5rem;
    }

    .info-row:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    .info-label {
      color: var(--text-muted);
    }

    .info-val {
      font-weight: 500;
      color: var(--text-main);
    }

    .info-val.mono {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
    }

    /* Parameters Table */
    .params-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
    }

    .params-table th, .params-table td {
      padding: 0.5rem;
      text-align: left;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    }

    .params-table th {
      color: var(--text-muted);
      font-weight: 500;
    }

    .params-table td.key {
      font-family: 'JetBrains Mono', monospace;
      color: var(--color-purple);
      font-weight: 500;
      width: 40%;
    }

    .params-table td.val {
      font-family: 'JetBrains Mono', monospace;
      color: var(--text-main);
      word-break: break-all;
    }

    /* Error Panel */
    .error-banner {
      grid-column: 1 / -1;
      background: var(--color-failure-bg);
      border: 1px solid var(--color-failure-border);
      border-radius: 0.5rem;
      padding: 1rem 1.25rem;
      font-size: 0.85rem;
      color: #fca5a5;
      line-height: 1.5;
    }

    .error-banner strong {
      color: #fff;
      display: block;
      margin-bottom: 0.25rem;
      font-size: 0.9rem;
    }

    .error-banner pre {
      font-family: 'JetBrains Mono', monospace;
      margin-top: 0.5rem;
      white-space: pre-wrap;
      word-break: break-all;
    }

    /* Timeline events */
    .timeline {
      position: relative;
      padding-left: 1rem;
      border-left: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .timeline-item {
      position: relative;
    }

    .timeline-dot {
      position: absolute;
      left: calc(-1rem - 4px);
      top: 0.25rem;
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--text-dim);
    }

    .timeline-dot.success { background: var(--color-success); }
    .timeline-dot.failed { background: var(--color-failure); }
    .timeline-dot.progress { background: var(--color-info); }

    .timeline-header {
      display: flex;
      justify-content: space-between;
      font-size: 0.8rem;
      margin-bottom: 0.25rem;
    }

    .timeline-time {
      color: var(--text-dim);
      font-family: 'JetBrains Mono', monospace;
    }

    .timeline-resource {
      font-weight: 600;
      color: var(--text-main);
    }

    .timeline-status {
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--text-muted);
      margin-bottom: 0.2rem;
    }

    .timeline-status-val {
      font-family: 'JetBrains Mono', monospace;
      font-weight: 600;
    }

    .timeline-status-val.success { color: var(--color-success); }
    .timeline-status-val.failed { color: var(--color-failure); }
    .timeline-status-val.progress { color: var(--color-info); }

    .timeline-reason {
      font-size: 0.75rem;
      color: #fca5a5;
      background: rgba(239, 68, 68, 0.05);
      border: 1px solid rgba(239, 68, 68, 0.1);
      border-radius: 0.25rem;
      padding: 0.4rem 0.6rem;
      margin-top: 0.25rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="header-main">
        <h1 id="project-title">StackTest Report</h1>
        <p>
          <span>Run ID: <strong id="run-id-text">-</strong></span>
          <span>Time: <strong id="timestamp-text">-</strong></span>
        </p>
      </div>
      <div class="metrics">
        <div class="metric-card">
          <div class="metric-value" id="stat-total">0</div>
          <div class="metric-label">Total</div>
        </div>
        <div class="metric-card passed">
          <div class="metric-value" id="stat-passed">0</div>
          <div class="metric-label">Passed</div>
        </div>
        <div class="metric-card failed">
          <div class="metric-value" id="stat-failed">0</div>
          <div class="metric-label">Failed</div>
        </div>
        <div class="metric-card">
          <div class="metric-value" id="stat-duration">0ms</div>
          <div class="metric-label">Duration</div>
        </div>
      </div>
    </header>

    <div class="filters">
      <button class="filter-btn active" onclick="setFilter('all')">All</button>
      <button class="filter-btn" onclick="setFilter('passed')">Passed</button>
      <button class="filter-btn" onclick="setFilter('failed')">Failed</button>
    </div>

    <div class="deployments-list" id="deployments-container">
      <!-- Dynamic list rendered by JavaScript -->
    </div>
  </div>

  <script id="report-data" type="application/json">
    ${JSON.stringify(reportJson)}
  </script>

  <script>
    const data = JSON.parse(document.getElementById('report-data').textContent);
    let activeFilter = 'all';

    // Populate overall statistics
    document.getElementById('project-title').textContent = 'StackTest: ' + data.projectName;
    document.getElementById('run-id-text').textContent = data.runId;
    document.getElementById('timestamp-text').textContent = new Date(data.timestamp).toLocaleString();
    document.getElementById('stat-total').textContent = data.summary.total;
    document.getElementById('stat-passed').textContent = data.summary.passed;
    document.getElementById('stat-failed').textContent = data.summary.failed;
    document.getElementById('stat-duration').textContent = formatDuration(data.summary.durationMs);

    function formatDuration(ms) {
      if (ms < 1000) return ms + 'ms';
      return (ms / 1000).toFixed(2) + 's';
    }

    function toggleCard(cardId) {
      const card = document.getElementById(cardId);
      card.classList.toggle('expanded');
    }

    function setFilter(filter) {
      activeFilter = filter;
      document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.toLowerCase() === filter) {
          btn.classList.add('active');
        }
      });
      renderList();
    }

    function renderList() {
      const container = document.getElementById('deployments-container');
      container.innerHTML = '';

      const filtered = data.deployments.filter(d => {
        if (activeFilter === 'passed') return d.success;
        if (activeFilter === 'failed') return !d.success;
        return true;
      });

      if (filtered.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: var(--text-dim); padding: 3rem; font-size: 0.9rem;">No deployments found matching this filter.</div>';
        return;
      }

      filtered.forEach((d, idx) => {
        const cardId = 'card-' + idx;
        const card = document.createElement('div');
        card.className = 'card';
        card.id = cardId;

        const badgeClass = d.success ? 'passed' : 'failed';
        const badgeText = d.success ? 'Passed' : 'Failed';

        // Parameters HTML table
        let paramsHtml = '<div style="text-align: center; color: var(--text-dim); font-size: 0.8rem; padding: 0.5rem 0;">No parameters specified.</div>';
        if (d.parameters && Object.keys(d.parameters).length > 0) {
          paramsHtml = '<table class="params-table"><thead><tr><th>Parameter</th><th>Value</th></tr></thead><tbody>';
          Object.entries(d.parameters).forEach(([key, val]) => {
            paramsHtml += \`<tr><td class="key">\${key}</td><td class="val">\${val === null ? 'null' : val}</td></tr>\`;
          });
          paramsHtml += '</tbody></table>';
        }

        // Timeline events HTML
        let eventsHtml = '<div style="color: var(--text-dim); font-size: 0.8rem; padding-left: 0.5rem;">No deployment events logged.</div>';
        if (d.events && d.events.length > 0) {
          eventsHtml = '<div class="timeline">';
          d.events.forEach(ev => {
            const isCfnFail = ev.status.includes('FAILED') || ev.status.includes('ROLLBACK');
            const isCfnSuccess = ev.status.includes('COMPLETE') && !ev.status.includes('ROLLBACK');
            const dotClass = isCfnFail ? 'failed' : (isCfnSuccess ? 'success' : 'progress');
            const valClass = isCfnFail ? 'failed' : (isCfnSuccess ? 'success' : 'progress');

            eventsHtml += \`
              <div class="timeline-item">
                <div class="timeline-dot \${dotClass}"></div>
                <div class="timeline-header">
                  <span class="timeline-resource">\${ev.logicalResourceId} <span style="font-weight: normal; color: var(--text-dim); font-size: 0.75rem;">(\${ev.resourceType})</span></span>
                  <span class="timeline-time">\${new Date(ev.timestamp).toLocaleTimeString()}</span>
                </div>
                <div class="timeline-status">
                  Status: <span class="timeline-status-val \${valClass}">\${ev.status}</span>
                </div>
                \${ev.statusReason ? \`<div class="timeline-reason">\${ev.statusReason}</div>\` : ''}
              </div>
            \`;
          });
          eventsHtml += '</div>';
        }

        // Error panel
        const errorHtml = !d.success ? \`
          <div class="error-banner">
            <strong>Deployment Failure Diagnostic</strong>
            \${d.error ? \`<pre>\${d.error}</pre>\` : 'No detailed error stack returned.'}
          </div>
        \` : '';

        card.innerHTML = \`
          <div class="card-header" onclick="toggleCard('\${cardId}')">
            <div class="card-title-area">
              <span class="badge \${badgeClass}">\${badgeText}</span>
              <div class="card-info">
                <div class="card-name">\${d.testName}</div>
                <div class="card-meta">
                  <span>Provider: <strong>\${d.provider}</strong></span>
                  <span>Region: <strong>\${d.region}</strong></span>
                </div>
              </div>
            </div>
            <div class="card-right">
              <span class="card-duration">\${formatDuration(d.durationMs)}</span>
              <svg class="chevron" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          <div class="card-details">
            <div class="details-grid">
              \${errorHtml}
              <div>
                <div class="detail-section-title">Deployment Metadata</div>
                <div class="info-panel" style="margin-bottom: 1.5rem;">
                  <div class="info-row">
                    <span class="info-label">Logical Name</span>
                    <span class="info-val">\${d.deploymentName}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Template Path</span>
                    <span class="info-val mono">\${d.template}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Final Status</span>
                    <span class="info-val">\${d.status}</span>
                  </div>
                </div>
                <div class="detail-section-title">Deployment Parameters</div>
                <div class="info-panel">
                  \${paramsHtml}
                </div>
              </div>
              <div>
                <div class="detail-section-title">Execution Event Stream</div>
                \${eventsHtml}
              </div>
            </div>
          </div>
        \`;

        container.appendChild(card);
      });
    }

    renderList();
  </script>
</body>
</html>
`;
  }

  static async writeReports(
    projectName: string,
    runId: string,
    plans: DeploymentPlan[],
    results: DeploymentResult[],
  ): Promise<{ jsonPath: string; junitPath: string; htmlPath: string }> {
    const runsDir = path.resolve(process.cwd(), ".stacktest", "runs", runId);
    fs.mkdirSync(runsDir, { recursive: true });

    const json = JSON.stringify(this.generateJson(projectName, runId, plans, results), null, 2);
    const junit = this.generateJunit(projectName, runId, plans, results);
    const html = this.generateHtml(projectName, runId, plans, results);

    const jsonPath = path.join(runsDir, "report.json");
    const junitPath = path.join(runsDir, "junit.xml");
    const htmlPath = path.join(runsDir, "report.html");

    fs.writeFileSync(jsonPath, json, "utf8");
    fs.writeFileSync(junitPath, junit, "utf8");
    fs.writeFileSync(htmlPath, html, "utf8");
    writeNormalizedRunArtifacts(path.resolve(process.cwd(), ".stacktest", "runs"), {
      projectName,
      runId,
      plans,
      results,
    });

    return { jsonPath, junitPath, htmlPath };
  }
}
