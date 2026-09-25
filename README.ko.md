# Personal Application Templates

[English](README.md) | **한국어** | [日本語](README.ja.md)

`sonsu` CLI로 내장된 세 가지 Next.js 템플릿 중 하나를 골라 개인 애플리케이션 프로젝트를 만듭니다. 생성된 프로젝트의 의존성은 별도로 설치합니다.

## 템플릿 선택

`sonsu templates`로 사용 가능한 템플릿을 나열하고, `sonsu create DEST`로 선택한 템플릿의 프로젝트를 생성합니다.

| 템플릿 | 구성 | 배포 방식 | 선택 옵션 |
| --- | --- | --- | --- |
| [`next-fullstack`](templates/next-fullstack/README.md) | Next.js 앱 하나에서 UI와 API 제공 | Node 서버 하나 | `--template next-fullstack` |
| [`next-node-nest`](templates/next-node-nest/README.md) | 분리된 Next.js 웹 앱과 NestJS API 앱 | Node 서버 두 개 | `--template next-node-nest` |
| [`next-static-nest`](templates/next-static-nest/README.md) | Next.js 정적 웹 출력과 별도의 NestJS API | 웹은 정적 호스팅, API는 Node 서버 | `--template next-static-nest` |

서버 하나로 시작하려면 fullstack, 웹과 API를 별도 서버로 운영하려면 Node/Nest, 웹을 정적 파일로 호스팅하려면 static/Nest를 선택하세요. 배포 및 환경 설정은 생성된 프로젝트의 README를 참고하세요.

## 요구 사항과 릴리스 상태

셸 설치 프로그램은 arm64 및 x64의 macOS 15와 Ubuntu 24.04를 지원합니다. `curl`, `tar`, `awk`와 `sha256sum` 또는 `shasum`이 필요합니다. Windows x64용 `sonsu.exe`는 셸 설치 프로그램 대신 ZIP 파일로 배포됩니다. 생성된 프로젝트에는 Node.js 24 이상과 pnpm 12.3.4가 필요합니다. Rust stable, rustfmt, Clippy는 이 저장소를 개발할 때만 필요합니다.

빠른 시작 전에 [Node.js 24 이상](https://nodejs.org/en/download)을 설치하고 `npm install -g pnpm@12.3.4`로 필요한 패키지 관리자를 설치하세요.

**릴리스 선행 조건:** 아래 명령으로 설치할 `v0.2.0` 파일은 먼저 [GitHub Releases](https://github.com/sonsu-lee/templates/releases)에 게시되어야 합니다. 소스 체크아웃이나 이 README만으로 다운로드 파일이 제공되는 것은 아닙니다. 릴리스가 아직 없다면 게시를 기다리거나 아래 개발 섹션을 따라 소스에서 빌드하세요. 이전 `seed` CLI로 아래 명령을 실행하지 마세요.

이름 변경은 호환 별칭이 없는 변경입니다. `sonsu`를 설치해도 기존 `$HOME/.local/bin/seed`는 자동으로 삭제되지 않습니다. 더 이상 필요 없다면 이전 실행 파일을 직접 삭제할 수 있습니다.

## 설치, 생성, 실행

`v0.2.0` 릴리스가 게시된 뒤 지원되는 macOS 또는 Ubuntu에서 실행하세요.

```sh
curl -fsSL https://sonsu.dev/install | SONSU_VERSION=v0.2.0 sh
export PATH="$HOME/.local/bin:$PATH"
sonsu --version
sonsu templates
sonsu create "$HOME/my-app" --template next-fullstack
cd "$HOME/my-app"
pnpm install --frozen-lockfile
pnpm dev
```

<http://localhost:3000>을 여세요. 설치 프로그램은 릴리스 파일을 `SHA256SUMS`로 검증하고 기본적으로 `$HOME/.local/bin`에 `sonsu`를 설치합니다. `export PATH=...`는 현재 셸에만 적용되므로 이후 터미널에서도 쓰려면 셸 시작 파일(예: `~/.zshrc` 또는 `~/.bashrc`)에 같은 줄을 추가하세요. 다른 설치 위치를 쓰려면 `SONSU_INSTALL_DIR=/your/bin`을 설정해 설치하고 해당 디렉터리를 `PATH`에 추가하세요. Windows x64에서는 같은 릴리스의 `sonsu-win32-x64.zip`을 다운로드해 `sonsu.exe`를 압축 해제하고 그 디렉터리를 `PATH`에 추가하세요. 새 터미널에서 동일한 `sonsu templates` 및 `sonsu create ...` 명령을 실행할 수 있습니다.

새 릴리스가 게시된 뒤 업데이트하려면 `SONSU_VERSION` 없이 설치 프로그램을 다시 실행해 최신 릴리스를 받으세요. 이 버전을 유지하거나 다시 설치하려면 위의 고정 버전 명령(`SONSU_VERSION=v0.2.0`)을 실행하세요. 미러를 쓴다면 `SONSU_RELEASE_BASE_URL`로 릴리스 파일의 기본 URL을 지정할 수 있습니다. CLI 설치만으로 Node.js, pnpm 또는 생성된 프로젝트의 의존성이 설치되지는 않습니다.

## CLI 사용법

```sh
sonsu templates
sonsu create ../my-app
sonsu create ../my-app --template next-fullstack
sonsu create ../my-service --template next-node-nest
sonsu create ../my-static --template next-static-nest
```

`sonsu templates`는 세 가지 템플릿 ID와 설명을 나열하고, `sonsu create DEST --template ID`는 선택한 템플릿으로 `DEST`에 프로젝트를 생성합니다. 표준 입력과 표준 오류 출력이 모두 터미널일 때 `--template`을 생략하면 세 가지 선택지가 있는 단일 `Template` 메뉴가 열립니다. 화살표 키와 Enter로 선택하거나 Esc로 취소할 수 있습니다. 스크립트 등 비대화형 환경에서는 `--template`이 필수이며, 기본 템플릿은 없습니다.

대상 경로의 부모 디렉터리는 이미 존재해야 하고 대상 경로는 없어야 합니다. `create`는 기존 파일이나 디렉터리를 덮어쓰지 않습니다. 템플릿은 `sonsu`에 내장되어 프로젝트 생성은 오프라인에서도 동작하지만, `pnpm install --frozen-lockfile`로 의존성을 설치하는 별도 단계에는 네트워크가 필요할 수 있습니다. 프로젝트 생성 시 Git 저장소를 초기화하지 않습니다.

## 개발

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

`node scripts/verify.mjs`는 세 가지 템플릿을 생성하고 검증합니다. Cargo 및 npm 패키지 버전과 일치하는 `v0.2.0` 태그로 네이티브 릴리스 아카이브, `SHA256SUMS`, `@sonsu-lee/templates`를 게시합니다. 이는 릴리스 절차에 대한 설명이며 이미 게시되었다는 뜻은 아닙니다.
