# Personal Application Templates

[English](README.md) | [한국어](README.ko.md) | **日本語**

このリポジトリは、個人用アプリケーション向けに 3 種類の Next.js プロジェクトテンプレートをバイナリへ組み込んで提供します。テンプレートでは StyleX、Oxlint、Oxfmt を使用しています。

## テンプレート

| テンプレート | アーキテクチャ | デプロイ | CLI での選択 |
| --- | --- | --- | --- |
| [`next-fullstack`](templates/next-fullstack/README.md) | Next.js の UI と API | Node サーバー | `--template next` |
| [`next-node-nest`](templates/next-node-nest/README.md) | Next.js の Web と NestJS API | Node サーバー | `--template next-nest --web node` |
| [`next-static-nest`](templates/next-static-nest/README.md) | Next.js の Web と NestJS API | 静的 Web と Node API | `--template next-nest --web static` |

## 必要条件

公開インストーラーは、arm64 または x64 の macOS 15 と Ubuntu 24.04 で `curl` と `tar` を使用します。Node.js や Rust を必要とせず、ネイティブ CLI をインストールします。生成されたプロジェクトには Node.js 24 以降と pnpm 12.3.4 が必要です。Windows x64 は、認証が必要な `@sonsu-lee/templates` GitHub Package で引き続き提供します。その他のプラットフォームと古い OS リリースはサポートまたは検証していません。

ソースから CLI をビルドするには Rust stable が必要です。`rustfmt` と Clippy は開発時のチェックにのみ必要です。

## クイックスタート

POSIX shell で公開インストーラーを実行し、プロジェクトを作成して起動してください。

```sh
curl -fsSL https://raw.githubusercontent.com/sonsu-lee/templates/main/install.sh | sh
export PATH="$HOME/.local/bin:$PATH"
seed --version
seed template create "$HOME/my-app" --template next
cd "$HOME/my-app"
pnpm install --frozen-lockfile
pnpm dev
```

Web アプリは <http://localhost:3000> で利用できます。テンプレート固有の環境設定とデプロイの詳細は、生成された README を参照してください。CLI を更新するにはインストーラーを再実行します。特定のリリースをインストールするには、実行前に `SEED_VERSION=v0.1.1` を設定してください。代替手段として、認証済みの GitHub Packages ユーザーは `@sonsu-lee/templates` をインストールできます。

## CLI の使い方

```sh
seed --version
seed template list
seed template create ../my-app --template next
seed template create ../my-service --template next-nest --web node
seed template create ../my-static --template next-nest --web static
```

`--version` は、パッケージバージョンと公開ワークフローが組み込んだソースコミットの両方を表示します。ターミナルで `seed template create` の `--template` を省略するとアーキテクチャのメニューが開き、Next.js と NestJS を選択した場合はデプロイのメニューも開きます。`--web` なしで `--template next-nest` を指定すると Node が選択されます。非ターミナルでの実行には `--template` が必要です。プロジェクトを作成せずにキャンセルするには Esc または `q` を押してください。

作成先の親ディレクトリは存在している必要があります。既存のファイル、ディレクトリ、symlink は上書きされません。コピーに失敗した場合、CLI はその実行で作成した未完成のディレクトリだけを削除しようとし、クリーンアップにも失敗した場合はその旨を報告します。

インストーラーは checksum で検証されたネイティブバイナリをダウンロードし、テンプレートはそのバイナリに組み込まれています。インストール後のプロジェクト作成には Node.js、Rust、pnpm、ソースリポジトリ、ネットワークは不要です。テンプレートの設定、ロックファイル、README、`.env.example` はコピーされますが、依存関係のインストール、Git の初期化、パッケージ名の変更、ORM やプラグインの追加は行われません。テンプレートを編集した後は新しいリリースが必要です。

## 開発

Git を利用できる macOS または Linux の Git チェックアウトで、これらのチェックを実行してください。

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

`node scripts/verify.mjs` は、生成された 3 種類のテンプレートをすべて作成して検証します。`SEED_SOURCE_REVISION` なしでローカルビルドした場合は、`source local` と表示されます。

タグは Cargo と npm の両方のパッケージバージョンと一致する必要があります（例: `v0.1.1`）。一致するタグを push すると `.github/workflows/release.yml` が 5 つのネイティブバイナリをビルドしてスモークテストし、checksum 付きアーカイブを公開 GitHub Release に公開し、認証が必要な `@sonsu-lee/templates` パッケージを GitHub Packages に公開します。リリースバージョン、`seed --version` が示すソースコミット、組み込みテンプレートは、すべて同じリポジトリリビジョンを参照します。
