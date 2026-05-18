#!/usr/bin/env bash
# Copy shared marketing assets into public/ for Next.js static export and hosts
# (e.g. Cloudflare Pages) where the deploy artifact is `website/out/`.
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p public/assets
cp -f ../public/puremac.webp ../public/intro-video.mp4 public/assets/
