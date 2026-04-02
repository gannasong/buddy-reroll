🎰 互動式 Buddy 重刷工具 — 選擇你理想的 Claude Code /buddy 夥伴物種、稀有度、外觀，暴力搜尋匹配的 salt 並 patch 到二進位檔。

## Prerequisites

Before starting, run this command to check the current buddy:
```
bun ~/.claude/scripts/buddy-reroll.js --current
```
Show the result to the user as "🐾 你目前的 Buddy", then add a short roast (毒舌吐槽) about the current buddy based on its species, rarity, and stats. Be playful and savage — mock its weakest stat, judge its rarity, comment on its species. Examples:
- A common cactus with low patience: "🌵 一棵沒耐心的白板仙人掌... 連沙漠都嫌棄你。"
- A common dragon with SNARK 63 but PATIENCE 1: "🐉 一隻只會嘴砲但完全沒耐心的白板龍，嗆人嗆到一半就不耐煩走了。難怪你想重刷。"
- A legendary capybara: "🏆 已經是傳說水豚了你還想重刷？貪心。"
Keep it to 1-2 sentences, 繁體中文, end with something that motivates them to reroll.

## Step 1 — 🧬 選擇物種

Print this EXACT species matrix with numbering (do NOT modify the ASCII art):

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

Ask: `🧬 選一隻 (1-18):`

Wait for user input. Map the number to the species English name.

## Step 2 — ⭐ 選擇稀有度

Print:
```
  1. ★         ⬜ 普通 common       60%   基礎屬性值 5
  2. ★★        🟩 稀有 uncommon     25%   基礎屬性值 15
  3. ★★★       🟦 珍稀 rare         10%   基礎屬性值 25
  4. ★★★★      🟪 史詩 epic          4%   基礎屬性值 35
  5. ★★★★★     🟨 傳說 legendary     1%   基礎屬性值 50
```

Ask: `⭐ 選稀有度 (1-5):`

Wait for user input. Map the number to the rarity English name.

## Step 3 — 👁️ 選擇眼睛

Run this command to show the user's chosen species with all 6 eye variations side-by-side:
```
bun ~/.claude/scripts/buddy-reroll.js --preview-eyes <species>
```

The command output already contains the preview. Do NOT reprint it. Just ask: `👁️ 選眼睛 (1-6):`

Wait for user input. Map: 1=· 2=✦ 3=× 4=◉ 5=@ 6=°

## Step 4 — 🎩 選擇帽子

If user chose rarity "common", skip this step and inform: `⬜ 普通稀有度沒有帽子，自動設為 none。`

Otherwise, run this command to show the species with the chosen eye + all hat variations:
```
bun ~/.claude/scripts/buddy-reroll.js --preview-hats <species> --eye "<eye>"
```

The command output already contains the preview. Do NOT reprint it. Just ask: `🎩 選帽子 (2-8)，或 1 不戴:`

Wait for user input. Map: 1=none 2=crown 3=tophat 4=propeller 5=halo 6=wizard 7=beanie 8=tinyduck

## Step 5 — ✨ 閃光

Shiny 是獨立於稀有度的特殊效果，原始機率只有 1%。在 Claude Code 裡會有金色發光的渲染效果。

Ask: `✨ 要閃光嗎？(1=普通 / 2=✨閃光):`

Wait for user input. Map: 1=no shiny, 2=shiny.

## Step 6 — 📋 預覽

Summarize the user's choices in a card format, e.g.:
```
  🎴 === 你的選擇 ===
  🧬 物種: 水豚 capybara
  ⭐ 稀有度: 傳說 legendary ★★★★★
  👁️ 眼睛: ✦ 星星
  🎩 帽子: 皇冠 crown
  ✨ 閃光: Yes
```

Then run dry mode to preview:
```
bun ~/.claude/scripts/buddy-reroll.js --dry --species <species> --rarity <rarity> --eye "<eye>" --hat <hat> --shiny
```
(Omit `--shiny` if user chose no. Omit `--hat` if none.)

Show the dry run result to the user.

Ask: `🎯 確認要刷嗎？這會修改 Claude Code 二進位檔（會自動備份）。(y/n):`

## Step 7 — 🔧 執行

If user confirms:

1. IMPORTANT: Warn the user — `⚠️ 請先關閉所有 Claude Code 視窗，再輸入 y 繼續。`
2. Wait for user confirmation.
3. Run the actual reroll (without --dry):
```
bun ~/.claude/scripts/buddy-reroll.js --species <species> --rarity <rarity> --eye "<eye>" --hat <hat> --shiny
```
4. Show the result.
5. Tell user: `🎉 完成！重新啟動 Claude Code 後輸入 /buddy 就能看到你的新夥伴！`

If user declines, say: `👌 沒問題，隨時可以再 /buddy-reroll。`

## 🔄 Restore

If at any point the user says they want to restore/還原, run:
```
bun ~/.claude/scripts/buddy-reroll.js --restore
```

## Rules

- Always communicate in 繁體中文
- Use emoji liberally throughout responses to keep the mood fun and playful 🎮
- Wait for user input at each step — do NOT skip ahead or auto-fill
- Show ALL visual options before asking
- The eye character must be passed with quotes in the command since some are special chars
- If user types a species name instead of a number, accept it
- If user wants to go back to a previous step, allow it
