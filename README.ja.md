# Personal Application Templates

[English](README.md) | [한국어](README.ko.md) | **日本語**

`sonsu` CLI を使い、組み込み済みの 3 種類の Next.js テンプレートから個人用アプリケーションを作成します。作成したプロジェクトの依存パッケージは別途インストールします。

## テンプレートの選択

`sonsu templates` は利用可能なテンプレートを一覧表示するコマンドです。`sonsu create DEST` で選んだテンプレートからプロジェクトを作成します。

| テンプレート | 構成 | デプロイ方法 | 選択オプション |
| --- | --- | --- | --- |
| [`next-fullstack`](templates/next-fullstack/README.md) | 1 つの Next.js アプリで UI と API を提供 | Node サーバー 1 台 | `--template next-fullstack` |
| [`next-node-nest`](templates/next-node-nest/README.md) | 分離した Next.js Web アプリと NestJS API アプリ | Node サーバー 2 台 | `--template next-node-nest` |
| [`next-static-nest`](templates/next-static-nest/README.md) | Next.js の静的 Web 出力と独立した NestJS API | Web は静的ホスト、API は Node サーバー | `--template next-static-nest` |

サーバーを 1 つにまとめるなら fullstack、Web と API を別々のサーバーで動かすなら Node/Nest、Web を静的ファイルとして配信するなら static/Nest を選んでください。デプロイと環境設定は生成されたプロジェクトの README を参照してください。

## 必要条件とリリース状況

シェルインストーラーは arm64 と x64 の macOS 15 および Ubuntu 24.04 をサポートします。`curl`、`tar`、`awk` と `sha256sum` または `shasum` が必要です。Windows x64 向けの `sonsu.exe` は、シェルインストーラーではなく ZIP ファイルで配布されます。生成したプロジェクトには Node.js 24 以降と pnpm 12.3.4 が必要です。Rust stable、rustfmt、Clippy はこのリポジトリの開発時にのみ必要です。

クイックスタートの前に [Node.js 24 以降](https://nodejs.org/en/download) をインストールし、`npm install -g pnpm@12.3.4` で必要なパッケージマネージャーをインストールしてください。

**リリースが前提です:** 以下のコマンドでインストールする `v0.2.0` のファイルは、先に [GitHub Releases](https://github.com/sonsu-lee/templates/releases) に公開されている必要があります。ソースのチェックアウトやこの README だけではダウンロードできません。まだ公開されていなければ、公開を待つか、下の開発セクションに従ってソースからビルドしてください。旧 `seed` CLI では以下のコマンドを実行しないでください。

名称変更に旧コマンドの互換エイリアスはありません。`sonsu` をインストールしても、以前の `$HOME/.local/bin/seed` は自動では削除されません。不要になった場合は、古い実行ファイルを手動で削除できます。

## インストール、作成、起動

`v0.2.0` が公開された後、対応する macOS または Ubuntu で実行してください。

```sh
curl -fsSL https://raw.githubusercontent.com/sonsu-lee/templates/main/install.sh | SONSU_VERSION=v0.2.0 sh
export PATH="$HOME/.local/bin:$PATH"
sonsu --version
sonsu templates
sonsu create "$HOME/my-app" --template next-fullstack
cd "$HOME/my-app"
pnpm install --frozen-lockfile
pnpm dev
```

<http://localhost:3000> を開いてください。インストーラーはリリースファイルを `SHA256SUMS` と照合し、既定では `sonsu` を `$HOME/.local/bin` に配置します。`export PATH=...` は現在のシェルにのみ有効です。今後のターミナルでも使うには、同じ行をシェルの起動ファイル（例: `~/.zshrc` または `~/.bashrc`）に追加してください。別の場所にインストールするには `SONSU_INSTALL_DIR=/your/bin` を指定し、そのディレクトリを `PATH` に追加します。Windows x64 では同じリリースから `sonsu-win32-x64.zip` を取得し、`sonsu.exe` を展開して、そのディレクトリを `PATH` に追加してください。新しいターミナルから同じ `sonsu templates` と `sonsu create ...` コマンドを使用できます。

新しいリリースが公開された後に更新するには、`SONSU_VERSION` を指定せずにインストーラーを再実行して最新リリースを取得します。このバージョンを維持・再インストールするには、上記のバージョン固定コマンド（`SONSU_VERSION=v0.2.0`）を再実行します。ミラーを使う場合は `SONSU_RELEASE_BASE_URL` でリリースファイルのベース URL を指定できます。CLI のインストールだけでは、Node.js、pnpm、生成したプロジェクトの依存パッケージはインストールされません。

## CLI の使い方

```sh
sonsu templates
sonsu create ../my-app
sonsu create ../my-app --template next-fullstack
sonsu create ../my-service --template next-node-nest
sonsu create ../my-static --template next-static-nest
```

`sonsu templates` は 3 種類のテンプレート ID と説明を一覧表示し、`sonsu create DEST --template ID` は選択したテンプレートで `DEST` にプロジェクトを作成します。標準入力と標準エラー出力が両方ともターミナルの場合、`--template` を省略すると同じ 3 種類から選ぶ単一の `Template` メニューが表示されます。矢印キーと Enter で選択し、Esc でキャンセルできます。スクリプトなどの非対話環境では `--template` が必須で、既定のテンプレートはありません。

作成先の親ディレクトリは既に存在する必要があり、作成先自体は存在してはいけません。`create` は既存のファイルやディレクトリを上書きしません。テンプレートは `sonsu` に組み込まれているため、プロジェクトの作成はオフラインでも可能です。ただし、別途行う `pnpm install --frozen-lockfile` にはネットワーク接続が必要になる場合があります。プロジェクト作成時に Git は初期化されません。

## 開発

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

`node scripts/verify.mjs` は 3 種類のテンプレートを作成して検証します。Cargo と npm パッケージのバージョンに一致する `v0.2.0` タグによって、ネイティブのリリースアーカイブ、`SHA256SUMS`、`@sonsu-lee/templates` が公開されます。これはリリース手順の説明であり、既に公開済みという意味ではありません。
