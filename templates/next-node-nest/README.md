# next-node-nest

Next.js Node 서버와 NestJS API를 함께 사용하는 pnpm workspace입니다. 이 디렉터리만 복사해 설치합니다. 웹과 API는 각각 Oxlint·Oxfmt·TypeScript 설정과 의존성을 소유합니다. 공통 Oxlint 설정·Turbo·DB·ORM은 포함하지 않습니다. ESLint·외부 lint 플러그인 없이 각 앱의 Oxlint 내장 규칙과 Oxfmt로 검사합니다.

## 시작

Node **24 이상**과 pnpm **12.3.4**를 사용합니다. 최신 LTS를 권장합니다. `.node-version`은 `24`, `packageManager`는 pnpm 버전을 지정합니다. `pnpm-workspace.yaml`의 `saveExact: true`로 새 의존성을 정확한 버전으로 저장합니다.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

웹은 <http://localhost:3000>, Nest 헬스체크는 <http://localhost:8080/health>입니다. 버튼은 Next `/api/health`를 호출하고 Next 서버가 Nest `/health`를 호출합니다. Nest 연결 실패·오류·잘못된 응답은 원인을 Next 서버 로그에 기록하고 502로 반환하며 제한 시간은 5초입니다. 헬스체크는 프로세스·HTTP·constructor DI만 확인하며 DB readiness는 검사하지 않습니다.

| 명령                | 동작                                                      |
| ------------------- | --------------------------------------------------------- |
| `pnpm check`        | 앱별 lint·웹 타입 검사, API TS6 타입 검사, 전체 포맷 검사 |
| `pnpm verify`       | check 후 Next와 Nest 빌드                                 |
| `pnpm dev`          | 두 앱의 개발 서버 실행                                    |
| `pnpm build`        | Next와 Nest 빌드                                          |
| `pnpm typecheck`    | API TS6 타입 검사 (웹은 lint에 포함)                      |
| `pnpm lint`         | 앱별 작업 디렉터리에서 독립 lint                          |
| `pnpm lint:fix`     | 앱별 안전한 자동수정                                      |
| `pnpm format:check` | 앱·루트 문서·설정 포맷 검사                               |
| `pnpm format`       | Oxfmt 포맷·package.json 정렬 적용                         |

빌드 후 별도 터미널에서 `pnpm --dir apps/api start`와 `pnpm --dir apps/web start`를 실행합니다. 빌드 시 Nest가 실행 중일 필요는 없습니다.

## 환경 변수

- 웹은 서버 전용 `API_URL`(기본 `http://localhost:8080`)을 요청 시 읽습니다. `apps/web/.env.example`을 `.env.local`로 복사하거나 프로세스 환경으로 전달합니다. 컨테이너에서는 Next가 접근할 수 있는 Nest 서비스 주소를 지정합니다.
- 브라우저는 같은 출처의 Next API를 호출하므로 이 예제에는 Nest CORS 설정이 필요하지 않습니다.
- Nest는 프로세스 환경의 `PORT`(기본 `8080`)를 읽습니다. `.env.example`은 자동 로딩하지 않습니다. 예: `PORT=4001 pnpm --dir apps/api start`.

## 앱별 설정과 경계

[웹](apps/web/README.md)은 Next **16.3.4**, React **19.3.0**, TS **7.0.2**, `oxlint-tsgolint` **7.0.2001**을 사용합니다. [API](apps/api/README.md)는 Nest 런타임 **12.0.1**, CLI **12.0.0**, TS **6.0.3**을 사용합니다. 각 앱에 Oxlint **1.82.0**과 Oxfmt **0.67.0**을 포함합니다.

- 웹의 `options.typeAware`와 `options.typeCheck`는 모두 `true`로, lint 규칙과 TypeScript 오류를 함께 검사합니다. API는 둘 다 `false`이며 TS6으로 별도 타입 검사를 실행합니다. 웹의 `lint`와 `lint:fix`는 먼저 `next typegen`으로 생성 타입을 갱신합니다. 웹의 별도 `tsc --noEmit` 명령은 제거했으며 루트 `pnpm typecheck`는 API만 검사합니다. Nest CLI가 JavaScript compiler API를 사용하므로 TS6을 유지합니다. 루트 TypeScript override는 없습니다. `tsc`는 미처리 Promise·Promise 오용 lint를 대신하지 않습니다.
- 웹 전체에서 Nest 구현, API 소스·빌드 결과, Drizzle·Kysely·대표 DB 드라이버 직접 import와 `require()`를 제한합니다. 서버도 HTTP로 Nest에 접근합니다. 새 패키지·별칭을 추가하면 목록을 갱신합니다. 계산된 동적 import와 임의 별칭 전체를 추적하지는 않습니다.
- 웹 Client Component는 `src/client/**` 또는 `src/**/*.client.*`에 둡니다. 여기서 Node·서버 모듈 직접 import를 금지합니다. 서버는 `src/server/`와 `server-only`를 사용합니다. `env`만으로 실제 서버·클라이언트 경계를 검증할 수 없으며 경로 규약 밖의 Client Component와 전이 import는 Next 빌드에서도 확인해야 합니다.
- 서버 소스는 동기 I/O와 직접 `process.exit()`를 제한합니다. 개발 스크립트는 `scripts/`에 두며 웹에서는 ESM import를 사용합니다.
- API의 `typescript/consistent-type-imports`는 끕니다. DI 클래스의 런타임 import와 `experimentalDecorators`·`emitDecoratorMetadata`를 유지합니다.
- `all` 카테고리는 사용하지 않습니다. warning은 lint를 실패시키지 않으며 `lint:fix`는 `--fix`만 사용합니다. 빌드 결과·coverage·Next 생성 선언은 제외하고 설정·스크립트 소스는 검사합니다. 웹 lint는 `next typegen`이 생성하는 `.next/types/validator.ts`를 명시적으로 포함해 페이지·레이아웃·Route Handler의 타입 계약도 검사합니다. 생성 파일에는 `-A all`로 내장 lint 규칙을 끄고 타입 검사만 실행하며 자동수정하지 않습니다. `.next/` 전체를 Oxlint에서 제외하면 이 검사까지 빠지므로 cache·server·static·dev 하위 디렉터리를 제외합니다.

웹은 React·Hooks·접근성·Next 내장 규칙을 적용합니다. Next 권장 규칙 22개 중 Oxlint 대응 규칙 21개를 명시하고 Core Web Vitals 링크·동기 스크립트 규칙은 error입니다. `no-location-assign-relative-destination`은 내장 구현이 없어 검사하지 않습니다. `eslint-config-next` 전체와 동등하지 않습니다. React Compiler 개별 correctness 규칙과 `unsupported-syntax`를 사용하지만 미구현 `config`·`gating` 검사나 Compiler 변환 활성화를 제공하지 않습니다.

## 정렬과 검증 명령

- **Oxlint**: 내장 `sort-imports`를 error로 적용하고 `ignoreDeclarationSort: true`로 선언 순서 검사는 끕니다. named import의 로컬 이름을 알파벳순으로 검사·자동수정합니다. `import type`으로 변환하지 않습니다. 진단의 `eslint(sort-imports)` 표기는 원본 규칙의 이름 공간이며, 실행은 Oxlint의 Rust 내장 구현이 담당합니다.
- **Oxfmt**: 코드 포맷, import 선언·그룹 정렬, `package.json`의 키·의존성·scripts 정렬을 담당합니다. `sortImports: { "sortSideEffects": false }`로 부수 효과 import 정렬을 끄고, 내장 기본 그룹과 내부 경로 식별(`@/` 포함)을 사용합니다. StyleX를 사용하므로 `sortTailwindcss: false`를 유지합니다. `sortPackageJson: { "sortScripts": true }`로 package.json 정렬을 켭니다.
- **검증**: 변경 후 `pnpm check`, 전달 전 `pnpm verify`를 실행합니다. check는 소스를 자동수정하지 않으며 Next의 생성 타입은 갱신합니다. named import 위반은 lint 오류로, 선언·그룹 정렬 위반은 format:check 실패로 검출됩니다. verify는 check가 성공한 뒤 빌드합니다. 자동수정은 `pnpm lint:fix && pnpm format` 후 `pnpm check`로 확인합니다. 이 명령을 CI나 에이전트의 완료 조건에서 실제로 호출해야 검사가 강제됩니다.

ESLint 본체·ESLint 플러그인·JS 플러그인 로더는 사용하지 않습니다. 각 앱은 Oxlint와 Oxfmt 설정을 직접 소유합니다.

`import "server-only"`, `import "reflect-metadata"`, CSS 같은 부수 효과 import끼리의 기존 순서는 보존합니다. 일반 import는 이를 넘어 재배치될 수 있으므로 초기화 순서에 의존하는 import 묶음은 각 import 앞에 `// oxfmt-ignore`를 붙여 정렬에서 제외합니다. named import 이름의 순서만 예외로 둘 때는 `// oxlint-disable-next-line sort-imports -- 예외 사유`를 사용합니다.

[Oxlint 내장 sort-imports](https://oxc.rs/docs/guide/usage/linter/rules/eslint/sort-imports.html), [Oxfmt 정렬](https://oxc.rs/docs/guide/usage/formatter/sorting.html)을 참고하세요.

## 스타일과 에디터

웹은 **StyleX 0.19.0**의 `stylex.create`와 `stylex.props`로 스타일을 적용합니다. Babel과 PostCSS가 동일한 변환 옵션을 사용하고 `globals.css`의 `@stylex`에 CSS를 생성합니다. 스타일 파일은 `apps/web/src/`에 둡니다. 기본 Turbopack 개발·빌드를 유지하며 StyleX 전용 ESLint 규칙은 포함하지 않습니다. Tailwind 정렬은 사용하지 않습니다.

`project.code-workspace`를 열면 web과 api가 별도 폴더가 됩니다. [Oxc 확장](https://marketplace.visualstudio.com/items?itemName=oxc.oxc-vscode)의 폴더별 설정에서 웹만 타입 기반 lint를 사용합니다. 전체 workspace에 `oxc.typeAware`를 강제하지 않습니다. 각 schema는 해당 앱의 `./node_modules/oxlint/configuration_schema.json`입니다. 루트에서 Oxlint를 직접 실행하지 말고 `pnpm lint`로 앱별 명령을 호출합니다.

## 참고

- [StyleX Next.js 설정](https://stylexjs.com/docs/learn/installation/nextjs)
- [Oxlint 타입 기반 lint](https://oxc.rs/docs/guide/usage/linter/type-aware), [중첩 설정](https://oxc.rs/docs/guide/usage/linter/nested-config), [LSP 폴더별 설정](https://oxc.rs/docs/guide/usage/linter/lsp-config-reference.html)
- [Next 서버·클라이언트 경계](https://nextjs.org/docs/app/getting-started/server-and-client-components)

버전 변경 시 독립 복사본의 설치·lint·포맷·타입 검사·빌드와 두 서버의 헬스체크를 확인합니다. 정상 코드와 금지 import·Promise 위반은 임시 파일로 확인합니다. 다른 운영체제·배포 환경·실제 VS Code UI는 별도 검증 대상입니다.
