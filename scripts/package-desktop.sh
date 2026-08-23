#!/usr/bin/env bash
# Build the Clara desktop binary (AppImage on Linux, portable zip on Windows).
#
# Why a deploy step: Electron Packager bundles the APP directory's node_modules,
# but pnpm (monorepo) resolves deps at the repo root. `pnpm deploy` produces a
# self-contained tree with a real, flat node_modules that Packager can consume,
# and where QVAC's Forge plugin finds @qvac/sdk + its prebuilds.
#
# Usage:
#   scripts/package-desktop.sh            # host platform, host arch
#   HOST=win32-x64 scripts/package-desktop.sh
#
# Requirements: Node 24, corepack (pnpm). Linux AppImage also needs
# `mksquashfs` (Debian/Ubuntu: `apt-get install squashfs-tools`).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOST="${HOST:-$(node -p "process.platform==='win32'?'win32-x64':process.platform+'-x64'")}"
PLATFORM="${HOST%%-*}"
OUT="${OUT:-$ROOT/desktop-build}"

echo "▸ Packaging Clara desktop for host=$HOST platform=$PLATFORM"
rm -rf "$OUT"

# 1) Self-contained deploy tree (real node_modules, no workspace symlinks).
pnpm --filter clara-desktop deploy --legacy "$OUT"
cd "$OUT"
printf 'node-linker=hoisted\n' > .npmrc                    # Forge's pnpm gate
# Only bundle prebuilds for the target host.
sed -i.bak "s/hosts: \[[^]]*\]/hosts: ['$HOST']/" forge.config.cjs && rm -f forge.config.cjs.bak

# 2) Build main (ESM) + preload (CJS) + renderer (+ brand assets).
node esbuild.main.mjs
./node_modules/.bin/esbuild src/preload.ts  --bundle --platform=node --format=cjs --external:electron --outfile=dist/preload.cjs
./node_modules/.bin/esbuild src/renderer/app.tsx --bundle --format=iife --jsx=automatic --outfile=dist/renderer/app.js
node -e "const fs=require('fs');fs.mkdirSync('dist/renderer/assets',{recursive:true});fs.copyFileSync('src/renderer/index.html','dist/renderer/index.html');for(const f of fs.readdirSync('src/renderer/assets'))fs.copyFileSync('src/renderer/assets/'+f,'dist/renderer/assets/'+f)"

# 3) Package + make the distributable (AppImage / zip).
./node_modules/.bin/electron-forge make --platform="$PLATFORM" --arch=x64

echo "▸ Done. Artifacts under: $OUT/out/make/"
find "$OUT/out/make" -type f 2>/dev/null || true
