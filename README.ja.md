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

非公開の `@sonsu-lee/seed` パッケージをインストールするには、Node.js 24 以降、npm、および `read:packages` 権限を持つ GitHub personal access token（classic）が必要です。生成されたプロジェクトには pnpm 12.3.4 が必要です。パッケージには、arm64 と x64 の macOS 15 および Ubuntu 24.04 用ネイティブバイナリと、`windows-2025` runner で検証した Windows x64 バイナリが含まれます。その他のプラットフォームと古い OS リリースはサポートまたは検証していません。

ソースから CLI をビルドするには Rust stable が必要です。`rustfmt` と Clippy は開発時のチェックにのみ必要です。

## クイックスタート

`read:packages` 権限を持つ [personal access token（classic）](https://github.com/settings/tokens)を作成し、POSIX shell または PowerShell で次のコマンドを実行してください。`npm login` のプロンプトでは GitHub ユーザー名を入力し、パスワードとしてトークンを使用します。

```sh
npm login --scope=@sonsu-lee --auth-type=legacy --registry=https://npm.pkg.github.com
npm install --global @sonsu-lee/seed
seed --version
seed template create "$HOME/my-app" --template next
cd "$HOME/my-app"
pnpm install --frozen-lockfile
pnpm dev
```

Web アプリは <http://localhost:3000> で利用できます。テンプレート固有の環境設定とデプロイの詳細は、生成された README を参照してください。CLI を更新するには `npm update --global @sonsu-lee/seed` を実行してください。

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

npm パッケージには、ネイティブ CLI と組み込みテンプレートが含まれています。インストール後のプロジェクト作成にはネイティブバイナリを起動するための Node.js が必要ですが、Rust、pnpm、ソースリポジトリ、ネットワークは不要です。テンプレートの設定、ロックファイル、README、`.env.example` はコピーされますが、依存関係のインストール、Git の初期化、パッケージ名の変更、ORM やプラグインの追加は行われません。テンプレートを編集した後は、新しいパッケージバージョンが必要です。

## 開発

Git を利用できる macOS または Linux の Git チェックアウトで、これらのチェックを実行してください。

```sh
cargo fmt --check
cargo clippy --locked --all-targets -- -D warnings
cargo test --locked
SEED_SOURCE_REVISION="$(git rev-parse HEAD)" cargo build --release --locked
node --check bin/seed.mjs
node --test tests/*.test.mjs
node scripts/verify.mjs
```

`node scripts/verify.mjs` は、生成された 3 種類のテンプレートをすべて作成して検証します。`SEED_SOURCE_REVISION` なしでローカルビルドした場合は、`source local` と表示されます。

タグは Cargo と npm の両方のパッケージバージョンと一致する必要があります（例: `v0.1.0`）。一致するタグを push すると `.github/workflows/release.yml` が 5 つのネイティブバイナリをビルドしてスモークテストし、`seed` launcher の背後に 1 つのパッケージとしてまとめ、単一の非公開 `@sonsu-lee/seed` パッケージを GitHub Packages に公開します。パッケージバージョン、`seed --version` が示すソースコミット、組み込みテンプレートは、すべて同じリポジトリリビジョンを参照します。
