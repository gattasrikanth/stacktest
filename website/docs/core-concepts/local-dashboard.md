# Local Dashboard

StackTest includes a local-first dashboard for inspecting run history, deployment status, event timelines, and raw artifacts.

```bash
npx stacktest dashboard
```

The server binds to `127.0.0.1` by default and reads local files under `.stacktest/runs`. No test data is uploaded by the dashboard.

![StackTest local dashboard showing run history with status filters](/img/dashboard/dashboard-run-history.png)

## View Previous Runs

After a run completes, open the dashboard and visit `/runs`. The run list supports status filters and text search across run ID, project name, provider, and regions.

## Inspect A Run

Open a run to see summary metrics, deployment metadata, failure details, and the execution event stream.

![StackTest local dashboard showing a passed AWS CloudFormation run with event timeline](/img/dashboard/dashboard-run-detail-passed.png)

Failed runs highlight the failing deployment and provider event reason.

![StackTest local dashboard showing a failed AWS CloudFormation deployment event](/img/dashboard/dashboard-run-detail-failed.png)

## Watch An Active Run

Use the dashboard integration when running tests:

```bash
npx stacktest run ./stacktest.yaml --dashboard
```

New normalized runs write `events.jsonl`, and the dashboard streams appended events with Server-Sent Events.

![StackTest local dashboard showing a running multi-region test](/img/dashboard/dashboard-live-run.png)

## Open Raw Artifacts

The artifacts page lists files under the selected run folder and previews JSON, logs, and text files.

![StackTest local dashboard showing the artifacts file browser](/img/dashboard/dashboard-artifacts.png)

## Mock Mode

Use deterministic mock data for demos and documentation:

```bash
npx stacktest dashboard --mock --port 3456 --no-open
```

## Options

```bash
npx stacktest dashboard \
  --dir .stacktest \
  --runs-dir .stacktest/runs \
  --port 3456 \
  --host 127.0.0.1 \
  --no-open
```

The local run launcher is intentionally disabled in this release, even when `--enable-actions` is provided.

## Troubleshooting

If the port is already in use, choose another port:

```bash
npx stacktest dashboard --port 4567
```

If no runs appear, run a test first:

```bash
npx stacktest run ./stacktest.yaml
```

Older run folders may show partial details if they only contain legacy report files.
