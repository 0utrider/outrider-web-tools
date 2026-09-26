import { I18N, TOOLS_BASE_URL } from "../constants.js";
import { TOOLS_BY_ID, POPUP_FEATURES } from "../tools.js";

export const toolUrl = (tool) => new URL(tool.path, TOOLS_BASE_URL).href;
export const toolImg = (tool) => new URL(tool.img, TOOLS_BASE_URL).href;

/**
 * Open a tool in its own named popup. Each tool has a distinct window name, so
 * tools open side by side and a second click refocuses the existing window.
 */
export function openTool(id) {
  const tool = TOOLS_BY_ID.get(id);
  if (!tool) {
    ui.notifications.warn(game.i18n.format(`${I18N}.Notify.UnknownTool`, { id }));
    return null;
  }
  const win = window.open(toolUrl(tool), `owt-${tool.id}`, POPUP_FEATURES);
  if (!win) ui.notifications.warn(`${I18N}.Notify.PopupBlocked`, { localize: true });
  else win.focus();
  return win;
}
