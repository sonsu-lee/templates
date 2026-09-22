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

공개 설치 프로그램은 arm64 또는 x64의 macOS 15와 Ubuntu 24.04에서 `curl`과 `tar`를 사용합니다. Node.js나 Rust 없이 네이티브 CLI를 설치합니다. 생성된 프로젝트에는 Node.js 24 이상과 pnpm 12.3.4가 필요합니다. Windows x64는 인증이 필요한 `@sonsu-lee/templates` GitHub Package를 통해 계속 제공합니다. 다른 플랫폼과 이전 운영체제 릴리스는 지원하거나 검증하지 않습니다.

소스에서 CLI를 빌드하려면 Rust stable이 필요합니다. `rustfmt`와 Clippy는 개발 검사를 실행할 때만 필요합니다.

## 빠른 시작

POSIX shell에서 공개 설치 프로그램을 실행한 다음 프로젝트를 만들고 시작하세요.

```sh
curl -fsSL https://raw.githubusercontent.com/sonsu-lee/templates/main/install.sh | sh
export PATH="$HOME/.local/bin:$PATH"
seed --version
seed template create "$HOME/my-app" --template next
cd "$HOME/my-app"
pnpm install --frozen-lockfile
pnpm dev
```

웹 앱은 <http://localhost:3000>에서 사용할 수 있습니다. 템플릿별 환경 및 배포 세부 정보는 생성된 README를 참조하세요. CLI를 업데이트하려면 설치 프로그램을 다시 실행하세요. 정확히 해당 릴리스를 설치하려면 실행 전에 `SEED_VERSION=v0.1.1`을 설정하세요. 대안으로 인증된 GitHub Packages 사용자는 `@sonsu-lee/templates`를 설치할 수 있습니다.

## CLI 사용법

```sh
seed --version
seed template list
seed template create ../my-app --template next
seed template create ../my-service --template next-nest --web node
seed template create ../my-static --template next-nest --web static
```

`--version`은 패키지 버전과 게시 워크플로가 내장한 소스 커밋을 모두 출력합니다. 터미널에서 `seed template create`의 `--template`을 생략하면 아키텍처 메뉴가 열리고, Next.js와 NestJS를 선택한 경우 배포 메뉴도 열립니다. `--web` 없이 `--template next-nest`를 사용하면 Node가 선택됩니다. 비대화형 실행에는 `--template`이 필요합니다. 프로젝트를 생성하지 않고 취소하려면 Esc 또는 `q`를 누르세요.

대상 경로의 부모 디렉터리는 반드시 존재해야 합니다. 기존 파일, 디렉터리 또는 symlink는 절대 덮어쓰지 않습니다. 복사에 실패하면 CLI는 해당 실행에서 만든 불완전한 디렉터리만 제거하려고 시도하며, 정리에도 실패하면 이를 보고합니다.

설치 프로그램은 checksum으로 검증된 네이티브 바이너리를 다운로드하며 템플릿은 바이너리에 내장되어 있습니다. 설치 후 프로젝트를 생성할 때 Node.js, Rust, pnpm, 소스 저장소 또는 네트워크가 필요하지 않습니다. 템플릿 설정, 잠금 파일, README, `.env.example`을 복사하지만 의존성 설치, Git 초기화, 패키지 이름 변경, ORM 또는 플러그인 추가는 수행하지 않습니다. 템플릿을 수정한 후에는 새 릴리스가 필요합니다.

## 개발

Git을 사용할 수 있는 macOS 또는 Linux의 Git 체크아웃에서 이 검사를 실행하세요.

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

`node scripts/verify.mjs`는 생성된 세 가지 템플릿을 모두 만들고 검증합니다. `SEED_SOURCE_REVISION` 없이 로컬에서 빌드하면 `source local`을 출력합니다.

태그는 Cargo와 npm 패키지 버전 모두와 일치해야 합니다(예: `v0.1.1`). 일치하는 태그를 푸시하면 `.github/workflows/release.yml`이 네이티브 바이너리 다섯 개를 빌드하고 스모크 테스트하며, checksum이 포함된 아카이브를 공개 GitHub Release에 게시하고 인증이 필요한 `@sonsu-lee/templates` 패키지를 GitHub Packages에 게시합니다. 릴리스 버전, `seed --version`에 표시되는 소스 커밋, 내장 템플릿은 모두 같은 저장소 리비전을 가리킵니다.
