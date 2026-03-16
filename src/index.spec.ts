import crypto from "crypto";
import fs from "fs";
import os from "os";
import path from "path";

import browserslist from "browserslist";
import { resolveToEsbuildTarget } from "esbuild-plugin-browserslist";
import { rolldown } from "rolldown";
import { vi, describe, it } from "vitest";

import { resolveToRolldownTarget, rolldownPluginBrowserslist } from "./index.js";

const getFile = async (input: string): Promise<{ entryPoint: string; outdir: string }> => {
  const randomString = crypto.randomBytes(16).toString("hex");
  const entryPoint = path.join(os.tmpdir(), `${randomString}.js`);
  const outdir = path.join(os.tmpdir(), `${randomString}-out`);

  await fs.promises.writeFile(entryPoint, input, "utf8");
  await fs.promises.mkdir(outdir, { recursive: true });

  return { entryPoint, outdir };
};

describe.concurrent("resolveToRolldownTarget", () => {
  it("resolves a browserslist query to deduplicated target strings", ({ expect }) => {
    const result = resolveToRolldownTarget(browserslist(["chrome 87", "chrome 90", "firefox 88"]), {
      printUnknownTargets: false,
    });

    expect(result).toEqual(["chrome87", "firefox88"]);
  });

  it("resolves a default browserslist query", ({ expect }) => {
    const result = resolveToRolldownTarget(browserslist(), {
      printUnknownTargets: false,
    });

    expect(result.length).toBeGreaterThan(0);
    expect(result.every((t) => typeof t === "string")).toBe(true);
  });

  it("resolves ios_saf version ranges", ({ expect }) => {
    const result = resolveToRolldownTarget(browserslist(["ios_saf 13.4-13.7"]), {
      printUnknownTargets: false,
    });

    expect(result).toEqual(["ios13.4"]);
  });

  it("resolves a real-world browserslist config to deduplicated earliest versions", ({
    expect,
  }) => {
    const query =
      "> 0.20%, last 2 years, unreleased versions, not dead, not op_mini all, safari >= 12.2, iOS >= 12.2, not safari < 12.2, not iOS < 12.2";
    const resolved = browserslist(query);

    const esbuildResult = resolveToEsbuildTarget(resolved, {
      printUnknownTargets: false,
    });
    const rolldownResult = resolveToRolldownTarget(resolved, {
      printUnknownTargets: false,
    });

    // Every entry in the rolldown output should be present in the esbuild output
    for (const entry of rolldownResult) {
      expect(esbuildResult, `expected esbuild output to contain "${entry}"`).toContain(entry);
    }

    // Each engine should appear exactly once (deduplicated to earliest)
    const engines = rolldownResult.map((t) => t.replace(/[\d.]+$/, ""));
    expect(engines).toEqual([...new Set(engines)]);
  });

  it("logs unknown targets when printUnknownTargets is true", ({ expect }) => {
    const consoleSpy = vi.spyOn(console, "error");

    const result = resolveToRolldownTarget(["chrome 90", "op_mob all"], {
      printUnknownTargets: true,
    });

    expect(result).toEqual(["chrome90"]);
    expect(consoleSpy.mock.calls).toMatchInlineSnapshot(`
      [
        [
          "[rolldown-plugin-browserslist] Skipping unknown target: entry=op_mob all, browser=op_mob, version=1",
        ],
      ]
    `);
  });
});

describe.concurrent("rolldownPluginBrowserslist", () => {
  it("throws an error when a target is already set", async ({ expect }) => {
    const { entryPoint, outdir } = await getFile("");

    await expect(async () => {
      const bundle = await rolldown({
        input: entryPoint,
        transform: { target: "es2020" },
        plugins: [
          rolldownPluginBrowserslist([], {
            printUnknownTargets: false,
          }),
        ],
      });
      await bundle.write({ dir: outdir });
    }).rejects.toThrow(/cannot be used with a set target/);
  });

  it("builds correctly", async ({ expect }) => {
    await Promise.all(
      [
        {
          input: `export const x = foo?.bar;`,
          query: ["chrome 50"],
          shouldDownlevel: true,
        },
        {
          input: `export const x = foo?.bar;`,
          query: ["node 16"],
          shouldDownlevel: false,
        },
        {
          input: `export const x = foo?.bar;`,
          query: ["ios_saf 13.4-13.7"],
          shouldDownlevel: false,
        },
        {
          input: `export const x = foo?.bar;`,
          // i.e. default
          query: undefined,
          shouldDownlevel: false,
        },
      ].map(async ({ input, query, shouldDownlevel }) => {
        const { entryPoint, outdir } = await getFile(input);

        const bundle = await rolldown({
          input: entryPoint,
          plugins: [
            rolldownPluginBrowserslist(browserslist(query), {
              printUnknownTargets: false,
            }),
          ],
        });
        await bundle.write({ dir: outdir, format: "esm" });

        const files = await fs.promises.readdir(outdir);
        const outfile = files.find((f) => f.endsWith(".js"));
        if (outfile === undefined) {
          throw new Error(`No output file found in ${outdir}`);
        }
        const output = await fs.promises.readFile(path.join(outdir, outfile), "utf8");

        if (shouldDownlevel) {
          expect(output).not.toContain("?.");
        } else {
          expect(output).toContain("?.");
        }
      }),
    );
  });

  it("also logs in the usual way", async ({ expect }) => {
    const consoleSpy = vi.spyOn(console, "error");
    consoleSpy.mockClear();

    const { entryPoint, outdir } = await getFile("");
    const bundle = await rolldown({
      input: entryPoint,
      plugins: [
        rolldownPluginBrowserslist(["chrome 90", "op_mob all"], {
          printUnknownTargets: true,
        }),
      ],
    });
    await bundle.write({ dir: outdir });

    const pluginCalls = consoleSpy.mock.calls.filter(
      (call) => typeof call[0] === "string" && call[0].includes("[rolldown-plugin-browserslist]"),
    );
    expect(pluginCalls).toMatchInlineSnapshot(`
      [
        [
          "[rolldown-plugin-browserslist] Skipping unknown target: entry=op_mob all, browser=op_mob, version=1",
        ],
      ]
    `);
  });
});
