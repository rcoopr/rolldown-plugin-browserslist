# rolldown-plugin-browserslist

Configure [rolldown](https://rolldown.rs/)'s transform target based on a [browserslist](https://github.com/browserslist/browserslist) query.

Unlike esbuild which accepts multiple versions of the same browser, rolldown expects only the earliest version per engine. This plugin resolves a browserslist query and deduplicates the results to the minimum version per target.

## Installation

```sh
npm install --save-dev rolldown-plugin-browserslist rolldown browserslist
```

## Usage

```ts
import { rolldown } from "rolldown";
import browserslist from "browserslist";
import { rolldownPluginBrowserslist, resolveToRolldownTarget } from "rolldown-plugin-browserslist";

// As a plugin:
const bundle = await rolldown({
  input: "./foo/bar.ts",
  plugins: [
    rolldownPluginBrowserslist(browserslist("defaults"), {
      printUnknownTargets: false,
    }),
  ],
});

// Or standalone:
const target = resolveToRolldownTarget(browserslist("defaults"), {
  printUnknownTargets: false,
});

const bundle = await rolldown({
  input: "./foo/bar.ts",
  transform: { target },
});
```

## Caveats

- Only `edge`, `firefox`, `chrome`, `safari`, `ios_saf`, `opera`, and `node` have direct equivalents for rolldown targets.
- `android` and `and_chr` are mapped to the `chrome` target, and `and_ff` is mapped to the `firefox` target.
- All other browsers are ignored (`and_qq`, `samsung`, `op_mini`, `op_mob`, `ie`, `ie_mob`, `bb`, `baidu`, and `kaios`)

## Debugging

You can turn on debug logs (which will print all resolutions or failures) using `DEBUG=rolldown-plugin-browserslist`

## Credits

Based on [esbuild-plugin-browserslist](https://github.com/nihalgonsalves/esbuild-plugin-browserslist) by [Nihal Gonsalves](https://github.com/nihalgonsalves).

## License

MIT
