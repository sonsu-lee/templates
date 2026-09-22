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

Building the CLI requires Rust stable. Generated projects require Node.js 24 or newer and pnpm 12.3.4. `rustfmt` and Clippy are needed only for the development checks.

## Quick Start

```sh
cargo build --release --locked
./target/release/personal-template create ../my-app --template next
cd ../my-app
pnpm install --frozen-lockfile
pnpm dev
```

The web app is available at <http://localhost:3000>. See the generated README for template-specific environment and deployment details.

## CLI Usage

```sh
./target/release/personal-template list
./target/release/personal-template create ../my-app --template next
./target/release/personal-template create ../my-service --template next-nest --web node
./target/release/personal-template create ../my-static --template next-nest --web static
```

Omitting `--template` in a terminal opens an architecture menu and, for Next.js plus NestJS, a deployment menu. `--template next-nest` without `--web` selects Node. Non-terminal execution requires `--template`. Press Esc or `q` to cancel without creating a project.

The destination's parent must exist. An existing file, directory, or symlink is never overwritten. If copying fails, the CLI attempts to remove only the incomplete directory created by that invocation and reports if cleanup also fails.

The binary embeds the templates, so after it is built, project creation needs no Rust, Node.js, pnpm, source repository, or network. It copies the template configuration, lockfile, README, and `.env.example`, but does not install dependencies, initialize Git, rename packages, or add an ORM or plugins. Rebuild the binary after editing a template.

## Development

Run these checks from a Git checkout on macOS or Linux with Git available.

```sh
cargo fmt --check
cargo clippy --locked --all-targets -- -D warnings
cargo test --locked
cargo build --release --locked
node --test tests/*.test.mjs
node scripts/verify.mjs
```

`node scripts/verify.mjs` creates and validates all three generated templates.
