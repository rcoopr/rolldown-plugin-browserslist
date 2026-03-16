// oxlint-disable typescript/no-require-imports

const {
  rolldownPluginBrowserslist,
  resolveToRolldownTarget,
} = require("rolldown-plugin-browserslist");
const assert = require("assert");

assert.strictEqual(rolldownPluginBrowserslist().name, "rolldown-plugin-browserslist");
assert.strictEqual(resolveToRolldownTarget(["chrome 90"])[0], "chrome90");
