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

각 명령은 검증 디렉터리와 `verification.json`을 보존합니다. 실제 실행 보고서에는 바이너리 SHA-256, 실행 환경, 명령·종료 코드, 생성 경로와 파일 비교 결과를 기록합니다. 이 검사는 CLI의 선택·복사를 다룹니다. 생성한 앱의 동작 검증은 아래 실행기를 사용합니다.

## 생성 프로젝트 검증

Node 24 이상, 템플릿이 지정한 pnpm, Rust stable 및 Python 3가 필요합니다. Rust 도구는 PATH에 등록합니다. 생성물 검증 실행기 자체는 Node 표준 모듈만 사용하며 저장소 루트에서 의존성을 설치할 필요가 없습니다.

```sh
cargo build --release --locked
node --test tests/*.test.mjs
node scripts/verify.mjs
node scripts/verify.mjs next-fullstack
node scripts/verify.mjs next-node-nest
node scripts/verify.mjs next-static-nest
```

인자를 생략하면 세 템플릿을 순서대로 검증합니다. `--binary /absolute/path/personal-template`으로 빌드한 CLI를, `--output-dir /absolute/path/report`로 새 보고서 디렉터리를 지정할 수 있습니다. 기존 보고서 디렉터리는 덮어쓰지 않습니다. 성공은 종료 코드 `0`, 검증·환경 실패는 `1`, 잘못된 인자는 `2`입니다.

각 기본 검사와 독립 사례는 OS 임시 디렉터리에 CLI로 새 프로젝트를 생성하고, 원본과 전체 파일의 hash를 비교한 뒤 잠금 파일 기준으로 설치합니다. Git 작업 폴더 안을 가리키는 임시 경로는 거부합니다. pnpm 버전은 생성 프로젝트의 `packageManager`와 대조합니다. pnpm 저장소 캐시는 재사용하지만 관리 저장소나 다른 생성물의 `node_modules`는 복사하지 않습니다.

검증 범위는 루트·앱별 lint·포맷·타입·빌드, 정상 및 규칙 위반 fixture, Next 서버·클라이언트와 분리형 웹의 접근 경계, 정적 export, HTTP health, Nest DI metadata·자동수정 전후 동작과 native LSP입니다. Next 타입 검사는 기존 lint에 포함됩니다. LSP는 생성물의 폴더별 설정을 읽고 웹의 타입 기반 진단과 API의 일반 진단을 구분합니다. 사례 입력은 `tests/fixtures`에만 있으며 복사용 템플릿에 포함되지 않습니다.

기본 보고서는 `.cache/verification/<실행 ID>/results.json`에 저장됩니다. 명령, 종료 코드, 필수·금지 진단, 로그 경로, 실행 시간, 소스·바이너리·설정·잠금 파일 hash와 도구 버전을 기록합니다. 예상 실패는 종료 코드와 지정 진단을 모두 충족해야 하며, timeout·signal·실행 불가는 통과로 처리하지 않습니다. 선행 검사가 실패하면 의존 검사는 `not_run`, 전체 실행은 실패입니다.

성공한 생성물은 삭제하고 실패한 생성물은 보존합니다. 보고서에 원래 경로를 남기고, 의존성·빌드 캐시·비공개 환경 파일을 제외한 소스와 숨김 설정, fixture 및 사례 명세를 `*.tar.gz`로 보관합니다. tar를 별도 디렉터리에 풀고 `project`에서 `pnpm install --frozen-lockfile` 후 보고서의 명령을 실행하면 실패를 재현할 수 있습니다. 산출물 제외 사례의 `.next`·`dist` 등은 별도로 보존된 `fixture`를 다시 덮어쓴 뒤 검사합니다.

실행기 전체 제한시간은 45분이며 설치·빌드는 최대 10분, 일반 명령은 2분, 서버 준비는 60초, LSP 요청은 30초입니다. 각 제한은 남은 전체 예산을 넘지 못합니다. 종료 요청이나 시간 초과 시 실행기가 만든 프로세스를 정리하고 결과를 기록합니다. 운영체제의 강제 종료나 runner 자체 소실은 보고서 보존을 보장하지 않습니다.

GitHub Actions는 기존 기본 검사와 함께 Rust 검사·실행기 테스트·내장 파일 검증을 실행합니다. 같은 실행에서 빌드한 Linux 바이너리로 템플릿별 전체 검증을 수행하고 로그·보고서·실패 snapshot을 14일 보관합니다. 실행 step은 50분, job은 60분으로 보고서 업로드 시간을 확보합니다. Linux CI와 macOS 로컬 실행을 대상으로 하며, macOS 전용 `verify_cli.py`는 Linux job에서 실행하지 않습니다.

실제 VS Code UI, 브라우저 E2E, Windows, 별도 저장소에 복사한 workflow와 실제 배포 환경은 이 실행기의 검증 범위에 포함되지 않습니다. 로컬 실행 결과와 실제 원격 Actions 결과는 구분해서 확인합니다.
