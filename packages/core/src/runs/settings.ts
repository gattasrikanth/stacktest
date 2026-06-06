import * as fs from "fs";
import * as path from "path";
import { type DashboardSettings } from "./types.js";

export const defaultDashboardSettings: DashboardSettings = {
  port: 3456,
  runsDir: ".stacktest/runs",
  autoOpen: true,
  theme: "system",
  retentionWarningThreshold: 1000,
  enableExperimentalLauncher: false,
};

export function getDashboardSettingsPath(dataDir = ".stacktest"): string {
  return path.resolve(process.cwd(), dataDir, "dashboard", "settings.json");
}

export function readDashboardSettings(dataDir = ".stacktest"): DashboardSettings {
  const settingsPath = getDashboardSettingsPath(dataDir);
  if (!fs.existsSync(settingsPath)) {
    return { ...defaultDashboardSettings };
  }

  try {
    return {
      ...defaultDashboardSettings,
      ...(JSON.parse(fs.readFileSync(settingsPath, "utf8")) as Partial<DashboardSettings>),
    };
  } catch {
    return { ...defaultDashboardSettings };
  }
}

export function writeDashboardSettings(
  settings: Partial<DashboardSettings>,
  dataDir = ".stacktest",
): DashboardSettings {
  const next = {
    ...readDashboardSettings(dataDir),
    ...settings,
  };
  const settingsPath = getDashboardSettingsPath(dataDir);
  fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
  fs.writeFileSync(settingsPath, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  return next;
}
