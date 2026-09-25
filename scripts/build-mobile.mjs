// Build aplikacji Android: statyczny SPA → cap sync → (opcjonalnie) instalacja na telefonie.
//   node scripts/build-mobile.mjs            # build + cap sync
//   node scripts/build-mobile.mjs --install  # + gradlew installDebug na podłączony telefon
//   node scripts/build-mobile.mjs --release  # + gradlew assembleRelease
import { spawnSync } from "node:child_process";
import { rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const win = process.platform === "win32";
const args = new Set(process.argv.slice(2));

function run(cmd, cmdArgs, opts = {}) {
  console.log(`\n> ${cmd} ${cmdArgs.join(" ")}`);
  const result = spawnSync(cmd, cmdArgs, { stdio: "inherit", cwd: root, shell: win, ...opts });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

rmSync(join(root, ".output"), { recursive: true, force: true });
run(process.execPath, [join(root, "node_modules/vite/bin/vite.js"), "build"], {
  env: { ...process.env, GW_TARGET: "mobile" },
  shell: false,
});
run(
  process.execPath,
  [join(root, "node_modules/@capacitor/cli/bin/capacitor"), "sync", "android"],
  {
    shell: false,
  },
);

const androidDir = join(root, "android");
const gradlew = join(androidDir, win ? "gradlew.bat" : "gradlew");
if (args.has("--install")) run(gradlew, ["installDebug"], { cwd: androidDir });
if (args.has("--release")) run(gradlew, ["assembleRelease"], { cwd: androidDir });
