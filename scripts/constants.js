export const MODULE_ID = "outrider-web-tools";

/** i18n root key, every string lives under OWT.* */
export const I18N = "OWT";

export const SUPPORTED_SYSTEMS = ["pf2e", "sf2e"];

/** Base URL of the hosted tool pages. */
export const TOOLS_BASE_URL = "https://0utrider.github.io/pathfinder/";

/** Compendium pack holding the launcher macros (module.json "packs"). */
export const MACRO_PACK = `${MODULE_ID}.outrider-web-tools-macros`;

/**
 * Fixed ids for world documents the module creates. The two folder ids are legacy
 * (v1.0.4 flattened everything into "Outrider's Mods"); kept so the sync can retire them.
 */
export const WORLD_IDS = {
  macroFolder: "owtFolderMacros0",
  journalFolder: "owtFolderJournal",
  journal: "owtJournalTools0",
  journalPage: "owtJournalPage00",
};

/** Outrider module family brand color (Electric Violet Deep). Folder headers and journal accents. */
export { BRAND_COLOR } from "./lib/outrider-mods.js";

/** Every name the module's old per-module compendium folder has had; retired on sync. */
export const MODULE_FOLDER_NAMES = ["Web Tools", "Outrider's Web Tools"];
