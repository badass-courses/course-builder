#!/usr/bin/env sh
set -eu

REPO="badass-courses/course-builder"
INSTALL_DIR="${AIHERO_INSTALL_DIR:-$HOME/.local/bin}"
VERSION="latest"

usage() {
	cat <<'EOF'
Install aihero CLI from GitHub Releases.

Usage:
  install.sh [--version <tag>] [--install-dir <path>] [--repo <owner/repo>]

Options:
  --version      Release tag (default: latest aihero-cli-v* release)
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
		grep -o '"tag_name":"aihero-cli-v[^"]*"' |
		head -n 1 |
		cut -d'"' -f4)"

	if [ -z "$VERSION" ]; then
		echo "Could not find any aihero-cli-v* release tags in $REPO." >&2
		exit 1
	fi
elif [ "${VERSION#aihero-cli-v}" = "$VERSION" ]; then
	VERSION="aihero-cli-v$VERSION"
fi

asset="aihero-$os-$arch.tar.gz"
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
install -m 755 "$tmpdir/aihero" "$INSTALL_DIR/aihero"

echo "Installed aihero to: $INSTALL_DIR/aihero"

case ":${PATH:-}:" in
*":$INSTALL_DIR:"*) ;;
*)
	echo "Add this to your shell profile:"
	echo "  export PATH=\"$INSTALL_DIR:\$PATH\""
	;;
esac
