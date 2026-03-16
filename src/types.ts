/**
 * From: https://github.com/ben-eb/caniuse-lite/blob/v1.0.30001218/data/browsers.js
 *
 * License:
 *
 * """
 * The data in this repo is available for use under a CC BY 4.0 license (http://creativecommons.org/licenses/by/4.0).
 * For attribution just mention somewhere that the source is caniuse.com.
 * If you have any questions about using the data for your project please contact me here: http://a.deveria.com/contact
 * """
 */
export enum BrowserslistKind {
  Edge = "edge",
  Firefox = "firefox",
  Chrome = "chrome",
  Safari = "safari",
  iOS = "ios_saf",
  Android = "android",
  AndroidChrome = "and_chr",
  AndroidFirefox = "and_ff",
  AndroidUC = "and_uc",
  AndroidQQ = "and_qq",
  Samsung = "samsung",
  Opera = "opera",
  OperaMini = "op_mini",
  OperaMobile = "op_mob",
  IE = "ie",
  IEMobile = "ie_mob",
  BlackBerry = "bb",
  Baidu = "baidu",
  Kaios = "kaios",
  Node = "node",
}

/** https://rolldown.rs/reference/Interface.TransformOptions (uses esbuild-compatible target strings) */
export enum Engine {
  Chrome = "chrome",
  Deno = "deno",
  Edge = "edge",
  ES = "es",
  Firefox = "firefox",
  Hermes = "hermes",
  IE = "ie",
  IOS = "ios",
  Node = "node",
  Opera = "opera",
  Rhino = "rhino",
  Safari = "safari",
}

export const BrowserslistEngineMapping: Partial<Record<BrowserslistKind, Engine>> = {
  // exact map
  [BrowserslistKind.Edge]: Engine.Edge,
  [BrowserslistKind.Firefox]: Engine.Firefox,
  [BrowserslistKind.Chrome]: Engine.Chrome,
  [BrowserslistKind.Safari]: Engine.Safari,
  [BrowserslistKind.iOS]: Engine.IOS,
  [BrowserslistKind.Node]: Engine.Node,
  [BrowserslistKind.IE]: Engine.IE,
  [BrowserslistKind.Opera]: Engine.Opera,
  // approximate mapping
  [BrowserslistKind.Android]: Engine.Chrome,
  [BrowserslistKind.AndroidChrome]: Engine.Chrome,
  [BrowserslistKind.AndroidFirefox]: Engine.Firefox,
  // the rest have no equivalent
};
