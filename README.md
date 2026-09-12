# Personal application templates

개인 프로젝트에 복사해 사용하는 Next.js 템플릿 모음입니다. StyleX, Oxlint, Oxfmt를 사용합니다.

| 템플릿                                                           | 구성                                                |
| ---------------------------------------------------------------- | --------------------------------------------------- |
| [Next.js 풀스택](templates/next-fullstack/README.md)             | Next.js가 화면과 API를 처리                         |
| [Next.js Node + NestJS](templates/next-node-nest/README.md)      | Next.js 웹과 NestJS API를 분리한 pnpm workspace     |
| [Next.js 정적 웹 + NestJS](templates/next-static-nest/README.md) | 정적 export 웹과 NestJS API를 분리한 pnpm workspace |

## CLI 빌드와 사용법

Rust stable로 저장소 루트에서 CLI를 빌드합니다. Cargo 잠금 파일을 사용하며, 템플릿 파일은 빌드 시 바이너리에 내장됩니다.

```sh
cargo build --release --locked
./target/release/personal-template list
./target/release/personal-template create ../my-app
```

`create`에는 새 프로젝트 경로가 필요합니다. 터미널에서 `--template`을 생략하면 방향키와 Enter로 **Next.js 풀스택** 또는 **Next.js + NestJS**를 선택합니다. Next.js + NestJS에서는 **Node server** 또는 **Static export**를 이어서 선택합니다. 기본 선택은 풀스택과 Node이며, Esc 또는 q로 취소하면 프로젝트를 생성하지 않습니다.

명시적 옵션으로도 생성할 수 있습니다.

```sh
./target/release/personal-template create ../my-app --template next
./target/release/personal-template create ../my-service --template next-nest --web node
./target/release/personal-template create ../my-static --template next-nest --web static
```

- `--template next`는 `next-fullstack`을 선택합니다. `--web node`도 허용하며 `--web static`은 거부합니다.
- `--template next-nest`에서 `--web`을 생략하면 추가 질문 없이 Node 구성을 선택합니다.
- `--web`만 지정한 대화형 실행에서는 아키텍처만 질문합니다. 지정한 웹 배포 옵션을 유지하며, 지원하지 않는 조합은 생성 전에 거부합니다.
- 비대화형 실행에서는 `--template`이 필수입니다. 대화형 메뉴는 표준 입력과 표준 오류가 모두 터미널일 때만 표시됩니다.
- `--help`, `create --help`, `--version`으로 사용법과 CLI 버전을 확인합니다.

대상의 부모 디렉터리는 이미 존재해야 합니다. 기존 파일·디렉터리·symlink는 덮어쓰지 않습니다. 복사 오류가 발생하면 CLI가 만든 불완전한 디렉터리를 정리하고, 정리에 실패하면 남은 경로와 오류를 출력합니다. 강제 종료 이후의 자동 복구는 제공하지 않습니다.

CLI는 설정·의존성·잠금 파일·README를 그대로 복사합니다. 패키지 이름 변경, lint 설정 조합, 의존성 설치, Git 초기화, ORM·스킬·플러그인 설치는 수행하지 않습니다. `.env.example`은 포함하지만 로컬 `.env*`, 설치 파일·빌드 산출물·캐시는 내장하지 않습니다. 원본의 symlink와 특수 파일은 빌드 오류로 처리합니다.

빌드한 `personal-template` 바이너리는 다른 디렉터리로 옮겨 실행할 수 있습니다. 프로젝트 생성에는 Rust·Node·pnpm·원본 저장소·네트워크가 필요하지 않습니다. 템플릿 원본을 수정했다면 CLI를 다시 빌드해야 합니다. 배포 바이너리와 설치 채널은 별도 릴리스 작업에서 다룹니다.

종료 코드는 성공·도움말·목록 `0`, 인자 오류 `2`, 파일·터미널 오류 `1`, 메뉴 취소 `130`입니다.

## 생성한 프로젝트 실행

생성한 앱을 실행하려면 Node **24 이상**과 pnpm **12.3.4**가 필요합니다.

```sh
cd ../my-app
pnpm install --frozen-lockfile
pnpm dev
```

웹은 <http://localhost:3000>에서 확인할 수 있습니다. 환경 변수, 명령어, 배포 방법은 생성한 프로젝트의 README를 참고하세요. CLI를 사용하지 않고 템플릿 디렉터리를 직접 복사해도 됩니다.

## CLI 검증

Rust 도구에 rustfmt와 Clippy가 설치되어 있어야 합니다.

```sh
cargo fmt --check
cargo clippy --locked --all-targets -- -D warnings
cargo test --locked
cargo build --release --locked
```

통합 테스트는 Git 체크아웃에서 실행하며, 추적된 템플릿 파일과 저장소 밖에 생성한 파일의 전체 목록·바이트를 비교합니다. 옵션, 기존 경로 보호, 복사 실패 정리와 동시 생성도 검사합니다.

macOS에서 Python 3 표준 라이브러리와 `sandbox-exec`를 사용해 빌드한 바이너리를 실제 실행할 수 있습니다.

```sh
python3 tests/verify_cli.py target/release/personal-template
python3 tests/verify_embedding.py
```

첫 명령은 `~/tmp/personal-template-issue4.*`에 바이너리를 복사하고, 명시적 옵션과 실제 PTY의 방향키 메뉴로 프로젝트를 생성합니다. 원본 경로 읽기·네트워크 차단도 검사합니다. 두 번째 명령은 별도 소스 사본에서 오프라인으로 빌드하며 파일 추가·수정·삭제 반영과 내장 제외 규칙을 검사하므로, 먼저 일반 빌드를 완료해 Cargo 의존성을 캐시에 준비해야 합니다. `cargo`가 PATH에 없다면 `--cargo`로 실행 파일 경로를 지정합니다.

각 명령은 검증 디렉터리와 `verification.json`을 보존합니다. 실제 실행 보고서에는 바이너리 SHA-256, 실행 환경, 명령·종료 코드, 생성 경로와 파일 비교 결과를 기록합니다. 이 검사는 CLI의 선택·복사를 다루며 생성한 앱의 서버·HTTP·DI·LSP 종합 검증과 Rust CI 구성은 별도 작업입니다.
