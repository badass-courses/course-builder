# aihero-cli

AI Hero CLI with JSON-first output and app-profile-aware auth.

## Install

Install the latest GitHub Release binary:

```bash
curl -fsSL https://raw.githubusercontent.com/badass-courses/course-builder/main/packages/aihero-cli/scripts/install.sh | sh
```

Install a specific release tag:

```bash
curl -fsSL https://raw.githubusercontent.com/badass-courses/course-builder/main/packages/aihero-cli/scripts/install.sh | sh -s -- --version aihero-cli-v0.1.0
```

By default, this installs `aihero` to `~/.local/bin`. Override with:

```bash
curl -fsSL https://raw.githubusercontent.com/badass-courses/course-builder/main/packages/aihero-cli/scripts/install.sh | sh -s -- --install-dir /usr/local/bin
```

## Release Process (GitHub Releases)

Release assets are built with Bun (`--compile`) and published to GitHub Releases:

- `aihero-darwin-x64.tar.gz`
- `aihero-darwin-arm64.tar.gz`
- `aihero-linux-x64.tar.gz`
- `aihero-linux-arm64.tar.gz`
- `aihero-checksums.txt`

Release tags use:

```text
aihero-cli-v<version>
```

Examples:

```text
aihero-cli-v0.1.0
aihero-cli-v0.2.3
```

You can publish via:

1. Push a matching tag, or
2. Run the `aihero-cli-release` GitHub Actions workflow manually.

## Local Build

Build all release assets locally:

```bash
pnpm --filter @coursebuilder/aihero-cli build:release-assets
```
