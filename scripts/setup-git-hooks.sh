#!/usr/bin/env sh
set -e

if [ ! -d .git ]; then
  exit 0
fi

git config core.hooksPath .githooks
chmod +x .githooks/pre-push

echo "Git hooks configured to use .githooks/"
