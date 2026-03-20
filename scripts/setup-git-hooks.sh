#!/usr/bin/env sh
set -e

if [ ! -d .git ]; then
  exit 0
fi

chmod +x .githooks/pre-push

if git config core.hooksPath .githooks 2>/dev/null; then
  echo "Git hooks configured to use .githooks/"
else
  echo "Skipping Git hooks setup: could not update .git/config in this environment."
fi
