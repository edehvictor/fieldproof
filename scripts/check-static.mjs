import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const requiredFiles = ["index.html", "styles.css", "app.js", "contracts/FieldProofEscrow.sol"];
const missing = [];

for (const file of requiredFiles) {
  try {
    await readFile(new URL(`./${file}`, root));
  } catch {
    missing.push(file);
  }
}

if (missing.length) {
  console.error(`Missing required files: ${missing.join(", ")}`);
  process.exit(1);
}

const html = await readFile(new URL("./index.html", root), "utf8");
const requiredCopy = [
  "FieldProof",
  "Verified stablecoin reality for AI agents",
  "Stablecoin Reality Index",
];

for (const text of requiredCopy) {
  if (!html.includes(text)) {
    console.error(`Missing required product copy: ${text}`);
    process.exit(1);
  }
}

console.log("Static FieldProof project check passed.");
