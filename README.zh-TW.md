# 🎰 buddy-reroll

**Language:** [English](README.md) | 繁體中文

互動式 Claude Code `/buddy` 寵物刷初始工具 — 選擇物種、稀有度、眼睛、帽子、閃光，暴力搜尋 salt 直接 patch。

## 截圖

### 查看目前的 buddy 和屬性值

![目前的 Buddy](assets/01-current-buddy.png)

### 從 18 種物種、5 種稀有度、6 種眼睛、8 種帽子中選擇

![選擇介面](assets/02-selection-menu.png)

### 多核心並行暴力搜尋 + AI 毒舌評語

![搜尋結果](assets/03-roll-multi-results.png)

### Buddy 卡片預覽

![Buddy 卡片](assets/04-buddy-card.png)

## 組合

| 類別 | 選項 | 數量 |
|------|------|------|
| 🧬 物種 | 鴨子、鵝、史萊姆、貓、龍、章魚、貓頭鷹、企鵝、烏龜、蝸牛、幽靈、六角恐龍、水豚、仙人掌、機器人、兔子、蘑菇、胖胖獸 | 18 |
| ⭐ 稀有度 | 普通 (60%)、稀有 (25%)、珍稀 (10%)、史詩 (4%)、傳說 (1%) | 5 |
| 👁️ 眼睛 | `·` 圓點、`✦` 星星、`×` 叉叉、`◉` 靶心、`@` 漩渦、`°` 空洞 | 6 |
| 🎩 帽子 | 無、皇冠、高帽、螺旋槳、光環、巫師帽、毛線帽、小鴨帽 | 8 |
| ✨ 閃光 | 是 / 否（原始機率 1%） | 2 |

**總組合數：8,640 種**

## 安裝

### 前置需求

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code)
- [Bun](https://bun.sh) runtime（`Bun.hash` 需要）

### 一鍵安裝

```bash
git clone https://github.com/gannasong/buddy-reroll.git
cd buddy-reroll
./install.sh
```

### 手動安裝

```bash
cp buddy-reroll.js ~/.claude/scripts/
cp buddy-reroll.md ~/.claude/commands/
```

## 使用

在 Claude Code 裡輸入：

```
/buddy-reroll
```

互動式流程引導你：

1. 🧬 選物種（18 隻 ASCII art 矩陣）
2. ⭐ 選稀有度
3. 👁️ 選眼睛（即時預覽套用在你選的物種上）
4. 🎩 選帽子（同樣即時預覽）
5. ✨ 選閃光
6. 📋 dry run 預覽屬性
7. 🔧 確認 → patch

### 命令列模式

```bash
# 查看目前的 buddy
bun ~/.claude/scripts/buddy-reroll.js --current

# 直接指定目標
bun ~/.claude/scripts/buddy-reroll.js --species capybara --rarity legendary --eye "◉" --shiny

# 預覽不修改
bun ~/.claude/scripts/buddy-reroll.js --dry --species dragon --rarity epic

# 還原
bun ~/.claude/scripts/buddy-reroll.js --restore

# 列出所有選項
bun ~/.claude/scripts/buddy-reroll.js --list
```

## 原理

`/buddy` 用 `accountUuid + salt` 跑 Mulberry32 PRNG 決定你的寵物。salt `"friend-2026-401"` 硬編碼在 Claude Code 二進位檔裡。

這個工具暴力搜尋一個新的 salt，讓 PRNG 算出你想要的組合，然後 patch 到二進位檔。

- ✅ 純本地修改，不動帳號
- ✅ 自動備份原始二進位檔
- ✅ macOS 自動 ad-hoc codesign
- ⚠️ Claude Code 更新後需要重刷（新版本會覆蓋二進位檔）

## 致謝

演算法參考自 [grayashh/buddy-reroll](https://github.com/grayashh/buddy-reroll)，本專案為零外部依賴的獨立實作 + Claude Code skill 互動式封裝。

## License

MIT
