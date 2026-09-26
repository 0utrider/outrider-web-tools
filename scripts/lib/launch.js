import { I18N, TOOLS_BASE_URL } from "../constants.js";
import { TOOLS_BY_ID, POPUP_DEFAULTS } from "../tools.js";

export const toolUrl = (tool) => new URL(tool.path, TOOLS_BASE_URL).href;
export const toolImg = (tool) => new URL(tool.img, TOOLS_BASE_URL).href;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/** window.open features string sized to the user's screen, see POPUP_DEFAULTS. */
export function popupFeatures(tool) {
  const o = { ...POPUP_DEFAULTS, ...tool.popup };
  const { availWidth, availHeight } = window.screen;
  // Clamp height so both width and height limits hold without breaking the aspect.
  const lo = Math.max(o.minHeight, o.minWidth / o.aspect);
  const hi = Math.min(o.maxHeight, o.maxWidth / o.aspect);
  let h = clamp(Math.min(availHeight * o.heightPct, (availWidth * o.widthPct) / o.aspect), lo, hi);
  let w = h * o.aspect;
  // Never larger than the usable screen, even if the minimums say otherwise.
  w = Math.round(Math.min(w, availWidth));
  h = Math.round(Math.min(h, availHeight));
  // Center over the Foundry window so the popup opens on the same monitor.
  const left = Math.round(window.screenX + (window.outerWidth - w) / 2);
  const top = Math.round(window.screenY + (window.outerHeight - h) / 2);
  return `width=${w},height=${h},left=${left},top=${top}`;
}

/**
 * Open a tool in its own named popup. Each tool has a distinct window name, so
 * tools open side by side and a second click refocuses the existing window (size and position
 * are only applied when the window is first created).
 */
export function openTool(id) {
  const tool = TOOLS_BY_ID.get(id);
  if (!tool) {
    ui.notifications.warn(game.i18n.format(`${I18N}.Notify.UnknownTool`, { id }));
    return null;
  }
  const win = window.open(toolUrl(tool), `owt-${tool.id}`, popupFeatures(tool));
  if (!win) ui.notifications.warn(`${I18N}.Notify.PopupBlocked`, { localize: true });
  else win.focus();
  return win;
}
