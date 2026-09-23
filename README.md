# Personal Application Templates

**English** | [한국어](README.ko.md) | [日本語](README.ja.md)

Create a personal application with the `sonsu` CLI. Choose one of three embedded Next.js templates, then install the generated project's dependencies separately.

## Choose a template

Run `sonsu templates` to list the available choices; use `sonsu create DEST` to generate a project from one of them.

| Template | What you get | Deployment | Selection |
| --- | --- | --- | --- |
| [`next-fullstack`](templates/next-fullstack/README.md) | One Next.js app serves the UI and API | Node server | `--template next` |
| [`next-node-nest`](templates/next-node-nest/README.md) | Separate Next.js web and NestJS API apps | Two Node servers | `--template next-nest --web node` |
| [`next-static-nest`](templates/next-static-nest/README.md) | Next.js static web export and a separate NestJS API | Static host for web, Node server for API | `--template next-nest --web static` |

Use the fullstack template for one server, the Node/Nest template when the web and API need separate servers, or the static/Nest template when the web must be hosted as static files. See each generated README for deployment and environment settings.

## Requirements and release status

The shell installer supports macOS 15 and Ubuntu 24.04 on arm64 and x64. It needs `curl`, `tar`, `awk`, and either `sha256sum` or `shasum`. A Windows x64 `sonsu.exe` is distributed in a ZIP archive instead of through the shell installer. Generated projects require Node.js 24 or newer and pnpm 12.3.4. Rust stable, rustfmt, and Clippy are needed only to develop this repository.

Install [Node.js 24+](https://nodejs.org/en/download) first, then install the required package manager with `npm install -g pnpm@12.3.4` before running the quick start.

**Release prerequisite:** The commands below install `v0.2.0` artifacts, which must first be published to [GitHub Releases](https://github.com/sonsu-lee/templates/releases). A source checkout or this README alone does not make those downloads available. If the release is not there yet, wait for publication or build from source as described under Development; do not use the older `seed` CLI for these commands.

The rename is a breaking change, not an alias: installing `sonsu` does not remove a previously installed `$HOME/.local/bin/seed`. You may remove that old executable manually if you no longer need it.

## Install, create, run

On supported macOS or Ubuntu, after the `v0.2.0` release is available:

```sh
curl -fsSL https://raw.githubusercontent.com/sonsu-lee/templates/main/install.sh | SONSU_VERSION=v0.2.0 sh
export PATH="$HOME/.local/bin:$PATH"
sonsu --version
sonsu templates
sonsu create "$HOME/my-app" --template next
cd "$HOME/my-app"
pnpm install --frozen-lockfile
pnpm dev
```

Open <http://localhost:3000>. The installer verifies the release archive against `SHA256SUMS` and puts `sonsu` in `$HOME/.local/bin` by default. The `export PATH=...` line applies to the current shell; add it to your shell's startup file (for example `~/.zshrc` or `~/.bashrc`) for future terminals. If you choose another directory, run the installer with `SONSU_INSTALL_DIR=/your/bin` and add that directory to `PATH`. On Windows x64, download `sonsu-win32-x64.zip` from the same release, extract `sonsu.exe`, and add its containing directory to `PATH`; then use the same `sonsu templates` and `sonsu create ...` commands in a new terminal.

To update after a newer release is published, rerun the installer without `SONSU_VERSION` to get the latest release. To keep or reinstall this version, rerun the pinned command above (`SONSU_VERSION=v0.2.0`). `SONSU_RELEASE_BASE_URL` can point the installer at another release-asset base URL when using a mirror. Installing the CLI does **not** install Node.js, pnpm, or the generated project's dependencies.

## CLI usage

```sh
sonsu templates
sonsu create ../my-app
sonsu create ../my-app --template next
sonsu create ../my-service --template next-nest --web node
sonsu create ../my-static --template next-nest --web static
```

`sonsu templates` lists the available templates; `sonsu create DEST` generates a project at `DEST`. The `create` form without `--template` opens an interactive architecture menu in a terminal. Choosing Next.js + NestJS opens a second menu for Node server or static web deployment. For scripts and other non-interactive use, pass `--template`; `--template next-nest` without `--web` selects Node. `--template next --web static` is not supported.

The destination's parent must already exist, and the destination itself must not exist: `create` never overwrites a file or directory. Templates are embedded in `sonsu`, so creating a project works offline; installing its dependencies with `pnpm install --frozen-lockfile` is a separate step that may require network access. Project creation does not initialize Git.

## Development

```sh
cargo fmt --check
cargo clippy --locked --all-targets -- -D warnings
cargo test --locked
SONSU_SOURCE_REVISION="$(git rev-parse HEAD)" cargo build --release --locked
./target/release/sonsu --version
sh -n install.sh
node --check bin/sonsu.mjs
node --test tests/*.test.mjs
node scripts/verify.mjs
```

`node scripts/verify.mjs` creates and validates all three templates. A tag `v0.2.0` matching the Cargo and npm package version is required to publish the native release archives, `SHA256SUMS`, and `@sonsu-lee/templates`; this describes the release process, not a claim that the release has already been published.
