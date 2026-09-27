import { MODULE_ID, I18N, MACRO_PACK, WORLD_IDS, BRAND_COLOR } from "../constants.js";
import { featureSettings } from "../settings.js";
import { TOOLS, TAG_KINDS } from "../tools.js";
import { toolImg } from "../lib/launch.js";

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
  if (settings.get("syncedVersion") === version) return;
  await sync();
  await settings.set("syncedVersion", version);
  // Show the GM what was installed or changed.
  await game.journal.get(WORLD_IDS.journal)?.sheet.render({ force: true });
}

/**
 * Create the module folder with the brand color, or refresh an existing one: name
 * follows the current label (same as macro content below), color only applies if
 * the folder has none. A color the GM picked is left alone.
 */
async function getOrCreateFolder(folderId, type, name) {
  const existing = game.folders.get(folderId);
  if (!existing) {
    await Folder.implementation.create({ _id: folderId, name, type, color: BRAND_COLOR }, { keepId: true });
  } else {
    const patch = {};
    if (!existing.color) patch.color = BRAND_COLOR;
    if (existing.name !== name) patch.name = name;
    if (Object.keys(patch).length) await existing.update(patch);
  }
  return folderId;
}

/**
 * Foundry creates the compendium folder from module.json `packFolders` once and
 * never applies later manifest changes (a color added after first install is lost).
 * Brand it here, only if it is still the module's own folder and has no color.
 */
async function brandPackFolder(pack) {
  const folder = pack.folder;
  if (!folder || folder.color) return;
  const own = Array.from(game.modules.get(MODULE_ID).packFolders ?? []).some((f) => f.name === folder.name);
  if (own) await folder.update({ color: BRAND_COLOR });
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
  await brandPackFolder(pack);
  const folder = await getOrCreateFolder(WORLD_IDS.macroFolder, "Macro", t("Title"));
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
    // Brand an existing module folder, but do not recreate one the GM removed.
    const folder = game.folders.get(WORLD_IDS.journalFolder);
    if (folder && !folder.color) await folder.update({ color: BRAND_COLOR });
    if (existing.name !== name) await existing.update({ name });
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
