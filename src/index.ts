import type { Plugin } from "rolldown";

import { resolveToRolldownTarget as resolveToRolldownTarget_ } from "./resolveToRolldownTarget.js";
import { dbg, log, PLUGIN_NAME } from "./util.js";

export type Opts = { printUnknownTargets: boolean };

export const resolveToRolldownTarget = (browserlist: string[], opts?: Opts): string[] => {
  const printUnknownTargets = opts?.printUnknownTargets ?? true;

  return resolveToRolldownTarget_(browserlist, printUnknownTargets ? log : dbg).map(
    ({ target, version }) => `${target}${version}`,
  );
};

export const rolldownPluginBrowserslist = (browserlist: string[], opts?: Opts): Plugin => ({
  name: PLUGIN_NAME,
  options(options) {
    const existingTarget = options.transform?.target;
    if (existingTarget !== undefined) {
      dbg("Got transform.target=%s, expected=<falsey>", existingTarget);
      throw new Error(`${PLUGIN_NAME} cannot be used with a set target`);
    }

    const resolvedTargets = resolveToRolldownTarget(browserlist, opts);

    dbg("Resolved targets: %j", resolvedTargets);

    options.transform = {
      ...options.transform,
      target: resolvedTargets,
    };

    return options;
  },
});
