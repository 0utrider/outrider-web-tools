import { MODULE_ID } from "../constants.js";
import { TOOLS } from "../tools.js";
import { openTool } from "../lib/launch.js";

export const id = "launcher";

export function init() {
  const api = game.modules.get(MODULE_ID).api;
  api.open = openTool;
  api.tools = TOOLS.map((t) => t.id);
}
