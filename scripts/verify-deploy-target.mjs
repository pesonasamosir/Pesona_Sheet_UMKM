/**
 * Deploy-target diagnostic for PESONA.
 * Confirms Vercel will not pick Flask/SQLite entrypoints.
 * Writes NDJSON to debug-90c741.log
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const logPath = path.join(root, "debug-90c741.log");

function log(hypothesisId, message, data) {
  // #region agent log
  const entry = {
    sessionId: "90c741",
    runId: "deploy-target",
    hypothesisId,
    location: "scripts/verify-deploy-target.mjs",
    message,
    data,
    timestamp: Date.now(),
  };
  fs.appendFileSync(logPath, JSON.stringify(entry) + "\n", "utf8");
  // #endregion
  console.log(`[${hypothesisId}] ${message}`, data);
}

const hasAppPy = fs.existsSync(path.join(root, "app.py"));
const hasFlaskApp = fs.existsSync(path.join(root, "flask_app.py"));
const hasRequirements = fs.existsSync(path.join(root, "requirements.txt"));
const hasFlaskRequirements = fs.existsSync(
  path.join(root, "requirements.flask.txt"),
);
const hasWebPkg = fs.existsSync(path.join(root, "web", "package.json"));
const hasVercelJson = fs.existsSync(path.join(root, "vercel.json"));
const hasRootPkg = fs.existsSync(path.join(root, "package.json"));

let webIsNext = false;
if (hasWebPkg) {
  const pkg = JSON.parse(
    fs.readFileSync(path.join(root, "web", "package.json"), "utf8"),
  );
  webIsNext = Boolean(pkg.dependencies?.next || pkg.devDependencies?.next);
}

let vercelConfig = null;
if (hasVercelJson) {
  vercelConfig = JSON.parse(fs.readFileSync(path.join(root, "vercel.json"), "utf8"));
}

// H-A: Python auto-detect risk
log("A", "Python entrypoint detection risk", {
  hasAppPy,
  hasRequirements,
  pythonAutoDetectRisk: hasAppPy || hasRequirements,
  flaskMovedTo: {
    flask_app_py: hasFlaskApp,
    requirements_flask_txt: hasFlaskRequirements,
  },
});

// H-C: Next.js / vercel config present
log("C", "Next.js deploy target config", {
  hasWebPkg,
  webIsNext,
  hasVercelJson,
  hasRootPkg,
  vercelFramework: vercelConfig?.framework ?? null,
  installCommand: vercelConfig?.installCommand ?? null,
  buildCommand: vercelConfig?.buildCommand ?? null,
  outputDirectory: vercelConfig?.outputDirectory ?? null,
});

// H-B: would Flask mkdir fail on read-only? (simulated)
const simulatedReadOnly = true;
const dbPath = path.join(root, "database");
log("B", "SQLite mkdir would fail on Vercel read-only FS", {
  simulatedReadOnly,
  attemptedPath: "/var/task/database",
  localDbPathExists: fs.existsSync(dbPath),
  expectedError: "OSError Errno 30 Read-only file system",
  mitigatedByNotDeployingFlask: !hasAppPy && !hasRequirements,
});

const ok =
  !hasAppPy &&
  !hasRequirements &&
  webIsNext &&
  hasVercelJson &&
  vercelConfig?.framework === "nextjs";

log("D", "Deploy readiness verdict", {
  ok,
  recommendation:
    "In Vercel Project Settings → General → Root Directory, set to 'web' (recommended). Then Redeploy.",
});

if (!ok) {
  process.exitCode = 1;
  console.error("\nDeploy target NOT ready.");
} else {
  console.log("\nDeploy target looks ready (Next.js). Also set Vercel Root Directory = web.");
}
