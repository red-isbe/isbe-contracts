#!/usr/bin/env bash
set -euo pipefail

# Submodule Initialization Script
# Usage: ./scripts/init-submodules.sh

if [[ ! -f ".gitmodules" ]]; then
  echo "❌ Error: .gitmodules not found. Run this script from the repository root."
  exit 1
fi

echo "🔄 Syncing submodule configuration..."
git submodule sync --recursive

echo "📥 Initializing and updating submodules..."
git submodule update --init --recursive

echo "✅ Submodules successfully initialized."