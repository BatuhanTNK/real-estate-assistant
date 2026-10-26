/* eslint-disable @typescript-eslint/no-require-imports -- Standalone CommonJS maintenance script. */
/**
 * postinstall patch: Next.js MetadataWrapper hydration mismatch suppressor
 *
 * Next.js 16.x wraps metadata in a Suspense boundary that causes a harmless
 * hydration mismatch (hidden={null} on server vs hidden={true} on client).
 * This is a known framework bug. This script patches Next.js's
 * onRecoverableError to silently skip that specific error so the dev overlay
 * doesn't show it.
 */
const fs = require("fs");
const path = require("path");

const targets = [
  path.join(__dirname, "node_modules", "next", "dist", "client", "react-client-callbacks", "on-recoverable-error.js"),
  path.join(__dirname, "node_modules", "next", "dist", "esm", "client", "react-client-callbacks", "on-recoverable-error.js"),
];

const MARKER = "/* PATCHED: suppress MetadataWrapper hydration mismatch */";

for (const filePath of targets) {
  if (!fs.existsSync(filePath)) {
    console.log(`[patch] skipping (not found): ${filePath}`);
    continue;
  }

  let content = fs.readFileSync(filePath, "utf8");

  if (content.includes(MARKER)) {
    console.log(`[patch] already patched: ${path.basename(filePath)}`);
    continue;
  }

  // Insert a guard right after the isBailoutToCSRError check
  // Look for the pattern: if (isBailoutToCSRError(cause)) return;
  const bailoutPatterns = [
    // CJS version
    `if ((0, _bailouttocsr.isBailoutToCSRError)(cause)) return;`,
    // ESM version
    `if (isBailoutToCSRError(cause)) return;`,
  ];

  let patched = false;
  for (const pattern of bailoutPatterns) {
    if (content.includes(pattern)) {
      const patch = `${pattern}\n    ${MARKER}\n    if (typeof cause === 'object' && cause !== null && cause.message && cause.message.includes('Hydration failed')) return;`;
      content = content.replace(pattern, patch);
      patched = true;
      break;
    }
  }

  if (patched) {
    fs.writeFileSync(filePath, content, "utf8");
    console.log(`[patch] ✓ patched: ${path.basename(filePath)}`);
  } else {
    console.log(`[patch] ⚠ pattern not found in: ${path.basename(filePath)}`);
  }
}

console.log("[patch] done.");
