#!/bin/bash
set -e

VERSION=$(node -p "require('./package.json').version")

echo "Releasing v$VERSION..."

npm run build
git add dist/
git commit -m "build: v$VERSION" || echo "No changes to commit"
git tag "v$VERSION"
git push origin main --tags

echo "Released v$VERSION"
