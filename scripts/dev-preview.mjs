// sites-preview supplies Vite-style flags; translate them for Next.js.
import { spawn } from "node:child_process";
const input = process.argv.slice(2),
  args = [];
for (let i = 0; i < input.length; i++) {
  if (input[i] === "--host") {
    args.push("--hostname", input[++i] ?? "0.0.0.0");
  } else if (input[i] === "--strictPort") continue;
  else args.push(input[i]);
}
const child = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "dev", "--webpack", ...args],
  { stdio: "inherit" },
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => child.kill(signal));
child.on("exit", (code) => process.exit(code ?? 0));
