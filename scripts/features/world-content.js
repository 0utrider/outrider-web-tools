import { MODULE_ID, I18N, MACRO_PACK, WORLD_IDS, MODULE_FOLDER_NAMES } from "../constants.js";
import { featureSettings } from "../settings.js";
import { TOOLS, TAG_KINDS } from "../tools.js";
import { toolImg } from "../lib/launch.js";
import {
  getOrCreateSharedRoot,
  packsNeedPlacement,
  retireModuleFolder,
  syncModulePacks,
} from "../lib/outrider-mods.js";

/**
 * On first install and on every module version change, the active GM copies the
 * launcher macros from the compendium into the world and writes a tools journal.
 * New documents default to Observer so players can open and run them. Existing
 * documents keep their folder and the GM's ownership choice; only content is refreshed. The
 * journal then opens for that GM.
 */
export const id = "worldContent";

const settings = featureSettings(id, "WorldContent");
const OBSERVER = CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER;
const t = (key) => game.i18n.localize(`${I18N}.${key}`);

export function init() {
  settings.register("syncedVersion", { type: String, default: "", config: false });
  game.modules.get(MODULE_ID).api.syncWorldContent = sync;
}

export async function ready() {
  if (!game.users.activeGM?.isSelf) return;
  const version = game.modules.get(MODULE_ID).version;
  const updated = settings.get("syncedVersion") !== version;
  // Self-heal: also resync if the pack has lost its folder (GM deleted Outrider's Mods, or a
  // remove+reinstall at the same version, which the version gate alone never catches).
  if (!updated && !packsNeedPlacement(MODULE_ID)) return;
  await sync();
  await settings.set("syncedVersion", version);
  // Show the GM what was installed or changed, but not on a self-heal-only run.
  if (updated) await game.journal.get(WORLD_IDS.journal)?.sheet.render({ force: true });
}

/**
 * Flag marking that this module has applied its default (Observer) ownership to a
 * macro. v1.0.1 and earlier created macros with default ownership NONE because
 * importFromCompendium drops `ownership` from its update data (v14). Macros without
 * the flag get Observer once; after that the GM's ownership choice is kept.
 */
const OWNERSHIP_FLAG = "defaultOwnershipApplied";

async function syncMacros() {
  const pack = game.packs.get(MACRO_PACK);
  if (!pack) throw new Error(`compendium ${MACRO_PACK} not found`);
  // Flat layout: pack and macros sit directly in "Outrider's Mods" (no per-module subfolder).
  await syncModulePacks(MODULE_ID, { folderNames: MODULE_FOLDER_NAMES });
  await retireModuleFolder(WORLD_IDS.macroFolder, "Macro");
  const folder = await getOrCreateSharedRoot("Macro");
  const flags = { [MODULE_ID]: { [OWNERSHIP_FLAG]: true } };
  for (const tool of TOOLS) {
    const source = await pack.getDocument(tool.macroId);
    if (!source) continue;
    const existing = game.macros.get(tool.macroId);
    const { name, type, command, img } = source;
    if (existing) {
      const update = { name, type, command, img };
      if (!existing.getFlag(MODULE_ID, OWNERSHIP_FLAG)) {
        update["ownership.default"] = OBSERVER;
        update.flags = flags;
      }
      await existing.update(update);
    } else {
      // Build the data directly: importFromCompendium ignores ownership in its update data.
      const data = game.macros.fromCompendium(source, { keepId: true });
      Object.assign(data, { folder, ownership: { default: OBSERVER }, flags });
      await Macro.implementation.create(data, { keepId: true });
    }
  }
}

/** Sidebar tab icons (core Foundry) paired with where-to-find lines. */
const WHERE = [
  ["fa-solid fa-book-open", "Journal.WhereJournal"],
  ["fa-solid fa-code", "Journal.WhereMacros"],
  ["fa-solid fa-book-atlas", "Journal.WhereCompendium"],
];

/** "Get this module" block: repo link comes from module.json. */
function getModuleHtml() {
  const mod = game.modules.get(MODULE_ID);
  const repo = mod.url;
  const label = repo.replace(/^https?:\/\//, "");
  return `<div class="owt-where owt-get">
<p class="owt-where-title">${t("Journal.GetTitle")}</p>
<ul>
<li><i class="fa-brands fa-github"></i> ${t("Journal.GetRepo")} <a href="${repo}" target="_blank" rel="noopener">${label}</a></li>
</ul>
</div>`;
}

function journalHtml() {
  const cards = TOOLS.map((tool) => {
    const key = `Tools.${tool.i18n}`;
    const name = t(`${key}.Name`);
    const tags = tool.tags
      .map((tag) => `<span class="owt-tag-${TAG_KINDS[tag] ?? "topic"} owt-tag-${tag.toLowerCase()}">${t(`Tags.${tag}`)}</span>`)
      .join("");
    const launch = game.i18n.format(`${I18N}.Journal.Launch`, { name });
    return `<div class="owt-tool">
<img class="owt-icon" src="${toolImg(tool)}" alt="">
<div class="owt-body">
<h2>${name}</h2>
<p class="owt-tags">${tags}</p>
<p class="owt-summary">${t(`${key}.Summary`)}</p>
<p class="owt-launch">@UUID[Macro.${tool.macroId}]{${launch}}</p>
</div>
</div>`;
  });
  return `<div class="owt-journal">
<div class="owt-where">
<p class="owt-where-title">${t("Journal.WhereTitle")}</p>
<ul>${WHERE.map(([icon, key]) => `<li><i class="${icon}"></i> ${t(key)}</li>`).join("")}</ul>
</div>
<div class="owt-intro"><p>${t("Journal.Intro")}</p><p>${t("Journal.IntroHotbar")}</p></div>
${cards.join("\n")}
${getModuleHtml()}
<p class="owt-footer">${t("Journal.Footer")}</p>
</div>`;
}

async function syncJournal() {
  const name = t("Title");
  const page = {
    _id: WORLD_IDS.journalPage,
    name,
    type: "text",
    title: { show: false },
    text: { content: journalHtml() },
  };
  const existing = game.journal.get(WORLD_IDS.journal);
  if (existing) {
    // Journal stays where it is, unless it is still in the old per-module folder.
    await retireModuleFolder(WORLD_IDS.journalFolder, "JournalEntry");
    if (existing.name !== name) await existing.update({ name });
    if (existing.pages.has(WORLD_IDS.journalPage)) {
      await existing.updateEmbeddedDocuments("JournalEntryPage", [page]);
    } else {
      await existing.createEmbeddedDocuments("JournalEntryPage", [page], { keepId: true });
    }
    return;
  }
  await retireModuleFolder(WORLD_IDS.journalFolder, "JournalEntry");
  const folder = await getOrCreateSharedRoot("JournalEntry");
  await JournalEntry.implementation.create(
    { _id: WORLD_IDS.journal, name, folder, ownership: { default: OBSERVER }, pages: [page] },
    { keepId: true },
  );
}

async function sync() {
  await syncMacros();
  await syncJournal();
  ui.notifications.info(`${I18N}.Notify.Synced`, { localize: true });
}
