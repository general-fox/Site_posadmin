import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" });

try {
  const gitRoot = path.resolve(git("rev-parse", "--show-toplevel").trim());
  if (gitRoot.toLowerCase() !== root.toLowerCase()) {
    throw new Error("Run this script from a Git clone of the POSADMIN project.");
  }
  if (git("status", "--porcelain", "--untracked-files=normal").trim()) {
    throw new Error("Commit or review all source changes before creating a handoff archive.");
  }

  const files = git("ls-tree", "-r", "--name-only", "-z", "HEAD").split("\0").filter(Boolean);
  const forbidden = files.filter((name) => {
    const base = path.posix.basename(name);
    return (/^\.env(?:\.|$)/i.test(base) && base !== ".env.example")
      || /(^|\/)(?:private-data|node_modules|\.git|\.next(?:-build)?|output)(?:\/|$)/i.test(name)
      || /\.(?:sqlite(?:3)?(?:-wal|-shm)?|db|pem|key|p12|pfx)$/i.test(name);
  });
  if (forbidden.length) {
    throw new Error(`Refusing to package potentially private/runtime files: ${forbidden.join(", ")}`);
  }
  for (const required of ["README.md", "START-WINDOWS.cmd", "package.json", "package-lock.json"]) {
    if (!files.includes(required)) throw new Error(`Missing committed handoff file: ${required}`);
  }

  const revision = git("rev-parse", "--short=12", "HEAD").trim();
  const date = new Date().toISOString().slice(0, 10);
  const destination = path.join(root, "output", `posadmin-source-${date}-${revision}.zip`);
  if (existsSync(destination)) throw new Error(`Archive already exists; it was not overwritten: ${destination}`);
  mkdirSync(path.dirname(destination), { recursive: true });
  git("archive", "--format=zip", "--prefix=posadmin/", `--output=${destination}`, "HEAD");
  const archive = readFileSync(destination);
  console.log(`Archive: ${destination}`);
  console.log(`Source revision: ${revision}; files: ${files.length}`);
  console.log(`Size: ${(archive.length / 1024 / 1024).toFixed(2)} MiB`);
  console.log(`SHA-256: ${createHash("sha256").update(archive).digest("hex")}`);
  console.log("Only committed source files were included. No Git history or ignored local data was copied.");
} catch (error) {
  console.error(error instanceof Error ? error.message : "Handoff packaging failed.");
  process.exitCode = 1;
}
