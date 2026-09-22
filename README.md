# Personal Application Templates

**English** | [한국어](README.ko.md) | [日本語](README.ja.md)

Create personal application projects from three embedded Next.js templates with the `seed` CLI.

## Templates

| Template | Architecture | Deployment | CLI selection |
| --- | --- | --- | --- |
| [`next-fullstack`](templates/next-fullstack/README.md) | Next.js UI and API | Node server | `--template next` |
| [`next-node-nest`](templates/next-node-nest/README.md) | Next.js web plus NestJS API | Node servers | `--template next-nest --web node` |
| [`next-static-nest`](templates/next-static-nest/README.md) | Next.js web plus NestJS API | static web plus Node API | `--template next-nest --web static` |

## Requirements

The installer supports macOS 15 and Ubuntu 24.04 on arm64 and x64, and requires `curl` and `tar`. Generated projects require Node.js 24 or newer and pnpm 12.3.4. A Windows x64 binary is available from GitHub Releases.

Rust stable, `rustfmt`, and Clippy are needed only for development.

## Quick Start

```sh
curl -fsSL https://raw.githubusercontent.com/sonsu-lee/templates/main/install.sh | sh
export PATH="$HOME/.local/bin:$PATH"
seed --version
seed template create "$HOME/my-app" --template next
cd "$HOME/my-app"
pnpm install --frozen-lockfile
pnpm dev
```

Open <http://localhost:3000>. Rerun the installer to update `seed`. To pin a release, use `curl -fsSL https://raw.githubusercontent.com/sonsu-lee/templates/main/install.sh | SEED_VERSION=v0.1.1 sh`.

## CLI Usage

```sh
seed --version
seed template list
seed template create ../my-app --template next
seed template create ../my-service --template next-nest --web node
seed template create ../my-static --template next-nest --web static
```

Running `seed template create` without `--template` opens an interactive menu. `--template next-nest` defaults to Node deployment when `--web` is omitted.

The destination's parent must exist, and an existing path is never overwritten. Templates are embedded in the binary, so project creation works offline and does not install dependencies or initialize Git.

## Development

```sh
cargo fmt --check
cargo clippy --locked --all-targets -- -D warnings
cargo test --locked
SEED_SOURCE_REVISION="$(git rev-parse HEAD)" cargo build --release --locked
sh -n install.sh
node --check bin/seed.mjs
node --test tests/*.test.mjs
node scripts/verify.mjs
```

`node scripts/verify.mjs` creates and validates all three templates. Pushing a tag matching the Cargo and npm versions publishes native release archives, `SHA256SUMS`, and `@sonsu-lee/templates`.
