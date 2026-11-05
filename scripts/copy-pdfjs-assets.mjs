#!/usr/bin/env node
// Copies PDF.js character maps and standard fonts from the installed pdfjs-dist into public/pdfjs,
// so the reader can render PDFs whose CJK or standard fonts are not embedded (otherwise PDF.js
// silently drops that text). Runs on install and before dev/build; versions always match the library.
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const src = path.join(root, "node_modules", "pdfjs-dist");
const dest = path.join(root, "public", "pdfjs");
if (!existsSync(src)) { console.warn("pdfjs-dist not installed; skipping PDF.js asset copy"); process.exit(0); }
const version = JSON.parse(readFileSync(path.join(src, "package.json"), "utf8")).version;
const stamp = path.join(dest, "VERSION");
if (existsSync(stamp) && readFileSync(stamp, "utf8").trim() === version) process.exit(0);
mkdirSync(dest, { recursive: true });
cpSync(path.join(src, "cmaps"), path.join(dest, "cmaps"), { recursive: true });
cpSync(path.join(src, "standard_fonts"), path.join(dest, "standard_fonts"), { recursive: true });
writeFileSync(stamp, version);
console.log(`PDF.js ${version} cmaps + standard fonts → public/pdfjs`);
