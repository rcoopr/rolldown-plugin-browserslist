import browserslist from "browserslist";
import { describe, it } from "vitest";

import { resolveToRolldownTarget } from "./resolveToRolldownTarget.js";
import { Engine } from "./types.js";

const useLogs = () => {
  const logs: string[] = [];
  const logFn = (log: string) => {
    logs.push(log);
  };

  return { logs, logFn };
};

describe.concurrent("resolveToRolldownTarget", () => {
  it("resolves browserlist versions to earliest per engine", ({ expect }) => {
    const { logs, logFn } = useLogs();

    const query = [
      "chrome 87",
      "chrome 90",
      "firefox 88",
      "firefox 91",
      "node 14.16.0",
      "ios_saf 14.0-14.4",
      "ios_saf 14.0-14.4",
      "opera 91",
    ];

    const result = resolveToRolldownTarget(browserslist(query, {}), logFn);
    expect(result).toMatchObject([
      { target: Engine.Chrome, version: "87" },
      { target: Engine.Firefox, version: "88" },
      { target: Engine.IOS, version: "14.0" },
      { target: Engine.Node, version: "14.16.0" },
      { target: Engine.Opera, version: "91" },
    ]);

    expect(logs).toEqual([]);
  });

  it("deduplicates to earliest version per engine", ({ expect }) => {
    const { logs, logFn } = useLogs();

    const result = resolveToRolldownTarget(
      ["chrome 90", "chrome 80", "chrome 95", "firefox 88", "firefox 85"],
      logFn,
    );

    expect(result).toEqual([
      { target: Engine.Chrome, version: "80" },
      { target: Engine.Firefox, version: "85" },
    ]);
    expect(logs).toEqual([]);
  });

  it("merges approximate mappings with exact ones", ({ expect }) => {
    const { logs, logFn } = useLogs();

    // android and and_chr both map to chrome
    const result = resolveToRolldownTarget(["chrome 90", "android 80", "and_chr 85"], logFn);

    expect(result).toEqual([{ target: Engine.Chrome, version: "80" }]);
    expect(logs).toEqual([]);
  });

  it("throws an error on no targets", ({ expect }) => {
    const { logs, logFn } = useLogs();

    const query = ["ie_mob 11"];

    expect(() => resolveToRolldownTarget(browserslist(query, {}), logFn)).toThrow(
      /Could not resolve/,
    );

    expect(logs).toMatchInlineSnapshot(`
      [
        "Skipping unknown target: entry=ie_mob 11, browser=ie_mob, version=11",
      ]
    `);
  });

  it("skips unmappable targets", ({ expect }) => {
    const { logs, logFn } = useLogs();

    const query = ["chrome 90", "ie_mob 11"];

    const result = resolveToRolldownTarget(browserslist(query, {}), logFn);

    expect(result).toEqual([{ target: Engine.Chrome, version: "90" }]);
    expect(logs).toMatchInlineSnapshot(`
      [
        "Skipping unknown target: entry=ie_mob 11, browser=ie_mob, version=11",
      ]
    `);
  });

  it("skips unknown targets", ({ expect }) => {
    const { logs, logFn } = useLogs();

    const result = resolveToRolldownTarget(
      [
        "chrome 90",
        "notABrowser 123",
        "chrome notAVersion",
        "chrome 1.2.3.4",
        "chrome 1.2.3.",
        "chrome 1.2.",
        "chrome 1.",
        "AaaAAaaAaa",
        "",
      ],
      logFn,
    );

    expect(result).toEqual([{ target: Engine.Chrome, version: "90" }]);
    expect(logs).toMatchInlineSnapshot(`
      [
        "Could not parse Browserslist result to a meaningful format. entry=notABrowser 123",
        "Could not parse Browserslist result to a meaningful format. entry=chrome notAVersion",
        "Could not parse Browserslist result to a meaningful format. entry=chrome 1.2.3.4",
        "Could not parse Browserslist result to a meaningful format. entry=chrome 1.2.3.",
        "Could not parse Browserslist result to a meaningful format. entry=chrome 1.2.",
        "Could not parse Browserslist result to a meaningful format. entry=chrome 1.",
        "Could not parse Browserslist result to a meaningful format. entry=AaaAAaaAaa",
        "Could not parse Browserslist result to a meaningful format. entry=",
      ]
    `);
  });
});
