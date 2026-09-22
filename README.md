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

The public installer requires `curl` and `tar` on macOS 15 or Ubuntu 24.04, on arm64 or x64. It installs the native CLI without Node.js or Rust. Generated projects require Node.js 24 or newer and pnpm 12.3.4. Windows x64 remains available through the authenticated `@sonsu-lee/templates` GitHub Package. Other platforms and older operating-system releases are not supported or verified.

Building the CLI from source requires Rust stable. `rustfmt` and Clippy are needed only for the development checks.

## Quick Start

Run the public installer from a POSIX shell, then create and start a project:

```sh
curl -fsSL https://raw.githubusercontent.com/sonsu-lee/templates/main/install.sh | sh
export PATH="$HOME/.local/bin:$PATH"
seed --version
seed template create "$HOME/my-app" --template next
cd "$HOME/my-app"
pnpm install --frozen-lockfile
pnpm dev
```

The web app is available at <http://localhost:3000>. See the generated README for template-specific environment and deployment details. Rerun the installer to update the CLI. Set `SEED_VERSION=v0.1.1` before running it to install that exact release. As an alternative, authenticated GitHub Packages users can install `@sonsu-lee/templates`.

## CLI Usage

```sh
seed --version
seed template list
seed template create ../my-app --template next
seed template create ../my-service --template next-nest --web node
seed template create ../my-static --template next-nest --web static
```

`--version` reports both the package version and the source commit embedded by the publishing workflow. Omitting `--template` from `seed template create` in a terminal opens an architecture menu and, for Next.js plus NestJS, a deployment menu. `--template next-nest` without `--web` selects Node. Non-terminal execution requires `--template`. Press Esc or `q` to cancel without creating a project.

The destination's parent must exist. An existing file, directory, or symlink is never overwritten. If copying fails, the CLI attempts to remove only the incomplete directory created by that invocation and reports if cleanup also fails.

The installer downloads a checksum-verified native binary whose templates are embedded. After installation, project creation needs no Node.js, Rust, pnpm, source repository, or network. It copies the template configuration, lockfile, README, and `.env.example`, but does not install dependencies, initialize Git, rename packages, or add an ORM or plugins. A new release is required after editing a template.

## Development

Run these checks from a Git checkout on macOS or Linux with Git available.

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

`node scripts/verify.mjs` creates and validates all three generated templates. Local builds without `SEED_SOURCE_REVISION` report `source local`.

Tags must match both the Cargo and npm package versions, for example `v0.1.1`. Pushing a matching tag runs `.github/workflows/release.yml`, which builds and smoke-tests five native binaries, publishes checksum-protected archives in a public GitHub Release, and publishes the authenticated `@sonsu-lee/templates` package to GitHub Packages. The release version, source commit shown by `seed --version`, and embedded templates all refer to the same repository revision.
