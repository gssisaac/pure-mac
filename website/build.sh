#!/usr/bin/env bash
# Copy shared marketing assets into this folder for static hosts (e.g. Cloudflare Pages)
# where the deploy root is only `website/`.
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p assets
cp -f ../public/puremac.webp ../public/intro-video.mp4 assets/
