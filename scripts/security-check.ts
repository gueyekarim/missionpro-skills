import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const clientRoots = ["src/app"];
const secretPatterns = [
  /sk-[A-Za-z0-9]{20,}/,
  /OPENAI_API_KEY\s*[:=]\s*["'][^"'$]+["']/,
  /Authorization\s*:\s*["']Bearer\s+[A-Za-z0-9._-]+["']/
];
const clientFiles: string[] = [];

function collect(directory: string) {
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) collect(path);
    else if (/\.(ts|tsx|js|jsx)$/.test(path)) clientFiles.push(path);
  }
}

for (const root of clientRoots) collect(root);
const violations = clientFiles.flatMap((path) => {
  const source = readFileSync(path, "utf8");
  return secretPatterns.filter((pattern) => pattern.test(source)).map((pattern) => `${path}: ${pattern}`);
});

if (violations.length) {
  console.error("Potential client-side secret exposure detected:\n" + violations.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Security check passed: ${clientFiles.length} client/application files scanned; no embedded credentials.`);
}