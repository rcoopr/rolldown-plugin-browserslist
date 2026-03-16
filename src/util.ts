import debug from "debug";

export const PLUGIN_NAME = "rolldown-plugin-browserslist";

export const log = (msg: string): void => {
  console.error(`[${PLUGIN_NAME}] ${msg}`);
};

export const dbg = debug(PLUGIN_NAME);
