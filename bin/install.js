#!/usr/bin/env node

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const readline = require("node:readline");

const skills = [
  {
    name: "web-collection",
    description: "Browser plugin data collection via a local bridge",
  },
  {
    name: "lark-practice-doc",
    description: "Create classroom-style Feishu/Lark practice documents",
  },
  {
    name: "mx-auto",
    description: "Run local Runtime triggers, sandbox inspection, and scripts",
  },
];

const repoRoot = path.resolve(__dirname, "..");
const codexHome = process.env.CODEX_HOME || path.join(os.homedir(), ".codex");
const skillsRoot = path.join(codexHome, "skills");

function validateBundledSkills() {
  for (const skill of skills) {
    const sourceDir = path.join(repoRoot, skill.name);
    const skillFile = path.join(sourceDir, "SKILL.md");
    if (!fs.existsSync(skillFile)) {
      console.error(`Cannot find ${skillFile}`);
      process.exit(1);
    }
  }
}

function parseSelection(input) {
  const raw = String(input || "").trim().toLowerCase();
  if (!raw || raw === "all" || raw === "a") {
    return skills;
  }

  const indexes = raw.split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => Number(part));

  if (!indexes.length || indexes.some((index) => !Number.isInteger(index) || index < 1 || index > skills.length)) {
    return null;
  }

  return [...new Set(indexes)].map((index) => skills[index - 1]);
}

function installSkill(skill) {
  const sourceDir = path.join(repoRoot, skill.name);
  const destDir = path.join(skillsRoot, skill.name);

  fs.mkdirSync(skillsRoot, { recursive: true });
  fs.rmSync(destDir, { recursive: true, force: true });
  fs.cpSync(sourceDir, destDir, { recursive: true });

  return destDir;
}

function printMenu() {
  console.log("Available skills:");
  for (const [index, skill] of skills.entries()) {
    console.log(`${index + 1}. ${skill.name} - ${skill.description}`);
  }
  console.log("");
  console.log("Enter a number, comma-separated numbers, or all.");
  console.log("Press Enter to install all skills.");
}

function ask(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  validateBundledSkills();
  printMenu();

  const answer = await ask("> ");
  const selected = parseSelection(answer);
  if (!selected) {
    console.error("Invalid selection. Use all, a single number, or comma-separated numbers such as 1,3.");
    process.exit(1);
  }

  const installed = selected.map((skill) => ({
    skill,
    destDir: installSkill(skill),
  }));

  console.log("");
  for (const item of installed) {
    console.log(`Installed ${item.skill.name} to ${item.destDir}`);
  }
  console.log("");
  console.log("Restart Codex or your coding agent client to pick up installed skills.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
