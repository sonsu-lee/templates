# Personal Application Templates

[English](README.md) | **한국어** | [日本語](README.ja.md)

`seed`는 내장된 세 가지 Next.js 템플릿으로 개인 애플리케이션을 생성하는 독립 실행형 CLI입니다. 단일 Next.js 애플리케이션 또는 Next.js 웹과 NestJS API로 구성된 애플리케이션을 선택할 수 있습니다.

## 템플릿

| 템플릿 | 아키텍처 | 배포 | CLI 선택 |
| --- | --- | --- | --- |
| [`next-fullstack`](templates/next-fullstack/README.md) | Next.js UI 및 API | Node 서버 | `--template next` |
| [`next-node-nest`](templates/next-node-nest/README.md) | Next.js 웹 및 NestJS API | Node 서버 | `--template next-nest --web node` |
| [`next-static-nest`](templates/next-static-nest/README.md) | Next.js 웹 및 NestJS API | 정적 웹 및 Node API | `--template next-nest --web static` |

## 요구 사항

- `seed` 설치: arm64 또는 x64 기반 macOS 15나 Ubuntu 24.04와 `curl`, `tar`. Windows x64 사용자는 [GitHub Releases](https://github.com/sonsu-lee/templates/releases/latest)에서 실행 파일을 받을 수 있습니다.
- 생성된 프로젝트 실행: Node.js 24 이상과 pnpm 12.3.4.
- `seed` 개발: `rustfmt`, Clippy가 포함된 Rust stable.

## 빠른 시작

### `seed` 설치

```sh
curl -fsSL https://raw.githubusercontent.com/sonsu-lee/templates/main/install.sh | sh
export PATH="$HOME/.local/bin:$PATH"
seed --version
```

설치 프로그램은 릴리스 체크섬을 검증한 후 `$HOME/.local/bin`에 `seed`를 설치합니다. 계속 `PATH`에서 사용하려면 `export` 줄을 셸 프로필에 추가하세요. 업데이트하려면 설치 프로그램을 다시 실행하고, 특정 릴리스를 설치하려면 `curl -fsSL https://raw.githubusercontent.com/sonsu-lee/templates/main/install.sh | SEED_VERSION=v0.1.1 sh`를 사용하세요.

### 프로젝트 생성

```sh
seed template create "$HOME/my-app" --template next
cd "$HOME/my-app"
pnpm install --frozen-lockfile
pnpm dev
```

<http://localhost:3000>을 여세요. 환경 변수와 배포 방법은 생성된 프로젝트의 README에 설명되어 있습니다.

## CLI 사용법

```sh
seed --version
seed template list
seed template create ../my-app --template next
seed template create ../my-service --template next-nest --web node
seed template create ../my-static --template next-nest --web static
```

`--template` 없이 `seed template create`를 실행하면 대화형 메뉴가 열립니다. `--web` 없이 `--template next-nest`를 사용하면 Node 배포가 기본값입니다.

대상 경로의 부모 디렉터리는 반드시 존재해야 하며 기존 경로는 덮어쓰지 않습니다. 템플릿은 바이너리에 내장되어 있어 프로젝트 생성은 오프라인으로 동작하며, 의존성을 설치하거나 Git을 초기화하지 않습니다.

## 개발

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

`node scripts/verify.mjs`는 세 가지 템플릿을 모두 생성하고 검증합니다. Cargo 및 npm 버전과 일치하는 태그를 푸시하면 네이티브 릴리스 아카이브, `SHA256SUMS`, `@sonsu-lee/templates`가 게시됩니다.
