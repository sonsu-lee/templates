# Personal Application Templates

[English](README.md) | **한국어** | [日本語](README.ja.md)

이 저장소는 개인 애플리케이션을 위한 세 가지 내장형 Next.js 프로젝트 템플릿을 제공합니다. 템플릿은 StyleX, Oxlint, Oxfmt를 사용합니다.

## 템플릿

| 템플릿 | 아키텍처 | 배포 | CLI 선택 |
| --- | --- | --- | --- |
| [`next-fullstack`](templates/next-fullstack/README.md) | Next.js UI 및 API | Node 서버 | `--template next` |
| [`next-node-nest`](templates/next-node-nest/README.md) | Next.js 웹 및 NestJS API | Node 서버 | `--template next-nest --web node` |
| [`next-static-nest`](templates/next-static-nest/README.md) | Next.js 웹 및 NestJS API | 정적 웹 및 Node API | `--template next-nest --web static` |

## 요구 사항

CLI를 빌드하려면 Rust stable이 필요합니다. 생성된 프로젝트에는 Node.js 24 이상과 pnpm 12.3.4가 필요합니다. `rustfmt`와 Clippy는 개발 검사를 실행할 때만 필요합니다.

## 빠른 시작

```sh
cargo build --release --locked
./target/release/personal-template create ../my-app --template next
cd ../my-app
pnpm install --frozen-lockfile
pnpm dev
```

웹 앱은 <http://localhost:3000>에서 사용할 수 있습니다. 템플릿별 환경 및 배포 세부 정보는 생성된 README를 참조하세요.

## CLI 사용법

```sh
./target/release/personal-template list
./target/release/personal-template create ../my-app --template next
./target/release/personal-template create ../my-service --template next-nest --web node
./target/release/personal-template create ../my-static --template next-nest --web static
```

터미널에서 `--template`을 생략하면 아키텍처 메뉴가 열리고, Next.js와 NestJS를 선택한 경우 배포 메뉴도 열립니다. `--web` 없이 `--template next-nest`를 사용하면 Node가 선택됩니다. 비대화형 실행에는 `--template`이 필요합니다. 프로젝트를 생성하지 않고 취소하려면 Esc 또는 `q`를 누르세요.

대상 경로의 부모 디렉터리는 반드시 존재해야 합니다. 기존 파일, 디렉터리 또는 symlink는 절대 덮어쓰지 않습니다. 복사에 실패하면 CLI는 해당 실행에서 만든 불완전한 디렉터리만 제거하려고 시도하며, 정리에도 실패하면 이를 보고합니다.

바이너리에는 템플릿이 내장되어 있으므로 빌드한 후 프로젝트를 생성할 때 Rust, Node.js, pnpm, 소스 저장소 또는 네트워크가 필요하지 않습니다. 템플릿 설정, 잠금 파일, README, `.env.example`을 복사하지만 의존성 설치, Git 초기화, 패키지 이름 변경, ORM 또는 플러그인 추가는 수행하지 않습니다. 템플릿을 수정한 후에는 바이너리를 다시 빌드하세요.

## 개발

`Git`을 사용할 수 있는 macOS 또는 Linux의 Git 체크아웃에서 이 검사를 실행하세요.

```sh
cargo fmt --check
cargo clippy --locked --all-targets -- -D warnings
cargo test --locked
cargo build --release --locked
node --test tests/*.test.mjs
node scripts/verify.mjs
```

`node scripts/verify.mjs`는 생성된 세 가지 템플릿을 모두 만들고 검증합니다.
