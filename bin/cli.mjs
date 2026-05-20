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

/**
 * Expand a leading "~" to the current user's home directory.
 * @param {string} p - Input path that may start with "~".
 * @returns {string} Expanded absolute/relative path.
 */
// Support "~" home dir expansion
const expandPath = (p) => {
  if (!p.startsWith("~")) {
    return p;
  }

  /** @type {string | undefined} */
  const homeDir = process.env.HOME ?? process.env.USERPROFILE;

  if (!homeDir) {
    throw new Error("Cannot expand '~': HOME/USERPROFILE is not set.");
  }

  return path.join(homeDir, p.slice(1));
};

const envPath = expandPath(envPathArg);
const outputPath = expandPath(outputPathArg);

// --- Read and parse .env ---
if (!fs.existsSync(envPath)) {
  console.error(`Error: env file not found: ${envPath}`);
  process.exit(1);
}

const envContent = fs.readFileSync(envPath);
const baseEnv = dotenv.parse(envContent);

// Prefer shell NODE_ENV, but fall back to NODE_ENV from the base .env file.
const nodeEnv = process.env.NODE_ENV || baseEnv.NODE_ENV;

let env = baseEnv;
if (nodeEnv) {
  const envSpecificPath = getEnvSpecificPath(envPath, nodeEnv);
  console.log(`Looking for environment-specific file: ${envSpecificPath}`);
  if (fs.existsSync(envSpecificPath)) {
    console.log(`Found environment-specific file: ${envSpecificPath}`);
    const specificEnvContent = fs.readFileSync(envSpecificPath);
    const specificEnv = dotenv.parse(specificEnvContent);
    env = { ...baseEnv, ...specificEnv };
  }
}

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
  const cleaned =  Object.fromEntries(
    Object.entries(output).map(([key, value]) => [key, value.replace(/\\n/g, "\n")]),
  );
  cleaned["DATABASE_URL"] = `postgresql://${cleaned["DB_USER"]}:${cleaned["DB_PASSWORD"]}@${cleaned["DB_HOST"]}:${cleaned["DB_PORT"]}/${cleaned["DB_NAME"]}?ssl=true`;
  return cleaned;
}

/**
 * Get the path to an environment-specific .env file based on the base .env path and the NODE_ENV value.
 * @param {string} baseEnvPath - The path to the base .env file.
 * @param {string} nodeEnv - The NODE_ENV value.
 * @returns {string} - The path to the environment-specific .env file.
 */
function getEnvSpecificPath(baseEnvPath, nodeEnv) {
  const dir = path.dirname(baseEnvPath);
  const file = path.basename(baseEnvPath);

  if (file === ".env") {
    return path.join(dir, `.env.${nodeEnv}`);
  }

  return `${baseEnvPath}.${nodeEnv}`;
}