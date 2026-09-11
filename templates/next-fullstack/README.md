# next-fullstack

이 디렉터리만 복사해 사용하는 개인 프로젝트 템플릿입니다. 루트의 Oxlint·Oxfmt·TypeScript 설정으로 실행됩니다. 공유 Oxlint 설정이나 외부 설정 패키지는 없습니다. ESLint·외부 lint 플러그인 없이 Oxlint 내장 규칙과 Oxfmt로 검사합니다.

## 시작

Node **24 이상**과 pnpm **12.3.4**를 사용합니다. Node는 최신 LTS를 권장합니다. `.node-version`은 기본 개발 버전을 `24`로 지정하며, pnpm은 `packageManager`에 고정되어 있습니다. `pnpm-workspace.yaml`의 `saveExact: true`는 새로 추가하는 의존성도 정확한 버전으로 저장합니다.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

웹: <http://localhost:3000>. 헬스체크: <http://localhost:3000/api/health>. 첫 화면의 버튼으로 실제 응답을 확인합니다. 헬스체크는 프로세스와 HTTP 라우팅을 확인하며 DB readiness 검사는 포함하지 않습니다. 도메인 예제·DB 스키마·ORM 의존성은 추가하지 않았습니다.

| 명령                | 동작                                          |
| ------------------- | --------------------------------------------- |
| `pnpm check`        | lint·타입 검사·포맷 검사                      |
| `pnpm verify`       | check 후 Next 프로덕션 빌드                   |
| `pnpm lint`         | Next 타입 생성 후 lint·타입 검사              |
| `pnpm lint:fix`     | Oxlint 자동수정 후 생성된 Next 타입 계약 검사 |
| `pnpm build`        | Next 프로덕션 빌드                            |
| `pnpm format:check` | Oxfmt 형식·package.json 정렬 검사             |
| `pnpm format`       | Oxfmt 포맷·package.json 정렬 적용             |

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

웹은 `options.typeAware: true`, `typeCheck: true`입니다. JS·TS·Oxc·Unicorn·import correctness에 React·Hooks·접근성을 추가합니다. `no-floating-promises`, `no-misused-promises`, `await-thenable`, unsafe 계열을 검사하며 타입 오류도 lint에서 검사합니다. 별도의 `tsc --noEmit` 명령은 두지 않으며 빌드의 타입 검사도 유지합니다. Next 필수 default export는 허용합니다. `all` 카테고리는 사용하지 않습니다.

Next 플러그인의 공식 권장 규칙 22개 중 Oxlint 내장 대응 규칙 **21개**를 원래 severity로 명시하고, Core Web Vitals의 `no-html-link-for-pages`, `no-sync-scripts`를 error로 강화했습니다. **`no-location-assign-relative-destination`은 내장 구현이 없어 검사하지 않습니다.** 이 비교는 Next 전용 플러그인에 한정되며 `eslint-config-next` 전체와 동등하다는 의미가 아닙니다. Next 전용 JS 플러그인은 설치하지 않습니다.

React Compiler의 개별 correctness 규칙과 `react/unsupported-syntax`를 켭니다. 제거된 `react/react-compiler`는 사용하지 않습니다. Oxlint의 compiler 규칙은 실험적이며 공식 React 플러그인의 `config`, `gating`까지 제공하지 않습니다. compiler lint 활성화 자체가 Next의 React Compiler 변환을 켜는 것은 아닙니다.

`lint`의 warning은 표시되지만 종료 코드를 실패로 바꾸지는 않습니다. error는 실패합니다. `lint:fix`는 `--fix`만 사용하고 `--fix-suggestions`·`--fix-dangerously`를 사용하지 않습니다. 포맷과 정렬의 역할은 아래와 같습니다.

`lint`와 `lint:fix`는 먼저 `next typegen`으로 생성 타입을 갱신합니다. `.next/types/validator.ts`를 별도 파일 인자로 검사해 페이지·레이아웃·Route Handler의 타입 계약도 확인합니다. 이 생성 파일에는 `-A all`로 내장 lint 규칙을 끄고 타입 검사만 실행하며 자동수정하지 않습니다.

빌드 결과·coverage·의존성·Next 생성 선언은 제외하고 애플리케이션·설정·스크립트 소스는 검사합니다. `.next/` 전체를 Oxlint에서 제외하면 validator 검사도 빠지므로 cache·server·static·dev 하위 디렉터리만 제외합니다.

## 정렬과 검증 명령

- **Oxlint**: 내장 `sort-imports`를 error로 적용하고 `ignoreDeclarationSort: true`로 선언 순서 검사는 끕니다. named import의 로컬 이름을 알파벳순으로 검사·자동수정합니다. `import type`으로 변환하지 않습니다. 진단의 `eslint(sort-imports)` 표기는 원본 규칙의 이름 공간이며, 실행은 Oxlint의 Rust 내장 구현이 담당합니다.
- **Oxfmt**: 코드 포맷, import 선언·그룹 정렬, `package.json`의 키·의존성·scripts 정렬을 담당합니다. `sortImports: { "sortSideEffects": false }`로 부수 효과 import 정렬을 끄고, 내장 기본 그룹과 내부 경로 식별(`@/` 포함)을 사용합니다. StyleX를 사용하므로 `sortTailwindcss: false`를 유지합니다. `sortPackageJson: { "sortScripts": true }`로 package.json 정렬을 켭니다.
- **검증**: 변경 후 `pnpm check`, 전달 전 `pnpm verify`를 실행합니다. check는 소스를 자동수정하지 않으며 Next의 생성 타입은 갱신합니다. named import 위반은 lint 오류로, 선언·그룹 정렬 위반은 format:check 실패로 검출됩니다. verify는 check가 성공한 뒤 빌드합니다. 자동수정은 `pnpm lint:fix && pnpm format` 후 `pnpm check`로 확인합니다. 이 명령을 CI나 에이전트의 완료 조건에서 실제로 호출해야 검사가 강제됩니다.

ESLint 본체·ESLint 플러그인·JS 플러그인 로더는 사용하지 않습니다. 각 앱은 Oxlint와 Oxfmt 설정을 직접 소유합니다.

`import "server-only"`, `import "reflect-metadata"`, CSS 같은 부수 효과 import끼리의 기존 순서는 보존합니다. 일반 import는 이를 넘어 재배치될 수 있으므로 초기화 순서에 의존하는 import 묶음은 각 import 앞에 `// oxfmt-ignore`를 붙여 정렬에서 제외합니다. named import 이름의 순서만 예외로 둘 때는 `// oxlint-disable-next-line sort-imports -- 예외 사유`를 사용합니다.

[Oxlint 내장 sort-imports](https://oxc.rs/docs/guide/usage/linter/rules/eslint/sort-imports.html), [Oxfmt 정렬](https://oxc.rs/docs/guide/usage/formatter/sorting.html)을 참고하세요.

## 에디터

[Oxc 확장](https://marketplace.visualstudio.com/items?itemName=oxc.oxc-vscode)을 설치합니다. 이 폴더를 열면 `.vscode/settings.json`의 웹 type-aware 설정이 적용됩니다.

CLI와 LSP는 같은 앱의 `.oxlintrc.json`을 읽습니다. schema는 `./node_modules/oxlint/configuration_schema.json`입니다. 모노레포 상위 설정을 상속하지 않으며 루트 전용 `options`를 중첩 설정으로 로드하지 않도록 각 앱에서 실행합니다.

## 근거 및 업데이트

- [Oxlint 설정과 탐색](https://oxc.rs/docs/guide/usage/linter/config), [중첩 설정](https://oxc.rs/docs/guide/usage/linter/nested-config), [타입 기반 lint](https://oxc.rs/docs/guide/usage/linter/type-aware)
- [Next 16.3.4 공식 규칙](https://github.com/vercel/next.js/blob/299180d3315c7ebd7b199d2b1a265b5986c5fc7d/packages/eslint-plugin-next/src/index.ts), [Oxlint 1.82.0 규칙](https://github.com/oxc-project/oxc/blob/b4da00b621ec2f6f67ed218f5366c45ed325331b/crates/oxc_linter/src/rules.rs)
- [React Compiler 규칙](https://oxc.rs/blog/2026-08-18-react-compiler-support), [Next 서버·클라이언트 경계](https://nextjs.org/docs/app/getting-started/server-and-client-components), [정적 export](https://nextjs.org/docs/app/guides/static-exports)
- [LSP 폴더별 설정](https://oxc.rs/docs/guide/usage/linter/lsp-config-reference.html)

버전 변경 시 이 템플릿을 단독 설치하고 lint·타입 검사·빌드·헬스체크를 다시 실행합니다. 이 README의 범위 밖인 공식 규칙·DB·배포·실제 에디터 UI 동작까지 검증됐다고 해석하지 않습니다.
