# Release Process

This document describes how to create a new release for Inker.

## Prerequisites

Install GitHub CLI:
```bash
# macOS
brew install gh

# Or download from https://cli.github.com/
```

Login to GitHub CLI:
```bash
gh auth login
```

## Automated Release (Recommended)

Use the release script:

```bash
./scripts/release.sh 0.0.2
```

This script will:
1. Update package.json version
2. Move unreleased changes in CHANGELOG.md to new version section
3. Commit changes
4. Create and push git tag
5. Create GitHub release with changelog content

## Manual Release

If you prefer manual control:

1. **Update CHANGELOG.md**
   - Move items from `[Unreleased]` section to a new version section
   - Use format: `## [X.Y.Z] - YYYY-MM-DD`
   - Organize changes under: Added, Changed, Fixed, Deprecated, Removed, Security

   Example:
   ```markdown
   ## [0.0.2] - 2026-01-11
   
   ### Added
   - Ctrl+C interrupt support during LLM operations
   
   ### Fixed
   - Streaming response display issues
   ```

2. **Update package.json version**
   ```bash
   npm version 0.0.2 --no-git-tag-version
   ```

3. **Commit changes**
   ```bash
   git add CHANGELOG.md package.json package-lock.json
   git commit -m "Release v0.0.2"
   ```

4. **Create and push tag**
   ```bash
   git tag v0.0.2
   git push origin main
   git push origin v0.0.2
   ```

5. **Create GitHub Release**
   - Go to https://github.com/yourusername/inker/releases
   - Click "Create a new release"
   - Select tag: `v0.0.2`
   - Release title: `v0.0.2`
   - Description: Copy the version section from CHANGELOG.md
   - Click "Publish release"

## Version Numbering

Follow [Semantic Versioning](https://semver.org/):
- **MAJOR** (X.0.0): Breaking changes
- **MINOR** (0.X.0): New features, backward compatible
- **PATCH** (0.0.X): Bug fixes, backward compatible
