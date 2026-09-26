import { MODULE_ID, I18N, MACRO_PACK, WORLD_IDS } from "../constants.js";
import { featureSettings } from "../settings.js";
import { TOOLS } from "../tools.js";
import { toolImg } from "../lib/launch.js";

/**
 * On first install and on every module version change, the active GM copies the
 * launcher macros from the compendium into the world and writes a tools journal.
 * New documents default to Observer so players can open and run them. Existing
 * documents keep their ownership and folder; only content is refreshed.
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
  if (settings.get("syncedVersion") === version) return;
  await sync();
  await settings.set("syncedVersion", version);
}

async function getOrCreateFolder(folderId, type, name) {
  if (game.folders.get(folderId)) return folderId;
  await Folder.implementation.create({ _id: folderId, name, type }, { keepId: true });
  return folderId;
}

async function syncMacros() {
  const pack = game.packs.get(MACRO_PACK);
  if (!pack) throw new Error(`compendium ${MACRO_PACK} not found`);
  const folder = await getOrCreateFolder(WORLD_IDS.macroFolder, "Macro", t("Title"));
  for (const tool of TOOLS) {
    const source = await pack.getDocument(tool.macroId);
    if (!source) continue;
    const existing = game.macros.get(tool.macroId);
    const { name, type, command, img } = source;
    if (existing) {
      await existing.update({ name, type, command, img });
    } else {
      await game.macros.importFromCompendium(
        pack,
        tool.macroId,
        { folder, ownership: { default: OBSERVER } },
        { keepId: true },
      );
    }
  }
}

function journalHtml() {
  const sections = TOOLS.map((tool) => {
    const name = t(`Tools.${tool.i18n}.Name`);
    return [
      `<h2>${name}</h2>`,
      `<p><img src="${toolImg(tool)}" width="64" height="64" style="float:left;margin:0 8px 4px 0;border:none">`,
      `${t(`Tools.${tool.i18n}.Description`)}</p>`,
      `<p>@UUID[Macro.${tool.macroId}]{${game.i18n.format(`${I18N}.Journal.Launch`, { name })}}</p>`,
      `<hr>`,
    ].join("");
  });
  return `<p>${t("Journal.Intro")}</p><hr>${sections.join("")}<p>${t("Journal.Footer")}</p>`;
}

async function syncJournal() {
  const name = t("Title");
  const page = { _id: WORLD_IDS.journalPage, name, type: "text", text: { content: journalHtml() } };
  const existing = game.journal.get(WORLD_IDS.journal);
  if (existing) {
    if (existing.pages.has(WORLD_IDS.journalPage)) {
      await existing.updateEmbeddedDocuments("JournalEntryPage", [page]);
    } else {
      await existing.createEmbeddedDocuments("JournalEntryPage", [page], { keepId: true });
    }
    return;
  }
  const folder = await getOrCreateFolder(WORLD_IDS.journalFolder, "JournalEntry", name);
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
