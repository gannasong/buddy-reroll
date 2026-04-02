#!/usr/bin/env bun
// buddy-reroll.js — Zero-dependency buddy reroller for Claude Code
// Requires: Bun runtime (for Bun.hash)
// Usage:
//   bun buddy-reroll.js --current                    Show current buddy
//   bun buddy-reroll.js --list                       List all options
//   bun buddy-reroll.js --species capybara --rarity legendary --shiny
//   bun buddy-reroll.js --restore                    Restore original binary

import { readFileSync, writeFileSync, existsSync, copyFileSync, readdirSync, statSync, realpathSync } from "fs";
import { join } from "path";
import { homedir, platform, cpus } from "os";
import { execSync } from "child_process";
import { parseArgs } from "util";

// ── Constants (from Claude Code src/buddy/types.ts) ──────────────────────

const ORIGINAL_SALT = "friend-2026-401";
const SALT_LEN = ORIGINAL_SALT.length;

const RARITIES = ["common", "uncommon", "rare", "epic", "legendary"];
const RARITY_WEIGHTS = { common: 60, uncommon: 25, rare: 10, epic: 4, legendary: 1 };
const RARITY_TOTAL = Object.values(RARITY_WEIGHTS).reduce((a, b) => a + b, 0);
const RARITY_FLOOR = { common: 5, uncommon: 15, rare: 25, epic: 35, legendary: 50 };

const SPECIES = [
  "duck", "goose", "blob", "cat", "dragon", "octopus", "owl", "penguin",
  "turtle", "snail", "ghost", "axolotl", "capybara", "cactus", "robot",
  "rabbit", "mushroom", "chonk",
];

const EYES = ["·", "✦", "×", "◉", "@", "°"];
const HATS = ["none", "crown", "tophat", "propeller", "halo", "wizard", "beanie", "tinyduck"];
const STAT_NAMES = ["DEBUGGING", "PATIENCE", "CHAOS", "WISDOM", "SNARK"];

const RARITY_COLORS = {
  common: "\x1b[37m",      // white
  uncommon: "\x1b[32m",    // green
  rare: "\x1b[34m",        // blue
  epic: "\x1b[35m",        // magenta
  legendary: "\x1b[33m",   // yellow/gold
};
const RESET = "\x1b[0m";

const EYE_NAMES = { "·": "圓點", "✦": "星星", "×": "叉叉", "◉": "靶心", "@": "漩渦", "°": "空洞" };
const HAT_NAMES = { none: "無", crown: "皇冠", tophat: "高帽", propeller: "螺旋槳", halo: "光環", wizard: "巫師帽", beanie: "毛線帽", tinyduck: "小鴨帽" };
const HAT_LINES = {
  none: "            ", crown: "   \\^^^/    ", tophat: "   [___]    ",
  propeller: "    -+-     ", halo: "   (   )    ", wizard: "    /^\\     ",
  beanie: "   (___)    ", tinyduck: "    ,>      ",
};

// Body templates — frame 0 only, {E} = eye placeholder
const BODIES = {
  duck:     ["            ", "    __      ", "  <({E} )___  ", "   (  ._>   ", "    `--´    "],
  goose:    ["            ", "     ({E}>    ", "     ||     ", "   _(__)_   ", "    ^^^^    "],
  blob:     ["            ", "   .----.   ", "  ( {E}  {E} )  ", "  (      )  ", "   `----´   "],
  cat:      ["            ", "   /\\_/\\    ", "  ( {E}   {E})  ", "  (  ω  )   ", '  (")_(")   '],
  dragon:   ["            ", "  /^\\  /^\\  ", " <  {E}  {E}  > ", " (   ~~   ) ", "  `-vvvv-´  "],
  octopus:  ["            ", "   .----.   ", "  ( {E}  {E} )  ", "  (______)  ", "  /\\/\\/\\/\\  "],
  owl:      ["            ", "   /\\  /\\   ", "  (({E})({E}))  ", "  (  ><  )  ", "   `----´   "],
  penguin:  ["            ", "  .---.     ", "  ({E}>{E})     ", " /(   )\\    ", "  `---´     "],
  turtle:   ["            ", "   _,--._   ", "  ( {E}  {E} )  ", " /[______]\\ ", "  ``    ``  "],
  snail:    ["            ", " {E}    .--.  ", "  \\  ( @ )  ", "   \\_`--´   ", "  ~~~~~~~   "],
  ghost:    ["            ", "   .----.   ", "  / {E}  {E} \\  ", "  |      |  ", "  ~`~``~`~  "],
  axolotl:  ["            ", "}~(______)~{", "}~({E} .. {E})~{", "  ( .--. )  ", "  (_/  \\_)  "],
  capybara: ["            ", "  n______n  ", " ( {E}    {E} ) ", " (   oo   ) ", "  `------´  "],
  cactus:   ["            ", " n  ____  n ", " | |{E}  {E}| | ", " |_|    |_| ", "   |    |   "],
  robot:    ["            ", "   .[||].   ", "  [ {E}  {E} ]  ", "  [ ==== ]  ", "  `------´  "],
  rabbit:   ["            ", "   (\\__/)   ", "  ( {E}  {E} )  ", " =(  ..  )= ", '  (")__(")  '],
  mushroom: ["            ", " .-o-OO-o-. ", "(__________)", "   |{E}  {E}|   ", "   |____|   "],
  chonk:    ["            ", "  /\\    /\\  ", " ( {E}    {E} ) ", " (   ..   ) ", "  `------´  "],
};

function renderSprite(species, eye, hat = "none") {
  const body = BODIES[species].map((line) => line.replaceAll("{E}", eye));
  const lines = [...body];
  if (hat !== "none" && !lines[0].trim()) {
    lines[0] = HAT_LINES[hat];
  }
  return lines;
}

// ── PRNG (from Claude Code src/buddy/companion.ts) ───────────────────────

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s) {
  return Number(BigInt(Bun.hash(s)) & 0xffffffffn);
}

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

function rollRarity(rng) {
  let roll = rng() * RARITY_TOTAL;
  for (const r of RARITIES) {
    roll -= RARITY_WEIGHTS[r];
    if (roll < 0) return r;
  }
  return "common";
}

function rollFrom(salt, userId) {
  const rng = mulberry32(hashString(userId + salt));
  const rarity = rollRarity(rng);
  const species = pick(rng, SPECIES);
  const eye = pick(rng, EYES);
  const hat = rarity === "common" ? "none" : pick(rng, HATS);
  const shiny = rng() < 0.01;

  const floor = RARITY_FLOOR[rarity];
  const peak = pick(rng, STAT_NAMES);
  let dump = pick(rng, STAT_NAMES);
  while (dump === peak) dump = pick(rng, STAT_NAMES);
  const stats = {};
  for (const name of STAT_NAMES) {
    if (name === peak) stats[name] = Math.min(100, floor + 50 + Math.floor(rng() * 30));
    else if (name === dump) stats[name] = Math.max(1, floor - 10 + Math.floor(rng() * 15));
    else stats[name] = floor + Math.floor(rng() * 40);
  }

  return { rarity, species, eye, hat, shiny, stats };
}

// ── Path detection ───────────────────────────────────────────────────────

function findBinaryPath() {
  try {
    const allPaths = execSync("which -a claude 2>/dev/null", { encoding: "utf-8" }).trim().split("\n");
    for (const entry of allPaths) {
      try {
        const resolved = realpathSync(entry.trim());
        if (resolved && existsSync(resolved) && statSync(resolved).size > 1_000_000) return resolved;
      } catch {}
    }
  } catch {}

  const versionsDir = join(homedir(), ".local", "share", "claude", "versions");
  if (existsSync(versionsDir)) {
    const versions = readdirSync(versionsDir)
      .filter((f) => !f.includes(".backup"))
      .sort();
    if (versions.length > 0) return join(versionsDir, versions[versions.length - 1]);
  }
  return null;
}

function findConfigPath() {
  const legacyPath = join(homedir(), ".claude", ".config.json");
  if (existsSync(legacyPath)) return legacyPath;
  const defaultPath = join(homedir(), ".claude.json");
  if (existsSync(defaultPath)) return defaultPath;
  return null;
}

function getUserId(configPath) {
  const config = JSON.parse(readFileSync(configPath, "utf-8"));
  return config.oauthAccount?.accountUuid ?? config.userID ?? "anon";
}

// ── Salt detection ───────────────────────────────────────────────────────

function findCurrentSalt(binaryData, userId) {
  if (binaryData.includes(Buffer.from(ORIGINAL_SALT))) return ORIGINAL_SALT;

  const text = binaryData.toString("latin1");
  const patterns = [
    new RegExp(`x{${SALT_LEN - 8}}\\d{8}`, "g"),
    new RegExp(`friend-\\d{4}-.{${SALT_LEN - 12}}`, "g"),
  ];
  for (const pat of patterns) {
    let m;
    while ((m = pat.exec(text)) !== null) {
      if (m[0].length === SALT_LEN) return m[0];
    }
  }
  return null;
}

// ── Brute-force ──────────────────────────────────────────────────────────

function matches(roll, target) {
  if (target.species && roll.species !== target.species) return false;
  if (target.rarity && roll.rarity !== target.rarity) return false;
  if (target.eye && roll.eye !== target.eye) return false;
  if (target.hat && roll.hat !== target.hat) return false;
  if (target.shiny !== undefined && roll.shiny !== target.shiny) return false;
  return true;
}

async function bruteForce(userId, target, maxIterations = 500_000_000) {
  const startTime = Date.now();
  let checked = 0;

  for (let i = 0; i < maxIterations; i++) {
    const salt = String(i).padStart(SALT_LEN, "x");
    checked++;
    const r = rollFrom(salt, userId);
    if (matches(r, target)) return { salt, result: r, checked, elapsed: Date.now() - startTime };

    if (checked % 500_000 === 0) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      process.stderr.write(`\r  Searching... ${(checked / 1_000_000).toFixed(1)}M checked (${elapsed}s)`);
      await new Promise((r) => setTimeout(r, 0));
    }
  }
  return null;
}

// ── Binary patch ─────────────────────────────────────────────────────────

function patchBinary(binaryPath, oldSalt, newSalt) {
  if (oldSalt.length !== newSalt.length) {
    throw new Error(`Salt length mismatch: ${oldSalt.length} vs ${newSalt.length}`);
  }
  const data = readFileSync(binaryPath);
  const oldBuf = Buffer.from(oldSalt);
  const newBuf = Buffer.from(newSalt);

  let count = 0;
  let idx = 0;
  while (true) {
    idx = data.indexOf(oldBuf, idx);
    if (idx === -1) break;
    newBuf.copy(data, idx);
    count++;
    idx += newBuf.length;
  }
  if (count === 0) throw new Error(`Salt "${oldSalt}" not found in binary`);
  writeFileSync(binaryPath, data);
  return count;
}

function resignBinary(binaryPath) {
  if (platform() !== "darwin") return false;
  try {
    execSync(`codesign -s - --force "${binaryPath}" 2>/dev/null`);
    return true;
  } catch { return false; }
}

function clearCompanion(configPath) {
  const raw = readFileSync(configPath, "utf-8");
  const config = JSON.parse(raw);
  delete config.companion;
  delete config.companionMuted;
  const indent = raw.match(/^(\s+)"/m)?.[1] ?? "  ";
  writeFileSync(configPath, JSON.stringify(config, null, indent) + "\n");
}

function isClaudeRunning() {
  try {
    const out = execSync("pgrep -af claude 2>/dev/null", { encoding: "utf-8" });
    return out.split("\n").some((line) => !line.includes("buddy-reroll") && line.trim().length > 0);
  } catch { return false; }
}

// ── Display ──────────────────────────────────────────────────────────────

function formatCard(result) {
  const c = RARITY_COLORS[result.rarity] ?? RARITY_COLORS.common;
  const lines = [];
  lines.push(`  ${c}${result.species}${RESET} / ${c}${result.rarity}${RESET}${result.shiny ? ` / ${RARITY_COLORS.legendary}✨ SHINY${RESET}` : ""}`);
  lines.push(`  eye: ${result.eye}  hat: ${result.hat}`);
  lines.push("");
  for (const [k, v] of Object.entries(result.stats)) {
    const filled = Math.min(10, Math.max(0, Math.round(v / 10)));
    const bar = c + "█".repeat(filled) + RESET + "░".repeat(10 - filled);
    lines.push(`  ${k.padEnd(10)} ${bar} ${String(v).padStart(3)}`);
  }
  return lines.join("\n");
}

// ── Main ─────────────────────────────────────────────────────────────────

const { values: args } = parseArgs({
  options: {
    species: { type: "string" },
    rarity: { type: "string" },
    eye: { type: "string" },
    hat: { type: "string" },
    shiny: { type: "boolean", default: undefined },
    list: { type: "boolean", default: false },
    restore: { type: "boolean", default: false },
    current: { type: "boolean", default: false },
    help: { type: "boolean", short: "h", default: false },
    dry: { type: "boolean", default: false },
    "preview-eyes": { type: "string" },
    "preview-hats": { type: "string" },
    "preview-shiny": { type: "string" },
    "roll-multi": { type: "string" },
    "parallel": { type: "string" },
    start: { type: "string" },
    end: { type: "string" },
    salt: { type: "string" },
  },
  strict: false,
});

if (args.help) {
  console.log(`
  buddy-reroll — Reroll Claude Code /buddy companion (zero-dependency)

  Usage:
    bun buddy-reroll.js --current
    bun buddy-reroll.js --species capybara --rarity legendary --shiny
    bun buddy-reroll.js --list
    bun buddy-reroll.js --restore
    bun buddy-reroll.js --dry --species dragon --rarity epic   (preview only)

  Species:  ${SPECIES.join(", ")}
  Rarity:   ${RARITIES.map((r) => `${r}(${RARITY_WEIGHTS[r]}%)`).join(", ")}
  Eye:      ${EYES.join("  ")}
  Hat:      ${HATS.join(", ")}
`);
  process.exit(0);
}

if (args.list) {
  console.log("\n  === Buddy Options ===\n");
  console.log("  Species: ", SPECIES.join(", "));
  console.log("  Rarity:  ", RARITIES.map((r) => `${r}(${RARITY_WEIGHTS[r]}%)`).join(", "));
  console.log("  Eye:     ", EYES.join("  "));
  console.log("  Hat:     ", HATS.join(", "));
  console.log("  Shiny:    true / false (1% natural)\n");
  process.exit(0);
}

// ── Preview eyes: show species with all 6 eye types ─────────────────────

if (args["preview-eyes"]) {
  const sp = args["preview-eyes"];
  if (!SPECIES.includes(sp)) { console.error(`  ✗ Unknown species "${sp}".`); process.exit(1); }
  console.log(`\n  === ${sp} — 選擇眼睛 ===\n`);
  const COLS = 6;
  // Header
  let header = "  ";
  for (let i = 0; i < EYES.length; i++) {
    header += `${i + 1}. ${EYES[i]} ${EYE_NAMES[EYES[i]]}`.padEnd(14);
  }
  console.log(header);
  // Sprites side by side
  const sprites = EYES.map((e) => renderSprite(sp, e));
  for (let row = 0; row < 5; row++) {
    let line = "  ";
    for (let col = 0; col < COLS; col++) {
      line += (sprites[col][row] || "").padEnd(14);
    }
    console.log(line);
  }
  console.log();
  process.exit(0);
}

// ── Preview hats: show species with chosen eye + all 8 hat types ────────

if (args["preview-hats"]) {
  const sp = args["preview-hats"];
  if (!SPECIES.includes(sp)) { console.error(`  ✗ Unknown species "${sp}".`); process.exit(1); }
  const eye = args.eye || "·";
  console.log(`\n  === ${sp} (eye: ${eye}) — 選擇帽子 ===\n`);
  const hatsToShow = HATS.filter((h) => h !== "none");
  const COLS = 4;
  for (let row = 0; row < Math.ceil(hatsToShow.length / COLS); row++) {
    const chunk = hatsToShow.slice(row * COLS, (row + 1) * COLS);
    // Header
    let header = "  ";
    for (const h of chunk) {
      const idx = HATS.indexOf(h) + 1;
      header += `${idx}. ${HAT_NAMES[h]} ${h}`.padEnd(18);
    }
    console.log(header);
    // Sprites
    const sprites = chunk.map((h) => renderSprite(sp, eye, h));
    for (let line = 0; line < 5; line++) {
      let row = "  ";
      for (let col = 0; col < chunk.length; col++) {
        row += (sprites[col][line] || "").padEnd(18);
      }
      console.log(row);
    }
    console.log();
  }
  process.exit(0);
}

// ── Preview shiny: show species normal vs shiny side by side ────────────

if (args["preview-shiny"]) {
  const sp = args["preview-shiny"];
  if (!SPECIES.includes(sp)) { console.error(`  ✗ Unknown species "${sp}".`); process.exit(1); }
  const eye = args.eye || "·";
  const hat = args.hat || "none";
  const sprite = renderSprite(sp, eye, hat);
  const W = 20;
  const GOLD = "\x1b[33m";
  const SPARKLE = "\x1b[33;1m";
  const DIM = "\x1b[2m";

  console.log(`\n  === ${sp} (eye: ${eye}, hat: ${hat}) — 閃光比較 ===\n`);
  console.log(`  ${DIM}1. 普通${RESET}`.padEnd(W + 12) + `  ${SPARKLE}2. ✨ 閃光 SHINY${RESET}`);
  const sparkles = ["✨", "⭐", "💫", "✨", "⭐"];
  for (let i = 0; i < sprite.length; i++) {
    const normal = `  ${DIM}${sprite[i]}${RESET}`;
    const sp_char = sparkles[i % sparkles.length];
    const shiny = `  ${SPARKLE}${sp_char} ${sprite[i]} ${sp_char}${RESET}`;
    console.log(normal.padEnd(W + 16) + shiny);
  }
  console.log();
  console.log(`  ${DIM}普通版 — 標準顏色${RESET}`);
  console.log(`  ${SPARKLE}✨ 閃光版 — 金色發光 + 閃閃特效，獨立 1% 機率${RESET}`);
  console.log();
  process.exit(0);
}

// ── Roll multi: find N matching salts for user to pick stats ────────────

if (args["roll-multi"]) {
  const count = parseInt(args["roll-multi"]) || 5;
  const configPath = findConfigPath();
  if (!configPath) { console.error("  ✗ Config not found."); process.exit(1); }
  const userId = getUserId(configPath);

  const target = {};
  if (args.species) target.species = args.species;
  if (args.rarity) target.rarity = args.rarity;
  if (args.eye) target.eye = args.eye;
  if (args.hat) target.hat = args.hat;
  if (args.shiny !== undefined) target.shiny = args.shiny;

  if (Object.keys(target).length === 0) {
    console.error("  ✗ Specify at least one target. Use --help.");
    process.exit(1);
  }

  const STAT_ZH = { DEBUGGING: "除錯力", PATIENCE: "耐心值", CHAOS: "混亂值", WISDOM: "智慧值", SNARK: "毒舌值" };
  const isWorker = !!args.start;
  const rangeStart = parseInt(args.start) || 0;
  const rangeEnd = parseInt(args.end) || 500_000_000;

  // Auto-parallel: use all available cores (leave 1 for system)
  const totalCores = cpus().length;
  const workerCount = Math.max(2, totalCores - 1);
  if (!isWorker && workerCount > 1) {
    const CHUNK = Math.ceil(rangeEnd / workerCount);
    const scriptPath = new URL(import.meta.url).pathname;
    const targetArgs = [];
    if (args.species) targetArgs.push("--species", args.species);
    if (args.rarity) targetArgs.push("--rarity", args.rarity);
    if (args.eye) targetArgs.push("--eye", args.eye);
    if (args.hat) targetArgs.push("--hat", args.hat);
    if (args.shiny) targetArgs.push("--shiny");

    console.log(`\n  🚀 ${workerCount} 核心平行搜尋中... 目標：${count} 組 ${Object.entries(target).map(([k, v]) => `${k}=${v}`).join(" ")}\n`);
    const startTime = Date.now();

    const workers = [];
    for (let w = 0; w < workerCount; w++) {
      const s = w * CHUNK;
      const e = Math.min(s + CHUNK, rangeEnd);
      const proc = Bun.spawn(["bun", scriptPath, "--roll-multi", String(count), "--start", String(s), "--end", String(e), ...targetArgs], {
        stdout: "pipe", stderr: "ignore",
      });
      workers.push(proc);
    }

    const outputs = await Promise.all(workers.map(async (proc) => {
      const text = await new Response(proc.stdout).text();
      await proc.exited;
      return text;
    }));

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    // Parse salt lines from all workers, collect results, re-number top N
    const saltRegex = /salt: (\S+)/g;
    const allResults = [];
    for (const output of outputs) {
      let m;
      const lines = output.split("\n");
      let currentResult = null;
      for (const line of lines) {
        if ((m = line.match(/salt: (\S+)/))) {
          if (currentResult) { currentResult.salt = m[1]; allResults.push(currentResult); }
          currentResult = null;
        }
        if (line.includes("#")) currentResult = { display: [] };
        if (currentResult) currentResult.display.push(line);
      }
    }

    // Re-roll to get actual data for display
    const collected = [];
    for (const r of allResults) {
      const result = rollFrom(r.salt, userId);
      if (matches(result, target)) collected.push({ salt: r.salt, result });
    }
    collected.sort((a, b) => {
      const aMax = Math.max(...Object.values(a.result.stats));
      const bMax = Math.max(...Object.values(b.result.stats));
      return bMax - aMax;
    });
    const top = collected.slice(0, count);

    console.log(`  ⚡ ${workerCount} 核心完成，${elapsed}s，找到 ${collected.length} 組，顯示前 ${top.length} 組\n`);

    for (let i = 0; i < top.length; i++) {
      const r = top[i].result;
      const c = RARITY_COLORS[r.rarity] ?? RARITY_COLORS.common;
      const statsLine = STAT_NAMES.map((s) => {
        const v = r.stats[s];
        const filled = Math.min(10, Math.max(0, Math.round(v / 10)));
        const bar = c + "█".repeat(filled) + RESET + "░".repeat(10 - filled);
        return `${STAT_ZH[s]} ${bar} ${String(v).padStart(3)}`;
      }).join("  ");
      const peak = STAT_NAMES.reduce((a, b) => r.stats[a] >= r.stats[b] ? a : b);
      const peakLabel = r.stats[peak] >= 90 ? " 🔥" : "";
      console.log(`  ${c}#${i + 1}${RESET}  ${c}${r.species}/${r.rarity}${r.shiny ? "/✨" : ""}${RESET}  eye:${r.eye} hat:${r.hat}${peakLabel}`);
      console.log(`      ${statsLine}`);
      console.log(`      salt: ${top[i].salt}`);
      console.log();
    }
    process.exit(0);
  }

  // Worker mode or single-core fallback
  if (!isWorker) {
    console.log(`\n  Searching for ${count} matches: ${Object.entries(target).map(([k, v]) => `${k}=${v}`).join(" ")}\n`);
  }

  const results = [];
  const startTime = Date.now();
  let checked = 0;

  for (let i = rangeStart; i < rangeEnd && results.length < count; i++) {
    const salt = String(i).padStart(SALT_LEN, "x");
    checked++;
    const r = rollFrom(salt, userId);
    if (matches(r, target)) results.push({ salt, result: r });

    if (!isWorker && checked % 500_000 === 0) {
      process.stderr.write(`\r  Searching... ${(checked / 1_000_000).toFixed(1)}M checked, ${results.length}/${count} found`);
      await new Promise((r) => setTimeout(r, 0));
    }
  }
  if (!isWorker) process.stderr.write("\r" + " ".repeat(70) + "\r");

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  if (!isWorker) {
    console.log(`  ✓ Found ${results.length} matches in ${checked.toLocaleString()} attempts (${elapsed}s)\n`);
  }

  for (let i = 0; i < results.length; i++) {
    const r = results[i].result;
    const c = RARITY_COLORS[r.rarity] ?? RARITY_COLORS.common;
    const statsLine = STAT_NAMES.map((s) => {
      const v = r.stats[s];
      const filled = Math.min(10, Math.max(0, Math.round(v / 10)));
      const bar = c + "█".repeat(filled) + RESET + "░".repeat(10 - filled);
      return `${STAT_ZH[s]} ${bar} ${String(v).padStart(3)}`;
    }).join("  ");

    const peak = STAT_NAMES.reduce((a, b) => r.stats[a] >= r.stats[b] ? a : b);
    const peakLabel = r.stats[peak] >= 90 ? " 🔥" : "";

    console.log(`  ${c}#${i + 1}${RESET}  ${c}${r.species}/${r.rarity}${r.shiny ? "/✨" : ""}${RESET}  eye:${r.eye} hat:${r.hat}${peakLabel}`);
    console.log(`      ${statsLine}`);
    console.log(`      salt: ${results[i].salt}`);
    console.log();
  }
  process.exit(0);
}

const binaryPath = findBinaryPath();
if (!binaryPath) { console.error("✗ Claude Code binary not found."); process.exit(1); }

const configPath = findConfigPath();
if (!configPath) { console.error("✗ Claude Code config not found."); process.exit(1); }

const userId = getUserId(configPath);
console.log(`  Binary:  ${binaryPath}`);
console.log(`  Config:  ${configPath}`);
console.log(`  User ID: ${userId.slice(0, 8)}...`);

if (args.restore) {
  const backupPath = binaryPath + ".backup";
  if (!existsSync(backupPath)) { console.error("  ✗ No backup found."); process.exit(1); }
  copyFileSync(backupPath, binaryPath);
  resignBinary(binaryPath);
  clearCompanion(configPath);
  console.log("  ✓ Restored. Restart Claude Code and run /buddy.");
  process.exit(0);
}

const binaryData = readFileSync(binaryPath);
const currentSalt = findCurrentSalt(binaryData, userId);
if (!currentSalt) { console.error("  ✗ Could not find salt in binary."); process.exit(1); }

if (args.current) {
  const result = rollFrom(currentSalt, userId);
  console.log(`\n  Current companion (salt: ${currentSalt}):\n`);
  console.log(formatCard(result));
  console.log();
  process.exit(0);
}

// ── Direct salt patch mode ───────────────────────────────────────────────

if (args.salt) {
  const newSalt = args.salt;
  if (newSalt.length !== SALT_LEN) {
    console.error(`  ✗ Salt must be ${SALT_LEN} chars, got ${newSalt.length}.`);
    process.exit(1);
  }
  const result = rollFrom(newSalt, userId);
  console.log(`\n  Target salt: ${newSalt}\n`);
  console.log(formatCard(result));
  console.log();

  if (args.dry) {
    console.log(`  [DRY RUN] — no changes made.\n`);
    process.exit(0);
  }

  if (isClaudeRunning()) {
    console.warn("  ⚠ Claude Code is running. Quit all instances before patching.");
    process.exit(1);
  }

  const backupPath = binaryPath + ".backup";
  if (!existsSync(backupPath)) {
    copyFileSync(binaryPath, backupPath);
    console.log(`  Backup:  ${backupPath}`);
  }

  const patchCount = patchBinary(binaryPath, currentSalt, newSalt);
  console.log(`  Patched: ${patchCount} occurrence(s)`);
  if (resignBinary(binaryPath)) console.log("  Signed:  ad-hoc codesign ✓");
  clearCompanion(configPath);
  console.log("  Config:  companion data cleared");
  console.log("\n  ✓ Done! Restart Claude Code and run /buddy.\n");
  process.exit(0);
}

// Build target
const target = {};
if (args.species) {
  if (!SPECIES.includes(args.species)) { console.error(`  ✗ Unknown species "${args.species}". Use --list.`); process.exit(1); }
  target.species = args.species;
}
if (args.rarity) {
  if (!RARITIES.includes(args.rarity)) { console.error(`  ✗ Unknown rarity "${args.rarity}". Use --list.`); process.exit(1); }
  target.rarity = args.rarity;
}
if (args.eye) {
  if (!EYES.includes(args.eye)) { console.error(`  ✗ Unknown eye "${args.eye}". Use --list.`); process.exit(1); }
  target.eye = args.eye;
}
if (args.hat) {
  if (!HATS.includes(args.hat)) { console.error(`  ✗ Unknown hat "${args.hat}". Use --list.`); process.exit(1); }
  target.hat = args.hat;
}
if (args.shiny !== undefined) target.shiny = args.shiny;

if (Object.keys(target).length === 0) {
  console.error("  ✗ Specify at least one target (--species, --rarity, --shiny, etc.). Use --help.");
  process.exit(1);
}

console.log(`  Target:  ${Object.entries(target).map(([k, v]) => `${k}=${v}`).join(" ")}`);

const currentRoll = rollFrom(currentSalt, userId);
if (matches(currentRoll, target)) {
  console.log("\n  ✓ Already matches!\n");
  console.log(formatCard(currentRoll));
  process.exit(0);
}

console.log("\n  Searching for matching salt...\n");
const found = await bruteForce(userId, target);
process.stderr.write("\r" + " ".repeat(60) + "\r");

if (!found) {
  console.error("  ✗ No match found. Try relaxing constraints.");
  process.exit(1);
}

console.log(`  ✓ Found in ${found.checked.toLocaleString()} attempts (${(found.elapsed / 1000).toFixed(1)}s)\n`);
console.log(formatCard(found.result));
console.log();

if (args.dry) {
  console.log(`  [DRY RUN] Salt: ${found.salt} — no changes made.\n`);
  process.exit(0);
}

if (isClaudeRunning()) {
  console.warn("  ⚠ Claude Code is running. Quit all instances before patching.");
  process.exit(1);
}

// Backup
const backupPath = binaryPath + ".backup";
if (!existsSync(backupPath)) {
  copyFileSync(binaryPath, backupPath);
  console.log(`  Backup:  ${backupPath}`);
}

// Patch
const patchCount = patchBinary(binaryPath, currentSalt, found.salt);
console.log(`  Patched: ${patchCount} occurrence(s)`);

if (resignBinary(binaryPath)) console.log("  Signed:  ad-hoc codesign ✓");

clearCompanion(configPath);
console.log("  Config:  companion data cleared");
console.log("\n  ✓ Done! Restart Claude Code and run /buddy.\n");
