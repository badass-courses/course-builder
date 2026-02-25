#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
PKG_DIR="$ROOT_DIR/packages/aihero-cli"
OUTPUT_DIR="${1:-$PKG_DIR/release}"

mkdir -p "$OUTPUT_DIR"
rm -rf "$OUTPUT_DIR"/*

build_target() {
	local target="$1"
	local os="$2"
	local arch="$3"
	local stage_dir="$OUTPUT_DIR/stage/$os-$arch"
	local archive="$OUTPUT_DIR/aihero-$os-$arch.tar.gz"

	mkdir -p "$stage_dir"

	echo "Building $target -> $archive"
	bun build "$PKG_DIR/src/cli.ts" \
		--compile \
		--target="$target" \
		--outfile "$stage_dir/aihero"

	chmod +x "$stage_dir/aihero"
	tar -czf "$archive" -C "$stage_dir" aihero
}

build_target "bun-linux-x64" "linux" "x64"
build_target "bun-linux-arm64" "linux" "arm64"
build_target "bun-darwin-x64" "darwin" "x64"
build_target "bun-darwin-arm64" "darwin" "arm64"

(
	cd "$OUTPUT_DIR"
	shasum -a 256 aihero-*.tar.gz > aihero-checksums.txt
)

echo "Release assets written to: $OUTPUT_DIR"
