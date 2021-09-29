#!/bin/bash

npm install

NPM_TAG=${2:-"beta"}
MATCHER=${3:-"*"}

NPM_NAME=$(node scripts/utils/attribute.js name)
VERSION=$(node scripts/utils/attribute.js version)

# Enable failing on exit status here because semver exits with 1 when the range
# doesn't match.
set -e

new_line()
{
  echo ""
}

verbose()
{
  echo -e " \033[36m→\033[0m $1"
}

verbose_item()
{
  echo -e " \033[96m∙\033[0m $1"
}

success()
{
  echo -e " \033[1;32m✔︎\033[0m $1"
}

cdn_release()
{
  npm run publish:cdn
  new_line
  success "$NPM_NAME ($1) uploaded to cdn"
}

# Lint
npm run lint

# Test
npm run ci:test

# Clean
rm -rf dist
rm -rf build

# Build
npm run build

# Release
new_line
cdn_release "$VERSION"
