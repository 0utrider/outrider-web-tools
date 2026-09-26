import { MODULE_ID, SUPPORTED_SYSTEMS } from "./constants.js";
import { FEATURES } from "./features/index.js";

const log = (...args) => console.log(`${MODULE_ID} |`, ...args);

function runPhase(phase) {
  const fail = (feature, err) =>
    console.error(`${MODULE_ID} | feature "${feature.id}" failed during ${phase}`, err);
  for (const feature of FEATURES) {
    try {
      // ready() may be async (world-content sync); catch rejections too.
      Promise.resolve(feature[phase]?.()).catch((err) => fail(feature, err));
    } catch (err) {
      fail(feature, err);
    }
  }
}

Hooks.once("init", () => {
  if (!SUPPORTED_SYSTEMS.includes(game.system.id)) {
    console.warn(`${MODULE_ID} | unsupported system "${game.system.id}", features disabled`);
    FEATURES.length = 0;
    return;
  }
  // Public API for macros: game.modules.get("outrider-web-tools").api
  game.modules.get(MODULE_ID).api = {};
  runPhase("init");
  log(`initialized ${FEATURES.length} feature(s): ${FEATURES.map((f) => f.id).join(", ")}`);
});

Hooks.once("ready", () => {
  if (!FEATURES.length) return;
  runPhase("ready");
});
