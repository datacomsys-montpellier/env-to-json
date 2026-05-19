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

// Find an optional file named after the .env variable NODE_ENV (e.g. .env.development)
const nodeEnv = process.env.NODE_ENV;
if (nodeEnv) {
  const envSpecificPath = envPath.replace(/\.env$/, `.env.${nodeEnv}`);
  console.log(`Looking for environment-specific file: ${envSpecificPath}`);
  if (fs.existsSync(envSpecificPath)) {
    console.log(`Found environment-specific file: ${envSpecificPath}`);
    // Merge the specific env file with the base env file, giving precedence to the specific one
    const baseEnvContent = fs.readFileSync(envPath);
    const specificEnvContent = fs.readFileSync(envSpecificPath);
    const baseEnv = dotenv.parse(baseEnvContent);
    const specificEnv = dotenv.parse(specificEnvContent);
    const mergedEnv = { ...baseEnv, ...specificEnv };
    // -- convert merged env to JSON and write output
    const jsonObject = cleanupOutput(mergedEnv);
    // --- Write output ---
    fs.writeFileSync(outputPath, JSON.stringify(jsonObject, null, 2));
    console.log(`✔ Successfully wrote merged JSON to ${outputPath}`);
    process.exit(0);
  }
}

const envContent = fs.readFileSync(envPath);
const env = dotenv.parse(envContent);

// --- Convert to JSON ---
const jsonObject = cleanupOutput(env);

// --- Write output ---
fs.writeFileSync(outputPath, JSON.stringify(jsonObject, null, 2));

console.log(`✔ Successfully wrote JSON to ${outputPath}`);
process.exit(0);

/**
 * Replace literal "\n" in values with actual newlines for better readability in JSON output.
 * @param {Object} output - The object to clean up.
 * @returns {Object} - The cleaned-up object with newlines replaced.
*/
function cleanupOutput(output) {
  return Object.fromEntries(
    Object.entries(output).map(([key, value]) => [key, value.replace(/\\n/g, "\n")]),
  );
}