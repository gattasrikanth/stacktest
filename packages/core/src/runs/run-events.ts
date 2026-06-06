import * as fs from "fs";
import * as path from "path";
import { type DashboardRunEvent } from "./types.js";

export function parseEventsJsonl(content: string): DashboardRunEvent[] {
  const events: DashboardRunEvent[] = [];
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    try {
      const parsed = JSON.parse(trimmed) as DashboardRunEvent;
      if (parsed && parsed.schemaVersion === "1.0" && parsed.runId && parsed.eventId) {
        events.push(parsed);
      }
    } catch {
      // Ignore malformed or partially-written JSONL records.
    }
  }
  return events;
}

export function readEventsFile(filePath: string): DashboardRunEvent[] {
  if (!fs.existsSync(filePath)) {
    return [];
  }
  return parseEventsJsonl(fs.readFileSync(filePath, "utf8"));
}

export function appendRunEvent(filePath: string, event: DashboardRunEvent): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.appendFileSync(filePath, `${JSON.stringify(event)}\n`, "utf8");
}

export function createRunEvent(
  runId: string,
  eventId: string,
  type: DashboardRunEvent["type"],
  timestamp: string,
  fields: Omit<Partial<DashboardRunEvent>, "schemaVersion" | "runId" | "eventId" | "type" | "timestamp"> = {},
): DashboardRunEvent {
  return {
    schemaVersion: "1.0",
    runId,
    eventId,
    type,
    timestamp,
    ...fields,
  };
}
