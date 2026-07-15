#!/usr/bin/env node

import esbuild from "esbuild";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const pluginDir = path.resolve(rootDir, "plugin");
const distDir = path.resolve(pluginDir, "dist");
const srcDir = path.resolve(pluginDir, "src");

// Ensure dist directory exists
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

async function build() {
  try {
    // Build code.ts -> plugin/dist/code.js (main thread, IIFE for Figma sandbox)
    console.log("Building code.ts...");
    await esbuild.build({
      entryPoints: [path.resolve(srcDir, "code.ts")],
      outfile: path.resolve(distDir, "code.js"),
      bundle: true,
      platform: "browser",
      target: "es2017",
      format: "iife",
      external: [],
    });
    console.log("✓ code.js built");

    // Build ui.ts -> code.js (temp, for inlining)
    console.log("Building ui.ts...");
    const uiBuildResult = await esbuild.build({
      entryPoints: [path.resolve(srcDir, "ui.ts")],
      outfile: path.resolve(distDir, "ui-temp.js"),
      bundle: true,
      platform: "browser",
      target: "es2017",
      format: "iife",
      write: false,
    });

    const uiJs =
      uiBuildResult.outputFiles && uiBuildResult.outputFiles.length > 0
        ? uiBuildResult.outputFiles[0].text
        : "";

    // Read ui.html and inline the bundled ui.js
    const uiHtmlPath = path.resolve(srcDir, "ui.html");
    let uiHtml = fs.readFileSync(uiHtmlPath, "utf8");

    // Replace <!-- SCRIPT --> placeholder with actual script
    uiHtml = uiHtml.replace(/<!-- SCRIPT -->/, `<script>${uiJs}</script>`);

    // Write final index.html
    fs.writeFileSync(path.resolve(distDir, "index.html"), uiHtml);
    console.log("✓ index.html built");

    console.log("✓ Build complete");
    process.exit(0);
  } catch (error) {
    console.error("Build failed:", error);
    process.exit(1);
  }
}

build();
