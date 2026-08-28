import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/postcss";
import { defineConfig } from "vite";

export default defineConfig(({ mode }) => {
  const isVercel = mode === "vercel";
  // GitHub project sites use a repository prefix; Vercel serves from the root.
  const base = isVercel ? "/" : `${(process.env.PAGES_BASE_PATH ?? "/cybersteel-production-game").replace(/\/$/, "")}/`;
  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  const defaultSiteUrl = isVercel
    ? (vercelHost ? `https://${vercelHost}` : "http://localhost:4173")
    : "https://newnarrative650.github.io/cybersteel-production-game";
  const siteUrl = (process.env.PAGES_SITE_URL ?? defaultSiteUrl).replace(/\/$/, "");

  return {
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
    build: { outDir: isVercel ? "dist-vercel" : "dist-pages" },
  };
});
