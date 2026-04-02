🎰 Interactive Buddy Reroller / 互動式 Buddy 重刷工具 — Choose your ideal Claude Code /buddy companion species, rarity, appearance, brute-force the matching salt and patch the binary. / 選擇你理想的 Claude Code /buddy 夥伴物種、稀有度、外觀，暴力搜尋匹配的 salt 並 patch 到二進位檔。

## Round 1 — Show current buddy + all options in ONE message

First, run this command to check the current buddy:
```
bun ~/.claude/scripts/buddy-reroll.js --current
```

Then output EVERYTHING below in a single message:

### 🐾 Current Buddy

Show the --current result, then add a short roast (毒舌吐槽) about the current buddy. Be playful and savage — mock its weakest stat, judge its rarity. Keep it to 1-2 sentences, end with motivation to reroll.

### 🧬 Species / 物種 (1-18)

Print this EXACT species matrix (do NOT modify the ASCII art):

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

### ⭐ Rarity / 稀有度 (1-5)

```
  1. ★       ⬜ 普通 common      60%  基礎值 5
  2. ★★      🟩 稀有 uncommon    25%  基礎值 15
  3. ★★★     🟦 珍稀 rare        10%  基礎值 25
  4. ★★★★    🟪 史詩 epic         4%  基礎值 35
  5. ★★★★★   🟨 傳說 legendary    1%  基礎值 50
```

### 👁️ Eyes / 眼睛 (1-6)

```
  1. ·  圓點    2. ✦  星星    3. ×  叉叉    4. ◉  靶心    5. @  漩渦    6. °  空洞
```

### 🎩 Hat / 帽子 (0-7)

```
  0. 無 none    1. \^^^/ 皇冠 crown    2. [___] 高帽 tophat    3. -+- 螺旋槳 propeller
  4. (   ) 光環 halo    5. /^\ 巫師帽 wizard    6. (___) 毛線帽 beanie    7. ,> 小鴨帽 tinyduck
```
Note: common rarity forces hat=none.

### ✨ Shiny / 閃光

```
  1. 普通    2. ✨ 閃光 (原始機率 1%，在 Claude Code 裡金色發光)
```

### 📝 One-shot input

Ask the user to answer all at once:

`🎰 一次選完！格式：物種 稀有度 眼睛 帽子 閃光（例如：13 5 4 1 2 = 水豚/傳說/靶心/皇冠/閃光）：`

## Round 2 — Search + results

Parse the user's input (5 numbers). Map each:
- Species: 1-18 → SPECIES array (duck, goose, blob, cat, dragon, octopus, owl, penguin, turtle, snail, ghost, axolotl, capybara, cactus, robot, rabbit, mushroom, chonk)
- Rarity: 1-5 → common, uncommon, rare, epic, legendary
- Eye: 1-6 → ·, ✦, ×, ◉, @, °
- Hat: 0-7 → none, crown, tophat, propeller, halo, wizard, beanie, tinyduck
- Shiny: 1=no, 2=yes

If input is unclear or partial, ask for clarification. Accept flexible formats (e.g. "capybara legendary 靶心 皇冠 閃光").

Summarize the choice:
```
  🎴 === 你的選擇 ===
  🧬 物種: ...
  ⭐ 稀有度: ...
  👁️ 眼睛: ...
  🎩 帽子: ...
  ✨ 閃光: ...
```

Then run parallel search:
```
bun ~/.claude/scripts/buddy-reroll.js --roll-multi 5 --species <species> --rarity <rarity> --eye "<eye>" --hat <hat> --shiny
```
(Omit `--shiny` if no shiny. Omit `--hat` if none.)

Note: this may take 10-30 seconds for rare combos (legendary + shiny). Warn the user.

Present the 5 candidates with Chinese stat names and AI commentary:
- DEBUGGING = 除錯力
- PATIENCE = 耐心值
- CHAOS = 混亂值
- WISDOM = 智慧值
- SNARK = 毒舌值

Add a brief roast/recommendation for each candidate (e.g. "#3 混亂滿分的瘋狂水豚，適合寫 regex", "#4 全面型選手，沒有短板").

Ask: `🎲 選一組 (1-5)，或 r 重新搜尋：`

## Round 3 — Confirm + Patch

When user picks a candidate:

1. Warn: `⚠️ 請先關閉所有其他 Claude Code 視窗，再輸入 y 繼續。`
2. Wait for user confirmation.
3. Run patch (--force because we're running inside Claude Code):
```
bun ~/.claude/scripts/buddy-reroll.js --salt <selected_salt> --force
```
4. Show result.
5. `🎉 完成！重新啟動 Claude Code 後輸入 /buddy 就能看到你的新夥伴！`

If user declines: `👌 沒問題，隨時可以再 /buddy-reroll。`

## 🔄 Restore

If the user says restore/還原:
```
bun ~/.claude/scripts/buddy-reroll.js --restore
```

## Rules

- Detect the user's language from their first message and respond in that language throughout the session. If unclear, default to 繁體中文.
- Use emoji liberally throughout responses to keep the mood fun and playful 🎮
- Round 1 MUST be a single message — show ALL options at once, do NOT split into multiple steps
- The eye character must be passed with quotes in the command since some are special chars
- Accept flexible input formats: numbers, names, Chinese names, or mixed
- If user wants to change a previous choice, allow it without restarting
