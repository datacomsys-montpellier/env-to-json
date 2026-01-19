#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

// --- Parse CLI args ---
const [, , envPathArg, outputPathArg] = process.argv;

if (!envPathArg || !outputPathArg) {
  console.error("Usage: envToJson <path/to/.env> <path/to/output.json>");
  process.exit(1);
}

// Support "~" home dir expansion
const expandPath = (p) =>
  p.startsWith("~")
    ? path.join(process.env.HOME || process.env.USERPROFILE, p.slice(1))
    : p;

const envPath = expandPath(envPathArg);
const outputPath = expandPath(outputPathArg);

// --- Read and parse .env ---
if (!fs.existsSync(envPath)) {
  console.error(`Error: env file not found: ${envPath}`);
  process.exit(1);
}

const envContent = fs.readFileSync(envPath);
const env = dotenv.parse(envContent);

// --- Convert to JSON ---
const jsonObject = Object.fromEntries(
  Object.entries(env).map(([key, value]) => [key, value.replace(/\\n/g, "\n")]),
);

// --- Write output ---
fs.writeFileSync(outputPath, JSON.stringify(jsonObject, null, 2));

console.log(`✔ Successfully wrote JSON to ${outputPath}`);
process.exit(0);
