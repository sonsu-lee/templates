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

Installing the private `@sonsu-lee/seed` package requires Node.js 24 or newer, npm, and a GitHub personal access token (classic) with `read:packages`. Generated projects require pnpm 12.3.4. The package includes native binaries for macOS 15 and Ubuntu 24.04 on arm64 and x64, plus Windows x64 validated on the `windows-2025` runner. Other platforms and older operating-system releases are not supported or verified.

Building the CLI from source requires Rust stable. `rustfmt` and Clippy are needed only for the development checks.

## Quick Start

Create a [personal access token (classic)](https://github.com/settings/tokens) with `read:packages`, then run these commands in a POSIX shell or PowerShell. Enter your GitHub username and use the token as the password when `npm login` prompts.

```sh
npm login --scope=@sonsu-lee --auth-type=legacy --registry=https://npm.pkg.github.com
npm install --global @sonsu-lee/seed
seed --version
seed template create "$HOME/my-app" --template next
cd "$HOME/my-app"
pnpm install --frozen-lockfile
pnpm dev
```

The web app is available at <http://localhost:3000>. See the generated README for template-specific environment and deployment details. Run `npm update --global @sonsu-lee/seed` to update the CLI.

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

The npm package contains the native CLI and embedded templates. After installation, project creation needs Node.js to launch the native binary but needs no Rust, pnpm, source repository, or network. It copies the template configuration, lockfile, README, and `.env.example`, but does not install dependencies, initialize Git, rename packages, or add an ORM or plugins. A new package version is required after editing a template.

## Development

Run these checks from a Git checkout on macOS or Linux with Git available.

```sh
cargo fmt --check
cargo clippy --locked --all-targets -- -D warnings
cargo test --locked
SEED_SOURCE_REVISION="$(git rev-parse HEAD)" cargo build --release --locked
node --check bin/seed.mjs
node --test tests/*.test.mjs
node scripts/verify.mjs
```

`node scripts/verify.mjs` creates and validates all three generated templates. Local builds without `SEED_SOURCE_REVISION` report `source local`.

Tags must match both the Cargo and npm package versions, for example `v0.1.0`. Pushing a matching tag runs `.github/workflows/release.yml`, which builds and smoke-tests five native binaries, assembles them behind the `seed` launcher, and publishes the single private `@sonsu-lee/seed` package to GitHub Packages. The package version, source commit shown by `seed --version`, and embedded templates all refer to the same repository revision.
