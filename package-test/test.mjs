import assert from "assert";

import { rolldownPluginBrowserslist, resolveToRolldownTarget } from "rolldown-plugin-browserslist";

assert.strictEqual(rolldownPluginBrowserslist().name, "rolldown-plugin-browserslist");
assert.strictEqual(resolveToRolldownTarget(["chrome 90"])[0], "chrome90");
