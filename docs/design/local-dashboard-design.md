# Local Dashboard Design

Status: Implemented MVP + live viewer.

The Local Dashboard is a local-only web UI served by `stacktest dashboard`. It reads run artifacts from `.stacktest/runs`, shows historical and active runs, streams event updates over Server-Sent Events, and never uploads run data.

The original raw implementation plan is kept in `docs/raw-requirements/stacktest-local-dashboard-design.md`. The implemented scope is the read-only dashboard plus live event viewer. The browser-based test launcher remains planned and disabled.
