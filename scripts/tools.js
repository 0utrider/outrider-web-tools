/**
 * Tool catalog. Names and journal text live in lang/en.json under OWT.Tools.<i18n>.
 * Tags are keys under OWT.Tags.
 * Optional `popup` on a tool overrides any POPUP_DEFAULTS key, e.g.
 *   popup: { aspect: 4 / 3, maxWidth: 1100 }
 * Document ids are fixed (16 chars) so world copies and journal links stay stable
 * across updates. Changing a macroId orphans the existing world macro.
 */
export const TOOLS = [
  {
    id: "ledgeLOS",
    i18n: "LedgeLOS",
    path: "ledgecover/index.html",
    img: "img/ledgelos.webp",
    macroId: "owtMacroLedgeLOS",
    tags: ["PF2e", "SF2e", "Combat", "GM", "Players"],
  },
  {
    id: "challengeCalc",
    i18n: "ChallengeCalc",
    path: "challenge/index.html",
    img: "img/challenge.webp",
    macroId: "owtMacroChalCalc",
    tags: ["PFS2", "GM"],
  },
  {
    id: "downtimeIncome",
    i18n: "DowntimeIncome",
    path: "downtime/index.html",
    img: "img/downtime.webp",
    macroId: "owtMacroDowntime",
    tags: ["PFS2", "SFS2", "GM", "Players"],
  },
];

/** Tag color groups for the journal (CSS class owt-tag-<kind>). */
export const TAG_KINDS = {
  PF2e: "system", SF2e: "system", PFS2: "system", SFS2: "system",
  Combat: "topic",
  GM: "audience", Players: "audience",
};

export const TOOLS_BY_ID = new Map(TOOLS.map((t) => [t.id, t]));

/**
 * Popup sizing, in CSS pixels (OS display scaling already applied). The window is
 * the largest `aspect` box that fits inside widthPct x heightPct of the usable
 * screen, clamped to min/max, then centered over the Foundry window.
 */
export const POPUP_DEFAULTS = {
  aspect: 16 / 10,
  widthPct: 0.75,
  heightPct: 0.85,
  minWidth: 800,
  minHeight: 500,
  maxWidth: 1440,
  maxHeight: 900,
};
