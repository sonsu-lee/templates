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

CLI のビルドには Rust stable が必要です。生成されたプロジェクトには Node.js 24 以降と pnpm 12.3.4 が必要です。`rustfmt` と Clippy は開発時のチェックにのみ必要です。

## クイックスタート

```sh
cargo build --release --locked
./target/release/personal-template create ../my-app --template next
cd ../my-app
pnpm install --frozen-lockfile
pnpm dev
```

Web アプリは <http://localhost:3000> で利用できます。テンプレート固有の環境設定とデプロイの詳細は、生成された README を参照してください。

## CLI の使い方

```sh
./target/release/personal-template list
./target/release/personal-template create ../my-app --template next
./target/release/personal-template create ../my-service --template next-nest --web node
./target/release/personal-template create ../my-static --template next-nest --web static
```

ターミナルで `--template` を省略するとアーキテクチャのメニューが開き、Next.js と NestJS を選択した場合はデプロイのメニューも開きます。`--web` なしで `--template next-nest` を指定すると Node が選択されます。非ターミナルでの実行には `--template` が必要です。プロジェクトを作成せずにキャンセルするには Esc または `q` を押してください。

作成先の親ディレクトリは存在している必要があります。既存のファイル、ディレクトリ、symlink は上書きされません。コピーに失敗した場合、CLI はその実行で作成した未完成のディレクトリだけを削除しようとし、クリーンアップにも失敗した場合はその旨を報告します。

テンプレートはバイナリに組み込まれているため、ビルド後のプロジェクト作成には Rust、Node.js、pnpm、ソースリポジトリ、ネットワークは不要です。テンプレートの設定、ロックファイル、README、`.env.example` はコピーされますが、依存関係のインストール、Git の初期化、パッケージ名の変更、ORM やプラグインの追加は行われません。テンプレートを編集した後はバイナリを再ビルドしてください。

## 開発

```sh
cargo fmt --check
cargo clippy --locked --all-targets -- -D warnings
cargo test --locked
cargo build --release --locked
node --test tests/*.test.mjs
node scripts/verify.mjs
```

`node scripts/verify.mjs` は、生成された 3 種類のテンプレートをすべて作成して検証します。
