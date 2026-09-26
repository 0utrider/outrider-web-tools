import { MODULE_ID, I18N, MACRO_PACK, WORLD_IDS, BRAND_COLOR } from "../constants.js";
import { featureSettings } from "../settings.js";
import { TOOLS, TAG_KINDS } from "../tools.js";
import { toolImg } from "../lib/launch.js";

/**
 * On first install and on every module version change, the active GM copies the
 * launcher macros from the compendium into the world and writes a tools journal.
 * New documents default to Observer so players can open and run them. Existing
 * documents keep their ownership and folder; only content is refreshed. The
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
  if (settings.get("syncedVersion") === version) return;
  await sync();
  await settings.set("syncedVersion", version);
  // Show the GM what was installed or changed.
  await game.journal.get(WORLD_IDS.journal)?.sheet.render({ force: true });
}

/**
 * Create the module folder with the brand color, or give an existing folder the
 * brand color if it has none. A color the GM picked is left alone.
 */
async function getOrCreateFolder(folderId, type, name) {
  const existing = game.folders.get(folderId);
  if (!existing) {
    await Folder.implementation.create({ _id: folderId, name, type, color: BRAND_COLOR }, { keepId: true });
  } else if (!existing.color) {
    await existing.update({ color: BRAND_COLOR });
  }
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

/** Sidebar tab icons (core Foundry) paired with where-to-find lines. */
const WHERE = [
  ["fa-solid fa-book-open", "Journal.WhereJournal"],
  ["fa-solid fa-code", "Journal.WhereMacros"],
  ["fa-solid fa-book-atlas", "Journal.WhereCompendium"],
];

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
    // Brand an existing module folder, but do not recreate one the GM removed.
    const folder = game.folders.get(WORLD_IDS.journalFolder);
    if (folder && !folder.color) await folder.update({ color: BRAND_COLOR });
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
