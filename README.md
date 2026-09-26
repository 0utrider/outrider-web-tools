# Outrider's Web Tools

Launches the tools from [Outrider's Pathfinder Tools](https://0utrider.github.io/pathfinder/) from inside Foundry VTT (v13 to v14). Each tool opens in its own browser popup. Built for **Pathfinder 2e** and **Starfinder 2e**.

## Features

| Tool | What it does |
|---|---|
| Ledge LOS | Line of sight between two creatures across a vertical ledge. |
| Challenge Calc | Organized Play Challenge Points and low/high level range for a table. |
| Downtime Income | Organized Play Earn Income for Pathfinder and Starfinder Society. |

### What the module adds

- **Macro compendium** (*Outrider's Web Tools Macros*) with one launcher macro per tool.
- **World macros and journal.** On first install and after each update, the GM's client copies the launchers into a *Outrider's Web Tools* macro folder and writes an *Outrider's Web Tools* journal with a description and launch link for each tool, then opens the journal for the GM. Both default to Observer, so players can use them. Module folders are created in the Outrider violet (`#7000d6`); a folder with no color gets it on update, and a color you pick yourself is kept. Ownership and folder changes you make are kept; the journal page text is rewritten on update.
- **Macro API**: `game.modules.get("outrider-web-tools").api.open("ledgeLOS")`. Tool ids: `ledgeLOS`, `challengeCalc`, `downtimeIncome`. `api.syncWorldContent()` restores the macros and journal on demand.

Popups open at a 16:10 size scaled to your screen (up to 1440x900), centered over the Foundry window. Popups must be allowed for your Foundry site. Players need the core *Use Script Macros* permission (on for Players by default).

## Install

Paste this manifest URL into **Add-on Modules → Install Module**:

```
https://github.com/0utrider/outrider-web-tools/releases/latest/download/module.json
```

## License

GPL-3.0-or-later. See [LICENSE](LICENSE).
