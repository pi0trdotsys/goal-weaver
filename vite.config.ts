// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// `npm run build:mobile` ustawia GW_TARGET=mobile: statyczny build SPA pakowany
// przez Capacitor do aplikacji Android (patrz docs/android.md). Zwykły build
// (Lovable / Cloudflare) pozostaje bez zmian.
const mobile = process.env["GW_TARGET"] === "mobile";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
    ...(mobile ? { spa: { enabled: true, prerender: { outputPath: "/index.html" } } } : {}),
  },
});
