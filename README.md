# Personal Application Templates

**English** | [한국어](README.ko.md) | [日本語](README.ja.md)

This repository provides three embedded Next.js project templates for personal applications. They use StyleX, Oxlint, and Oxfmt.

## Templates

| Template | Architecture | Deployment | CLI selection |
| --- | --- | --- | --- |
| [`next-fullstack`](templates/next-fullstack/README.md) | Next.js UI and API | Node server | `--template next` |
| [`next-node-nest`](templates/next-node-nest/README.md) | Next.js web plus NestJS API | Node servers | `--template next-nest --web node` |
| [`next-static-nest`](templates/next-static-nest/README.md) | Next.js web plus NestJS API | static web plus Node API | `--template next-nest --web static` |

## Requirements

Downloading releases from this private repository requires the [GitHub CLI](https://cli.github.com/) authenticated with `gh auth login`. Release binaries support macOS 15 and Ubuntu 24.04 on both arm64 and x64. Windows, other Linux distributions, and older operating-system releases are not supported or verified. Generated projects require Node.js 24 or newer and pnpm 12.3.4.

Building the CLI from source requires Rust stable. `rustfmt` and Clippy are needed only for the development checks.

## Quick Start

Choose the target matching your machine:

| Platform | Architecture | Target |
| --- | --- | --- |
| macOS | Apple silicon | `aarch64-apple-darwin` |
| macOS | Intel | `x86_64-apple-darwin` |
| Ubuntu 24.04 | arm64 | `aarch64-unknown-linux-gnu` |
| Ubuntu 24.04 | x64 | `x86_64-unknown-linux-gnu` |

This example installs the latest Apple silicon release into `~/.local/bin`, verifies its checksum, and creates a project:

```sh
gh auth login
repo=sonsu-lee/templates
tag="$(gh release view --repo "$repo" --json tagName --jq .tagName)"
target=aarch64-apple-darwin
asset="personal-template-${tag}-${target}.tar.gz"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
gh release download "$tag" --repo "$repo" --dir "$tmp" --pattern "$asset" --pattern "$asset.sha256"
if command -v shasum >/dev/null; then
  (cd "$tmp" && shasum -a 256 -c "$asset.sha256")
else
  (cd "$tmp" && sha256sum -c "$asset.sha256")
fi
tar -xzf "$tmp/$asset" -C "$tmp"
mkdir -p "$HOME/.local/bin"
install -m 755 "$tmp/personal-template" "$HOME/.local/bin/personal-template"
personal-template --version
personal-template create "$HOME/my-app" --template next
cd "$HOME/my-app"
pnpm install --frozen-lockfile
pnpm dev
```

Ensure `~/.local/bin` is on `PATH`. The web app is available at <http://localhost:3000>. See the generated README for template-specific environment and deployment details. Run the download and install steps again to update the CLI.

## CLI Usage

```sh
personal-template --version
personal-template list
personal-template create ../my-app --template next
personal-template create ../my-service --template next-nest --web node
personal-template create ../my-static --template next-nest --web static
```

`--version` reports both the package version and the source commit embedded by the release workflow. Omitting `--template` in a terminal opens an architecture menu and, for Next.js plus NestJS, a deployment menu. `--template next-nest` without `--web` selects Node. Non-terminal execution requires `--template`. Press Esc or `q` to cancel without creating a project.

The destination's parent must exist. An existing file, directory, or symlink is never overwritten. If copying fails, the CLI attempts to remove only the incomplete directory created by that invocation and reports if cleanup also fails.

The binary embeds the templates, so after it is installed, project creation needs no Rust, Node.js, pnpm, source repository, or network. It copies the template configuration, lockfile, README, and `.env.example`, but does not install dependencies, initialize Git, rename packages, or add an ORM or plugins. A new CLI release is required after editing a template.

## Development

Run these checks from a Git checkout on macOS or Linux with Git available.

```sh
cargo fmt --check
cargo clippy --locked --all-targets -- -D warnings
cargo test --locked
PERSONAL_TEMPLATE_SOURCE_REVISION="$(git rev-parse HEAD)" cargo build --release --locked
node --test tests/*.test.mjs
node scripts/verify.mjs
```

`node scripts/verify.mjs` creates and validates all three generated templates. Local builds without `PERSONAL_TEMPLATE_SOURCE_REVISION` report `source local`.

Tags must match the Cargo package version, for example `v0.1.0`. Pushing a matching tag runs `.github/workflows/release.yml`, which builds and smoke-tests native archives for the four supported targets, publishes per-archive SHA-256 files, and creates the private GitHub Release. The release tag, source commit shown by `personal-template --version`, and embedded templates all refer to the same repository revision.
