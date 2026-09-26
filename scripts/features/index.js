/**
 * Feature registry. Each feature module exports:
 *   id        - settings namespace (camelCase)
 *   init()    - register settings, menus, API (runs on Foundry `init`)
 *   ready()   - optional; hooks / runtime setup (runs on `ready`)
 *
 * Add a feature: create features/<name>.js, import it here, append to FEATURES.
 * Order here = order in the settings menu AND hook registration order.
 */
export const FEATURES = [];
