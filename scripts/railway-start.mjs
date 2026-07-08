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

const databaseUrl = process.env.DATABASE_URL || "";
if (!databaseUrl.startsWith("postgres")) {
  console.error("❌ DATABASE_URL غير موجود أو ليس رابط PostgreSQL/Supabase.");
  console.error("ضع رابط Supabase في Railway Variables باسم DATABASE_URL.");
  process.exit(1);
}

console.log("🗄️ Preparing Supabase/PostgreSQL database...");
mustRun("npx", ["prisma", "generate"]);
mustRun("npx", ["prisma", "db", "push", "--accept-data-loss"]);

if (existsSync("prisma/seed.js")) {
  console.log("🌱 Running database seed...");
  const seeded = run("node", ["prisma/seed.js"]);
  if (!seeded) console.warn("⚠️ Seed failed, continuing startup.");
}

const port = process.env.PORT || "3001";
const child = spawn("node", ["server.mjs"], {
  stdio: "inherit",
  env: { ...process.env, HOSTNAME: "0.0.0.0", PORT: port, NODE_ENV: "production" },
});

child.on("exit", (code, signal) => {
  if (signal) process.exit(0);
  process.exit(code ?? 0);
});
