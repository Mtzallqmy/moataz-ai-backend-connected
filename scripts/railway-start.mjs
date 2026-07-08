import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

function run(cmd, args, options = {}) {
  console.log(`$ ${cmd} ${args.join(" ")}`);
  const result = spawnSync(cmd, args, { stdio: "inherit", shell: false, ...options });
  return result.status === 0;
}

function mustRun(cmd, args, options = {}) {
  if (!run(cmd, args, options)) {
    console.error(`Command failed: ${cmd} ${args.join(" ")}`);
    process.exit(1);
  }
}

// Validate the DATABASE_URL environment variable. The application requires a
// PostgreSQL connection string (Supabase or any other hosted Postgres).
const databaseUrl = process.env.DATABASE_URL || "";
if (!databaseUrl || !/^postgres(?:ql)?:\/\//.test(databaseUrl)) {
  console.error("❌ DATABASE_URL is missing or not a PostgreSQL/Supabase URL.");
  console.error("Set DATABASE_URL in Railway variables to your Supabase pooler URI (postgres://...).");
  process.exit(1);
}

console.log("🗄️ Preparing database and generating Prisma client...");
// Always generate the Prisma client to ensure the latest schema is used.
mustRun("npx", ["prisma", "generate"]);

// If migrations are present, prefer migrate deploy. Otherwise fall back to db push.
if (existsSync("prisma/migrations")) {
  console.log("🔄 Applying Prisma migrations...");
  const migrated = run("npx", ["prisma", "migrate", "deploy"]);
  if (!migrated) {
    console.warn("⚠️ Migrate deploy failed, attempting to push schema via prisma db push ...");
    mustRun("npx", ["prisma", "db", "push", "--accept-data-loss"]);
  }
} else {
  console.log("🔄 No migrations directory found. Pushing schema via prisma db push...");
  mustRun("npx", ["prisma", "db", "push", "--accept-data-loss"]);
}

// Run seed script if present (.cjs preferred over .js). Seeds populate the
// database with default providers, models and initial admin accounts.
const seedCjs = existsSync("prisma/seed.cjs");
const seedJs = existsSync("prisma/seed.js");
if (seedCjs || seedJs) {
  const seedFile = seedCjs ? "prisma/seed.cjs" : "prisma/seed.js";
  console.log(`🌱 Running database seed from ${seedFile}...`);
  const seeded = run("node", [seedFile]);
  if (!seeded) {
    console.warn("⚠️ Seed script exited with non-zero status. Continuing startup anyway.");
  }
}

// Start the Express server. Bind to 0.0.0.0 so Railway can expose it.
const port = process.env.PORT || "3001";
console.log(`🚀 Starting Moataz AI Backend on 0.0.0.0:${port}...`);
const child = spawn("node", ["server.mjs"], {
  stdio: "inherit",
  env: { ...process.env, HOSTNAME: "0.0.0.0", PORT: port, NODE_ENV: "production" },
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.exit(0);
  }
  process.exit(code ?? 0);
});
