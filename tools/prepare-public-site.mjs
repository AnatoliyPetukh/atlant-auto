import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../atlant-auto-draft");

// Temporary KYC publication profile: Polish and English only, without the
// customs calculator. The source translations remain in Git for easy restore.
const obsoletePublicPaths = [
  "avto-iz-evropy",
  "avto-s-aukciona",
  "avtomobili",
  "cars",
  "faq",
  "kak-my-rabotaem",
  "kalkulator",
  "kejsy",
  "kontakty",
  "o-kompanii",
  "privacy",
  "customs-calculator.html",
  "pl/kalkulator",
  "pl/customs-calculator.html",
  "en/calculator",
  "en/customs-calculator.html",
  "js/customs-calculator-page.mjs",
  "js/customs-calculator.mjs",
  "js/customs-calculator.test.mjs",
  "js/customs-rates.mjs"
];

for (const relative of obsoletePublicPaths) {
  fs.rmSync(path.join(root, relative), { recursive: true, force: true });
}

console.log("Prepared Polish/English public site without customs calculator routes.");
