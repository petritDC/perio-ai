import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

// Pin Turbopack root when multiple lockfiles exist (e.g. parent ~/package-lock.json),
// so resolution uses this app's package.json and node_modules (tailwindcss, etc.).
const turbopackRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: turbopackRoot,
  },
};

export default nextConfig;
