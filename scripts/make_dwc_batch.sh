#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${1:-}" ]]; then
  echo "Usage: make_dwc_batch.sh <batch_name>"
  exit 1
fi

BATCH_NAME="$1"
BASE_DIR="/Users/moonshade/Intake/discowarpcore"

# Ensure base dir exists
mkdir -p "$BASE_DIR"

# Simple slug
SAFE_NAME="$(echo "$BATCH_NAME" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g')"

TIMESTAMP="$(date +"%Y-%m-%d_%H%M")"
FOLDER_NAME="${TIMESTAMP}_${SAFE_NAME}"
TARGET_DIR="${BASE_DIR}/${FOLDER_NAME}"

mkdir -p "${TARGET_DIR}/images"

# Blank JSON scaffold
echo "{}" > "${TARGET_DIR}/ai_intake.json"

echo "Created:"
echo "  ${TARGET_DIR}/"
echo "    ai_intake.json"
echo "    images/"
echo ""
echo "Drop your images into:"
echo "  ${TARGET_DIR}/images/"