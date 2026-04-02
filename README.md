# 🎰 buddy-reroll

Interactive Claude Code `/buddy` companion reroller — choose your species, rarity, eyes, hat, and shiny, then brute-force the salt and patch.

互動式 Claude Code `/buddy` 寵物刷初始工具 — 選擇物種、稀有度、眼睛、帽子、閃光，暴力搜尋 salt 直接 patch。

## Preview / 預覽

```
  1.🦆 鴨子 duck       2.🪿 鵝 goose        3.🫧 史萊姆 blob     4.🐱 貓 cat          5.🐉 龍 dragon       6.🐙 章魚 octopus
      __                    (·>              .----.              /\_/\              /^\  /^\             .----.
    <(· )___                ||              ( ·  · )            ( ·   ·)           <  ·  ·  >           ( ·  · )
     (  ._>               _(__)_            (      )            (  ω  )            (   ~~   )           (______)
      `--´                 ^^^^              `----´             (")_(")             `-vvvv-´            /\/\/\/\

  7.🦉 貓頭鷹 owl       8.🐧 企鵝 penguin    9.🐢 烏龜 turtle    10.🐌 蝸牛 snail     11.👻 幽靈 ghost     12.🦎 六角恐龍 axolotl
     /\  /\                .---.              _,--._             ·    .--.            .----.           }~(______)~{
    ((·)(·))               (·>·)             ( ·  · )             \  ( @ )           / ·  · \          }~(· .. ·)~{
    (  ><  )              /(   )\           /[______]\             \_`--´            |      |            ( .--. )
     `----´                `---´             ``    ``            ~~~~~~~             ~`~``~`~            (_/  \_)

 13.🦫 水豚 capybara   14.🌵 仙人掌 cactus  15.🤖 機器人 robot  16.🐰 兔子 rabbit    17.🍄 蘑菇 mushroom  18.🐷 胖胖獸 chonk
    n______n            n  ____  n             .[||].              (\__/)            .-o-OO-o-.            /\    /\
   ( ·    · )           | |·  ·| |            [ ·  · ]            ( ·  · )          (__________)          ( ·    · )
   (   oo   )           |_|    |_|            [ ==== ]           =(  ..  )=            |·  ·|             (   ..   )
    `------´              |    |              `------´            (")__(")              |____|              `------´
```

## Combinations / 組合

| Category | Options | Count |
|----------|---------|-------|
| 🧬 Species / 物種 | duck, goose, blob, cat, dragon, octopus, owl, penguin, turtle, snail, ghost, axolotl, capybara, cactus, robot, rabbit, mushroom, chonk | 18 |
| ⭐ Rarity / 稀有度 | common (60%), uncommon (25%), rare (10%), epic (4%), legendary (1%) | 5 |
| 👁️ Eyes / 眼睛 | `·` `✦` `×` `◉` `@` `°` | 6 |
| 🎩 Hat / 帽子 | none, crown, tophat, propeller, halo, wizard, beanie, tinyduck | 8 |
| ✨ Shiny / 閃光 | yes / no (1% natural chance) | 2 |

**Total unique combos / 總組合數：8,640**

## Install / 安裝

### Prerequisites / 前置需求

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code)
- [Bun](https://bun.sh) runtime (required for `Bun.hash`)

### Quick Install / 一鍵安裝

```bash
git clone https://github.com/gannasong/buddy-reroll.git
cd buddy-reroll
./install.sh
```

### Manual Install / 手動安裝

```bash
cp buddy-reroll.js ~/.claude/scripts/
cp buddy-reroll.md ~/.claude/commands/
```

## Usage / 使用

Type in Claude Code:
在 Claude Code 裡輸入：

```
/buddy-reroll
```

The interactive flow guides you through:
互動式流程引導你：

1. 🧬 Pick species / 選物種 (18 ASCII art matrix)
2. ⭐ Pick rarity / 選稀有度
3. 👁️ Pick eyes / 選眼睛 (live preview on your species)
4. 🎩 Pick hat / 選帽子 (live preview)
5. ✨ Pick shiny / 選閃光
6. 📋 Dry run preview / 預覽屬性
7. 🔧 Confirm → patch / 確認 → 執行

### CLI Mode / 命令列模式

```bash
# Check current buddy / 查看目前的 buddy
bun ~/.claude/scripts/buddy-reroll.js --current

# Target specific combo / 直接指定目標
bun ~/.claude/scripts/buddy-reroll.js --species capybara --rarity legendary --eye "◉" --shiny

# Preview only / 預覽不修改
bun ~/.claude/scripts/buddy-reroll.js --dry --species dragon --rarity epic

# Restore original / 還原
bun ~/.claude/scripts/buddy-reroll.js --restore

# List all options / 列出所有選項
bun ~/.claude/scripts/buddy-reroll.js --list
```

## How it Works / 原理

`/buddy` uses `accountUuid + salt` with Mulberry32 PRNG to determine your companion. The salt `"friend-2026-401"` is hardcoded in the Claude Code binary.

`/buddy` 用 `accountUuid + salt` 跑 Mulberry32 PRNG 決定你的寵物。salt `"friend-2026-401"` 硬編碼在 Claude Code 二進位檔裡。

This tool brute-forces a new salt that produces your desired combo, then patches it into the binary.

這個工具暴力搜尋一個新的 salt 讓 PRNG 算出你想要的組合，然後 patch 到二進位檔。

- ✅ Local-only modification, no account changes / 純本地修改，不動帳號
- ✅ Auto-backup of original binary / 自動備份原始二進位檔
- ✅ macOS ad-hoc codesign / macOS 自動簽名
- ⚠️ Need to re-run after Claude Code updates / Claude Code 更新後需要重刷

## Credits / 致謝

Algorithm reference: [grayashh/buddy-reroll](https://github.com/grayashh/buddy-reroll). This project is a zero-dependency standalone reimplementation + Claude Code skill wrapper.

演算法參考自 [grayashh/buddy-reroll](https://github.com/grayashh/buddy-reroll)，本專案為零外部依賴的獨立實作 + Claude Code skill 互動式封裝。

## License

MIT
