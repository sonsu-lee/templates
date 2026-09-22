# Personal Application Templates

[English](README.md) | [한국어](README.ko.md) | **日本語**

`seed` CLI を使い、組み込み済みの 3 種類の Next.js テンプレートから個人用アプリケーションプロジェクトを作成します。

## テンプレート

| テンプレート | アーキテクチャ | デプロイ | CLI での選択 |
| --- | --- | --- | --- |
| [`next-fullstack`](templates/next-fullstack/README.md) | Next.js の UI と API | Node サーバー | `--template next` |
| [`next-node-nest`](templates/next-node-nest/README.md) | Next.js の Web と NestJS API | Node サーバー | `--template next-nest --web node` |
| [`next-static-nest`](templates/next-static-nest/README.md) | Next.js の Web と NestJS API | 静的 Web と Node API | `--template next-nest --web static` |

## 必要条件

インストーラーは arm64 と x64 の macOS 15 および Ubuntu 24.04 をサポートし、`curl` と `tar` を使用します。生成されたプロジェクトには Node.js 24 以降と pnpm 12.3.4 が必要です。Windows x64 バイナリは GitHub Releases から入手できます。

Rust stable、`rustfmt`、Clippy は開発時にのみ必要です。

## クイックスタート

```sh
curl -fsSL https://raw.githubusercontent.com/sonsu-lee/templates/main/install.sh | sh
export PATH="$HOME/.local/bin:$PATH"
seed --version
seed template create "$HOME/my-app" --template next
cd "$HOME/my-app"
pnpm install --frozen-lockfile
pnpm dev
```

<http://localhost:3000> を開いてください。`seed` を更新するにはインストーラーを再実行します。特定のリリースをインストールするには、`curl -fsSL https://raw.githubusercontent.com/sonsu-lee/templates/main/install.sh | SEED_VERSION=v0.1.1 sh` を使用してください。

## CLI の使い方

```sh
seed --version
seed template list
seed template create ../my-app --template next
seed template create ../my-service --template next-nest --web node
seed template create ../my-static --template next-nest --web static
```

`--template` なしで `seed template create` を実行すると対話メニューが開きます。`--web` なしで `--template next-nest` を指定すると、Node デプロイが既定値になります。

作成先の親ディレクトリは存在している必要があり、既存のパスは上書きされません。テンプレートはバイナリに組み込まれているため、プロジェクト作成はオフラインで動作し、依存関係のインストールや Git の初期化は行いません。

## 開発

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

`node scripts/verify.mjs` は 3 種類のテンプレートをすべて作成して検証します。Cargo と npm のバージョンに一致するタグを push すると、ネイティブリリースアーカイブ、`SHA256SUMS`、`@sonsu-lee/templates` が公開されます。
