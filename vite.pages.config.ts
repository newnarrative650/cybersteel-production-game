import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/postcss";
import { defineConfig } from "vite";

const base = `${(process.env.PAGES_BASE_PATH ?? "/cybersteel-production-game").replace(/\/$/, "")}/`;
const siteUrl = (process.env.PAGES_SITE_URL ?? "https://newnarrative650.github.io/cybersteel-production-game").replace(/\/$/, "");

export default defineConfig({
  base,
  define: { __PUBLIC_BASE__: JSON.stringify(base) },
  plugins: [
    react(),
    {
      name: "pages-metadata",
      transformIndexHtml: html => html.replaceAll("__SITE_URL__", siteUrl),
    },
  ],
  css: { postcss: { plugins: [tailwindcss()] } },
  build: { outDir: "dist-pages" },
});
