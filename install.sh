#!/bin/sh
set -eu

repository="sonsu-lee/templates"
version="${SEED_VERSION:-latest}"

fail() {
  printf 'seed installer: %s\n' "$1" >&2
  exit 1
}

for command_name in curl tar awk; do
  command -v "$command_name" >/dev/null 2>&1 || fail "missing required command: $command_name"
done

case "$(uname -s)" in
  Darwin) platform="darwin" ;;
  Linux) platform="linux" ;;
  *) fail "unsupported operating system: $(uname -s)" ;;
esac

case "$(uname -m)" in
  arm64 | aarch64) architecture="arm64" ;;
  x86_64 | amd64) architecture="x64" ;;
  *) fail "unsupported architecture: $(uname -m)" ;;
esac

archive="seed-${platform}-${architecture}.tar.gz"
if [ -n "${SEED_RELEASE_BASE_URL:-}" ]; then
  release_base="${SEED_RELEASE_BASE_URL%/}"
elif [ "$version" = "latest" ]; then
  release_base="https://github.com/${repository}/releases/latest/download"
else
  case "$version" in
    v[0-9]*.[0-9]*.[0-9]*) ;;
    *) fail "SEED_VERSION must be latest or a tag such as v0.1.1" ;;
  esac
  release_base="https://github.com/${repository}/releases/download/${version}"
fi

if [ -n "${SEED_INSTALL_DIR:-}" ]; then
  install_dir="$SEED_INSTALL_DIR"
else
  [ -n "${HOME:-}" ] || fail "HOME is unset; set SEED_INSTALL_DIR explicitly"
  install_dir="$HOME/.local/bin"
fi

temporary_dir="$(mktemp -d "${TMPDIR:-/tmp}/seed-install.XXXXXX")"
temporary_binary=""
cleanup() {
  rm -rf "$temporary_dir"
  if [ -n "$temporary_binary" ]; then
    rm -f "$temporary_binary"
  fi
}
trap cleanup EXIT HUP INT TERM

curl -fsSL "$release_base/$archive" -o "$temporary_dir/$archive"
curl -fsSL "$release_base/SHA256SUMS" -o "$temporary_dir/SHA256SUMS"

expected_checksum="$(awk -v name="$archive" '$2 == name { print $1 }' "$temporary_dir/SHA256SUMS")"
[ -n "$expected_checksum" ] || fail "SHA256SUMS does not contain $archive"

if command -v sha256sum >/dev/null 2>&1; then
  actual_checksum="$(sha256sum "$temporary_dir/$archive" | awk '{ print $1 }')"
elif command -v shasum >/dev/null 2>&1; then
  actual_checksum="$(shasum -a 256 "$temporary_dir/$archive" | awk '{ print $1 }')"
else
  fail "missing required checksum command: sha256sum or shasum"
fi

[ "$actual_checksum" = "$expected_checksum" ] || fail "checksum mismatch for $archive"

mkdir -p "$temporary_dir/extracted"
tar -xzf "$temporary_dir/$archive" -C "$temporary_dir/extracted"
[ -f "$temporary_dir/extracted/seed" ] || fail "$archive does not contain seed"

mkdir -p "$install_dir"
temporary_binary="$install_dir/.seed.$$"
cp "$temporary_dir/extracted/seed" "$temporary_binary"
chmod 755 "$temporary_binary"
mv "$temporary_binary" "$install_dir/seed"
temporary_binary=""

"$install_dir/seed" --version
printf 'Installed seed to %s\n' "$install_dir/seed"
case ":${PATH:-}:" in
  *":$install_dir:"*) ;;
  *) printf 'Add %s to PATH to run seed directly.\n' "$install_dir" ;;
esac
