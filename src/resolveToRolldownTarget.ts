import { z } from "zod";

import { BrowserslistEngineMapping, BrowserslistKind, type Engine } from "./types.js";
import { dbg } from "./util.js";

const BrowserSchema = z.enum(BrowserslistKind);
/** 123 or 123.456 or 123.456.789 */
const VersionSchema = z.string().regex(/^(\d+\.\d+\.\d+|\d+\.\d+|\d+)$/);

/**
 * Compare two version strings numerically.
 * Returns negative if a < b, positive if a > b, 0 if equal.
 */
const compareVersions = (a: string, b: string): number => {
  const aParts = a.split(".").map(Number);
  const bParts = b.split(".").map(Number);
  const len = Math.max(aParts.length, bParts.length);

  for (let i = 0; i < len; i++) {
    const diff = (aParts[i] ?? 0) - (bParts[i] ?? 0);
    if (diff !== 0) return diff;
  }

  return 0;
};

export const resolveToRolldownTarget = (
  browserlist: string[],
  logFn: (msg: string) => void,
): { target: Engine; version: string }[] => {
  const allTargets = browserlist
    .map((entry) => {
      const [rawBrowser, rawVersionOrRange] = entry.split(" ");

      const rawVersionNormalized = rawVersionOrRange
        // e.g. 13.4-13.7, take the lower range
        ?.replace(/-[\d.]+$/, "")
        // all => replace with 1
        .replace("all", "1");

      const browserResult = BrowserSchema.safeParse(rawBrowser);
      const versionResult = VersionSchema.safeParse(rawVersionNormalized);

      dbg("Got result for entry=%s: %j", entry, {
        rawBrowser,
        rawVersionOrRange,
        rawVersionNormalized,
        browserResult,
        versionResult,
      });

      if (!browserResult.success || !versionResult.success) {
        logFn(`Could not parse Browserslist result to a meaningful format. entry=${entry}`);
        return undefined;
      }

      const { data: browser } = browserResult;
      const { data: version } = versionResult;

      const engineTarget = BrowserslistEngineMapping[browser];

      dbg("Got target for entry=%s: %s", entry, engineTarget);

      if (engineTarget === undefined) {
        logFn(`Skipping unknown target: entry=${entry}, browser=${browser}, version=${version}`);
        return undefined;
      }

      return { target: engineTarget, version };
    })
    .filter((x): x is NonNullable<typeof x> => x != null);

  if (allTargets.length === 0) {
    throw new Error("Could not resolve any targets");
  }

  // Keep only the earliest (lowest) version per engine
  const earliest = new Map<Engine, string>();
  for (const { target, version } of allTargets) {
    const existing = earliest.get(target);
    if (existing === undefined || compareVersions(version, existing) < 0) {
      earliest.set(target, version);
    }
  }

  return [...earliest.entries()].map(([target, version]) => ({ target, version }));
};
