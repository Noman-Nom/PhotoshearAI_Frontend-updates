#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/run-docker-compose.sh

cd "$(dirname "$0")/.."
docker compose up --build -d
