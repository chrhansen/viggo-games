import { copyFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const distDir = resolve("dist");
const indexPath = resolve(distDir, "index.html");
const notFoundPath = resolve(distDir, "404.html");

if (!existsSync(indexPath)) {
  throw new Error(`Missing build output: ${indexPath}`);
}

copyFileSync(indexPath, notFoundPath);
console.log(`Prepared SPA fallback at ${notFoundPath}`);
