#!/usr/bin/env bash
set -euo pipefail

# Usage: sudo ./scripts/run-certbot.sh you@example.com
# Requires certbot + nginx plugin installed on host.

EMAIL="${1:-}"
if [[ -z "${EMAIL}" ]]; then
  echo "Usage: $0 you@example.com"
  exit 1
fi

sudo certbot --nginx -d app.fotoshareai.com --agree-tos -m "${EMAIL}" --redirect
