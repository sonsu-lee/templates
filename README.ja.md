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

この非公開リポジトリのリリースをダウンロードするには、`gh auth login` で認証した [GitHub CLI](https://cli.github.com/) が必要です。リリースバイナリは、arm64 と x64 の macOS 15 および Ubuntu 24.04 をサポートします。Windows、その他の Linux ディストリビューション、古い OS リリースはサポートまたは検証していません。生成されたプロジェクトには Node.js 24 以降と pnpm 12.3.4 が必要です。

ソースから CLI をビルドするには Rust stable が必要です。`rustfmt` と Clippy は開発時のチェックにのみ必要です。

## クイックスタート

使用するマシンに合うターゲットを選択してください。

| プラットフォーム | アーキテクチャ | ターゲット |
| --- | --- | --- |
| macOS | Apple silicon | `aarch64-apple-darwin` |
| macOS | Intel | `x86_64-apple-darwin` |
| Ubuntu 24.04 | arm64 | `aarch64-unknown-linux-gnu` |
| Ubuntu 24.04 | x64 | `x86_64-unknown-linux-gnu` |

次の例では、最新の Apple silicon リリースを `~/.local/bin` にインストールし、チェックサムを検証してからプロジェクトを作成します。

```sh
(
  set -eu
  gh auth login
  repo=sonsu-lee/templates
  tag="$(gh release view --repo "$repo" --json tagName --jq .tagName)"
  target=aarch64-apple-darwin
  asset="personal-template-${tag}-${target}.tar.gz"
  tmp="$(mktemp -d)"
  trap 'rm -rf "$tmp"' EXIT
  gh release download "$tag" --repo "$repo" --dir "$tmp" --pattern "$asset" --pattern "$asset.sha256"
  if command -v shasum >/dev/null; then
    (cd "$tmp" && shasum -a 256 -c "$asset.sha256") || exit 1
  else
    (cd "$tmp" && sha256sum -c "$asset.sha256") || exit 1
  fi
  tar -xzf "$tmp/$asset" -C "$tmp"
  mkdir -p "$HOME/.local/bin"
  cli="$HOME/.local/bin/personal-template"
  install -m 755 "$tmp/personal-template" "$cli"
  "$cli" --version
  "$cli" create "$HOME/my-app" --template next
) &&
  cd "$HOME/my-app" &&
  pnpm install --frozen-lockfile &&
  pnpm dev
```

`~/.local/bin` が `PATH` に含まれていることを確認してください。Web アプリは <http://localhost:3000> で利用できます。テンプレート固有の環境設定とデプロイの詳細は、生成された README を参照してください。CLI を更新するには、ダウンロードとインストールの手順を再実行してください。

## CLI の使い方

```sh
personal-template --version
personal-template list
personal-template create ../my-app --template next
personal-template create ../my-service --template next-nest --web node
personal-template create ../my-static --template next-nest --web static
```

`--version` は、パッケージバージョンとリリースワークフローが組み込んだソースコミットの両方を表示します。ターミナルで `--template` を省略するとアーキテクチャのメニューが開き、Next.js と NestJS を選択した場合はデプロイのメニューも開きます。`--web` なしで `--template next-nest` を指定すると Node が選択されます。非ターミナルでの実行には `--template` が必要です。プロジェクトを作成せずにキャンセルするには Esc または `q` を押してください。

作成先の親ディレクトリは存在している必要があります。既存のファイル、ディレクトリ、symlink は上書きされません。コピーに失敗した場合、CLI はその実行で作成した未完成のディレクトリだけを削除しようとし、クリーンアップにも失敗した場合はその旨を報告します。

テンプレートはバイナリに組み込まれているため、インストール後のプロジェクト作成には Rust、Node.js、pnpm、ソースリポジトリ、ネットワークは不要です。テンプレートの設定、ロックファイル、README、`.env.example` はコピーされますが、依存関係のインストール、Git の初期化、パッケージ名の変更、ORM やプラグインの追加は行われません。テンプレートを編集した後は、新しい CLI リリースが必要です。

## 開発

Git を利用できる macOS または Linux の Git チェックアウトで、これらのチェックを実行してください。

```sh
cargo fmt --check
cargo clippy --locked --all-targets -- -D warnings
cargo test --locked
PERSONAL_TEMPLATE_SOURCE_REVISION="$(git rev-parse HEAD)" cargo build --release --locked
node --test tests/*.test.mjs
node scripts/verify.mjs
```

`node scripts/verify.mjs` は、生成された 3 種類のテンプレートをすべて作成して検証します。`PERSONAL_TEMPLATE_SOURCE_REVISION` なしでローカルビルドした場合は、`source local` と表示されます。

タグは Cargo パッケージのバージョンと一致する必要があります（例: `v0.1.0`）。一致するタグを push すると `.github/workflows/release.yml` が、サポートする 4 ターゲットのネイティブアーカイブをビルドしてスモークテストし、アーカイブごとの SHA-256 ファイルと非公開 GitHub Release を公開します。リリースタグ、`personal-template --version` が示すソースコミット、組み込みテンプレートは、すべて同じリポジトリリビジョンを参照します。
