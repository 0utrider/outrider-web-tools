# Outrider's Web Tools

<div align="center">

[![Part of Outrider's Pathfinder Tools](https://img.shields.io/badge/Part%20of-Outrider%27s%20Pathfinder%20Tools-7000d6?style=for-the-badge)](https://github.com/0utrider/pathfinder)

</div>

Launches the tools from [Outrider's Pathfinder Tools](https://0utrider.github.io/pathfinder/) from inside Foundry VTT (v13 to v14). Each tool opens in its own browser popup. Built for **Pathfinder 2e** and **Starfinder 2e**.

## Features

| Tool | What it does |
|---|---|
| Ledge LOS | Line of sight between two creatures across a vertical ledge. |
| Challenge Calc | Organized Play Challenge Points and low/high level range for a table. |
| Downtime Income | Organized Play Earn Income for Pathfinder and Starfinder Society. |

### What the module adds

- **Macro compendium** (*Web Tools Macros*) with one launcher macro per tool.
- **World macros and journal.** On first install and after each update, the GM's client copies the launchers into the shared *Outrider's Mods* macro folder and writes a *Web Tools* journal (also in *Outrider's Mods*) with a description and launch link for each tool plus a link to this repo, then opens the journal for the GM. Both default to Observer, so players can use them. The macros, journal and compendium pack sit directly in each tab's shared *Outrider's Mods* folder (Outrider violet, `#7000d6`), shared by every Outrider module with no per-module subfolders; older *Web Tools* folders are emptied into it and removed on update. Ownership and folder changes you make are kept; the journal page text is rewritten on update.
- **Macro API**: `game.modules.get("outrider-web-tools").api.open("ledgeLOS")`. Tool ids: `ledgeLOS`, `challengeCalc`, `downtimeIncome`. `api.syncWorldContent()` restores the macros and journal on demand.

Popups open at a 16:10 size scaled to your screen (up to 1440x900), centered over the Foundry window. Popups must be allowed for your Foundry site. Players need the core *Use Script Macros* permission (on for Players by default).

## Install

Paste this manifest URL into **Add-on Modules → Install Module**:

```
https://github.com/0utrider/outrider-web-tools/releases/latest/download/module.json
```

## License

GPL-3.0-or-later. See [LICENSE](LICENSE).
