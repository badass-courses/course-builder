#!/usr/bin/env sh
set -eu

REPO="badass-courses/course-builder"
INSTALL_DIR="${COURSEBUILDER_INSTALL_DIR:-$HOME/.local/bin}"
VERSION="latest"

usage() {
	cat <<'EOF'
Install coursebuilder CLI from GitHub Releases.

Usage:
  install.sh [--version <tag>] [--install-dir <path>] [--repo <owner/repo>]

Options:
  --version      Release tag (default: latest coursebuilder-cli-v* release)
  --install-dir  Install directory (default: ~/.local/bin)
  --repo         GitHub repo (default: badass-courses/course-builder)
  -h, --help     Show this help
EOF
}

while [ "$#" -gt 0 ]; do
	case "$1" in
	--version)
		VERSION="$2"
		shift 2
		;;
	--install-dir)
		INSTALL_DIR="$2"
		shift 2
		;;
	--repo)
		REPO="$2"
		shift 2
		;;
	-h | --help)
		usage
		exit 0
		;;
	*)
		echo "Unknown option: $1" >&2
		usage >&2
		exit 1
		;;
	esac
done

uname_s="$(uname -s)"
uname_m="$(uname -m)"

case "$uname_s" in
Darwin) os="darwin" ;;
Linux) os="linux" ;;
*)
	echo "Unsupported OS: $uname_s" >&2
	exit 1
	;;
esac

case "$uname_m" in
x86_64 | amd64) arch="x64" ;;
arm64 | aarch64) arch="arm64" ;;
*)
	echo "Unsupported architecture: $uname_m" >&2
	exit 1
	;;
esac

if [ "$VERSION" = "latest" ]; then
	releases_json="$(curl -fsSL "https://api.github.com/repos/$REPO/releases?per_page=100")"
	VERSION="$(printf '%s' "$releases_json" |
		tr '\n' ' ' |
		sed 's/},{/}\n{/g' |
		grep -o '"tag_name":"coursebuilder-cli-v[^"]*"' |
		head -n 1 |
		cut -d'"' -f4)"

	if [ -z "$VERSION" ]; then
		echo "Could not find any coursebuilder-cli-v* release tags in $REPO." >&2
		exit 1
	fi
elif [ "${VERSION#coursebuilder-cli-v}" = "$VERSION" ]; then
	VERSION="coursebuilder-cli-v$VERSION"
fi

asset="coursebuilder-$os-$arch.tar.gz"
download_url="https://github.com/$REPO/releases/download/$VERSION/$asset"

tmpdir="$(mktemp -d)"
cleanup() {
	rm -rf "$tmpdir"
}
trap cleanup EXIT INT TERM

echo "Downloading $download_url"
curl -fsSL "$download_url" -o "$tmpdir/$asset"

tar -xzf "$tmpdir/$asset" -C "$tmpdir"

mkdir -p "$INSTALL_DIR"
install -m 755 "$tmpdir/coursebuilder" "$INSTALL_DIR/coursebuilder"

echo "Installed coursebuilder to: $INSTALL_DIR/coursebuilder"

case ":${PATH:-}:" in
*":$INSTALL_DIR:"*) ;;
*)
	echo "Add this to your shell profile:"
	echo "  export PATH=\"$INSTALL_DIR:\$PATH\""
	;;
esac
