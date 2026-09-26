/**
 * Tool catalog. Names and descriptions live in lang/en.json under OWT.Tools.<id>.
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
  },
  {
    id: "challengeCalc",
    i18n: "ChallengeCalc",
    path: "challenge/index.html",
    img: "img/challenge.webp",
    macroId: "owtMacroChalCalc",
  },
  {
    id: "downtimeIncome",
    i18n: "DowntimeIncome",
    path: "downtime/index.html",
    img: "img/downtime.webp",
    macroId: "owtMacroDowntime",
  },
];

export const TOOLS_BY_ID = new Map(TOOLS.map((t) => [t.id, t]));

export const POPUP_FEATURES = "width=1200,height=1000";
