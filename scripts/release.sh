#!/bin/bash
set -e

# Check if version is provided
if [ -z "$1" ]; then
  echo "Usage: ./scripts/release.sh <version>"
  echo "Example: ./scripts/release.sh 0.0.2"
  exit 1
fi

VERSION=$1
DATE=$(date +%Y-%m-%d)

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
  echo "Error: GitHub CLI (gh) is not installed"
  echo "Install it from: https://cli.github.com/"
  exit 1
fi

# Check if logged in to gh
if ! gh auth status &> /dev/null; then
  echo "Error: Not logged in to GitHub CLI"
  echo "Run: gh auth login"
  exit 1
fi

echo "Creating release v$VERSION..."

# Update package.json version
npm version $VERSION --no-git-tag-version

# Extract unreleased changes from CHANGELOG.md
UNRELEASED=$(sed -n '/## \[Unreleased\]/,/## \[/p' CHANGELOG.md | sed '1d;$d')

if [ -z "$UNRELEASED" ]; then
  echo "Error: No unreleased changes found in CHANGELOG.md"
  exit 1
fi

# Update CHANGELOG.md - add new version section after Unreleased
sed -i.bak "/## \[Unreleased\]/a\\
\\
## [$VERSION] - $DATE\\
$UNRELEASED
" CHANGELOG.md

# Clear Unreleased section
sed -i.bak '/## \[Unreleased\]/,/## \[/{/## \[Unreleased\]/!{/## \[/!d;}}' CHANGELOG.md

rm CHANGELOG.md.bak

# Commit changes
git add CHANGELOG.md package.json package-lock.json
git commit -m "Release v$VERSION"

# Create and push tag
git tag v$VERSION
git push origin main
git push origin v$VERSION

# Extract release notes for this version
RELEASE_NOTES=$(sed -n "/## \[$VERSION\]/,/## \[/p" CHANGELOG.md | sed '1d;$d')

# Create GitHub release
echo "$RELEASE_NOTES" | gh release create v$VERSION \
  --title "v$VERSION" \
  --notes-file -

echo "✅ Release v$VERSION created successfully!"
echo "View at: $(gh repo view --json url -q .url)/releases/tag/v$VERSION"
