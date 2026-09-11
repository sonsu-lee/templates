# next-fullstack

이 디렉터리만 복사해 사용하는 개인 프로젝트 템플릿입니다. 루트의 Oxlint·Oxfmt·TypeScript 설정으로 실행됩니다. 공유 Oxlint 설정, 외부 설정 패키지, ESLint는 없습니다.

## 시작

Node **24 이상**과 pnpm **12.3.4**를 사용합니다. Node는 최신 LTS를 권장합니다. `.node-version`은 기본 개발 버전을 `24`로 지정하며, pnpm은 `packageManager`에 고정되어 있습니다. `pnpm-workspace.yaml`의 `saveExact: true`는 새로 추가하는 의존성도 정확한 버전으로 저장합니다.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

웹: <http://localhost:3000>. 헬스체크: <http://localhost:3000/api/health>. 첫 화면의 버튼으로 실제 응답을 확인합니다. 헬스체크는 프로세스와 HTTP 라우팅을 확인하며 DB readiness 검사는 포함하지 않습니다. 도메인 예제·DB 스키마·ORM 의존성은 추가하지 않았습니다.

| 명령                | 동작                            |
| ------------------- | ------------------------------- |
| `pnpm lint`         | 파일을 수정하지 않는 lint       |
| `pnpm lint:fix`     | Oxlint의 안전한 자동수정만 실행 |
| `pnpm typecheck`    | `next typegen && tsc --noEmit`  |
| `pnpm build`        | Next 프로덕션 빌드              |
| `pnpm format:check` | Oxfmt 형식 검사                 |
| `pnpm format`       | Oxfmt 포맷 적용                 |

빌드 후 `pnpm start`로 웹 서버를 시작합니다.

## 실행 환경과 디렉터리 경계

- Client Component는 `src/client/**` 또는 `src/**/*.client.*`에 두고 `"use client"`를 선언합니다. 해당 경로에서는 `require()`를 금지하고 ESM import를 사용합니다. Node 내장 모듈, `src/server`, DB 드라이버·ORM·Nest 구현의 직접 import를 금지합니다.
- `env`는 알려진 전역을 설정할 뿐 실행 환경이나 전이 import를 증명하지 않습니다. 다른 위치에 `"use client"`를 선언하면 경로 기반 lint가 적용되지 않습니다. 경로 규약을 지키고 Next 빌드로 서버·클라이언트 경계를 확인합니다.
- 서버 전용 모듈은 `src/server/**`에 두고 `import "server-only"`를 선언합니다. Next가 클라이언트의 간접 import까지 빌드에서 차단합니다. 비밀 값을 `NEXT_PUBLIC_` 환경 변수에 넣지 않습니다.
- `src`의 요청 처리 코드에는 `node/no-sync`, `unicorn/no-process-exit`가 적용됩니다. 개발·마이그레이션 실행 코드는 `scripts/` 또는 루트 설정 파일에 둡니다.
- 설정 파일과 `scripts/`도 일반 lint 대상입니다. 앱의 React·Next·접근성 규칙은 `src/**`에 적용합니다.

## 스타일

StyleX 0.19.0을 사용합니다. 컴포넌트 옆에서 `stylex.create`로 스타일을 정의하고 `stylex.props`로 적용합니다. `globals.css`는 생성된 CSS를 삽입하는 `@stylex` 진입점입니다.

Babel은 JS/TS의 StyleX 호출을 변환하고 PostCSS는 `src/**`에서 CSS를 추출합니다. 두 설정은 같은 StyleX 변환 옵션을 사용하며 `@/`는 `src/`를 가리킵니다. Next의 기본 Turbopack 개발·빌드를 사용합니다. 스타일 파일은 검사 범위인 `src/` 아래에 둡니다.

StyleX 전용 ESLint 플러그인은 포함하지 않습니다. 기존 Oxlint와 TypeScript 검사를 유지하며, StyleX의 `valid-styles` 같은 전용 lint 규칙을 제공하지는 않습니다.

[StyleX 공식 Next.js 설정](https://stylexjs.com/docs/learn/installation/nextjs)을 기준으로 구성했습니다.

## Lint 정책과 한계

Oxlint **1.82.0**, Oxfmt **0.67.0**, Next **16.3.4**, React **19.3.0**, 웹 TypeScript **7.0.2**, `oxlint-tsgolint` **7.0.2001**에 고정되어 있습니다. `tsgolint`는 TS7.0.2 엔진을 사용합니다.

웹은 `options.typeAware: true`, `typeCheck: false`입니다. JS·TS·Oxc·Unicorn·import correctness에 React·Hooks·접근성을 추가합니다. `no-floating-promises`, `no-misused-promises`, `await-thenable`, unsafe 계열을 검사하며 타입 오류는 별도의 `typecheck`와 빌드가 검사합니다. Next 필수 default export는 허용합니다. `all` 카테고리는 사용하지 않습니다.

Next 플러그인의 공식 권장 규칙 22개 중 Oxlint 내장 대응 규칙 **21개**를 원래 severity로 명시하고, Core Web Vitals의 `no-html-link-for-pages`, `no-sync-scripts`를 error로 강화했습니다. **`no-location-assign-relative-destination`은 내장 구현이 없어 검사하지 않습니다.** 이 비교는 Next 전용 플러그인에 한정되며 `eslint-config-next` 전체와 동등하다는 의미가 아닙니다. JS 플러그인은 설치하지 않습니다.

React Compiler의 개별 correctness 규칙과 `react/unsupported-syntax`를 켭니다. 제거된 `react/react-compiler`는 사용하지 않습니다. Oxlint의 compiler 규칙은 실험적이며 공식 React 플러그인의 `config`, `gating`까지 제공하지 않습니다. compiler lint 활성화 자체가 Next의 React Compiler 변환을 켜는 것은 아닙니다.

`lint`의 warning은 표시되지만 종료 코드를 실패로 바꾸지는 않습니다. error는 실패합니다. `lint:fix`는 `--fix`만 사용하고 `--fix-suggestions`·`--fix-dangerously`를 사용하지 않습니다. 포맷은 Oxfmt가 맡으며 import 정렬·Tailwind 정렬은 끕니다.

생성물 `.next`, `out`, `dist`, `coverage`, `node_modules`, `next-env.d.ts`, `*.tsbuildinfo`는 제외합니다. 생성 전 예제와 실행 스크립트는 제외하지 않습니다.

## 에디터

[Oxc 확장](https://marketplace.visualstudio.com/items?itemName=oxc.oxc-vscode)을 설치합니다. 이 폴더를 열면 `.vscode/settings.json`의 웹 type-aware 설정이 적용됩니다.

CLI와 LSP는 같은 앱의 `.oxlintrc.json`을 읽습니다. schema는 `./node_modules/oxlint/configuration_schema.json`입니다. 모노레포 상위 설정을 상속하지 않으며 루트 전용 `options`를 중첩 설정으로 로드하지 않도록 각 앱에서 실행합니다.

## 근거 및 업데이트

- [Oxlint 설정과 탐색](https://oxc.rs/docs/guide/usage/linter/config), [중첩 설정](https://oxc.rs/docs/guide/usage/linter/nested-config), [타입 기반 lint](https://oxc.rs/docs/guide/usage/linter/type-aware)
- [Next 16.3.4 공식 규칙](https://github.com/vercel/next.js/blob/299180d3315c7ebd7b199d2b1a265b5986c5fc7d/packages/eslint-plugin-next/src/index.ts), [Oxlint 1.82.0 규칙](https://github.com/oxc-project/oxc/blob/b4da00b621ec2f6f67ed218f5366c45ed325331b/crates/oxc_linter/src/rules.rs)
- [React Compiler 규칙](https://oxc.rs/blog/2026-08-18-react-compiler-support), [Next 서버·클라이언트 경계](https://nextjs.org/docs/app/getting-started/server-and-client-components), [정적 export](https://nextjs.org/docs/app/guides/static-exports)
- [LSP 폴더별 설정](https://oxc.rs/docs/guide/usage/linter/lsp-config-reference.html)

버전 변경 시 이 템플릿을 단독 설치하고 lint·타입 검사·빌드·헬스체크를 다시 실행합니다. 이 README의 범위 밖인 공식 규칙·DB·배포·실제 에디터 UI 동작까지 검증됐다고 해석하지 않습니다.
