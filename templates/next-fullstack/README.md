# next-fullstack

Next.js가 화면과 API를 함께 처리하는 템플릿입니다. 이 디렉터리만 복사해 사용합니다. 스타일은 StyleX, 검사는 Oxlint·Oxfmt를 사용합니다.

## 시작

Node **24 이상**(최신 LTS 권장)과 pnpm **12.3.4**가 필요합니다.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

웹은 <http://localhost:3000>, 헬스체크는 <http://localhost:3000/api/health>입니다. 첫 화면의 버튼으로 응답을 확인할 수 있습니다. DB·ORM은 포함하지 않습니다.

## 명령

| 명령                                | 동작                             |
| ----------------------------------- | -------------------------------- |
| `pnpm lint` / `pnpm lint:fix`       | lint·타입 검사 / 명시적 자동수정 |
| `pnpm format:check` / `pnpm format` | 포맷 검사 / 적용                 |
| `pnpm build` / `pnpm start`         | 프로덕션 빌드 / 빌드한 서버 실행 |

자동수정은 `pnpm lint:fix && pnpm format`으로 실행합니다. 이후 각 검사 명령을 다시 실행합니다. `lint`는 소스를 자동수정하지 않으며 Next 생성 타입은 갱신합니다.

## 코드 작성 규칙

- Client Component는 `src/client/**` 또는 `src/**/*.client.*`에 두고 `"use client"`를 선언합니다. 이 경로에서는 Node·서버 모듈·DB의 직접 import와 `require()`를 제한합니다.
- 서버 전용 코드는 `src/server/**`에 두고 `import "server-only"`를 유지합니다. Next가 내부 처리하므로 npm 패키지는 설치하지 않습니다. 클라이언트의 간접 import도 빌드에서 차단합니다. [Next 공식 설명](https://nextjs.org/docs/app/getting-started/server-and-client-components#preventing-environment-poisoning)
- 서버 전용 환경 변수에는 `NEXT_PUBLIC_`를 붙이지 않습니다. `.env.example`을 참고해 `.env.local`을 작성합니다.
- 요청 처리 코드의 동기 I/O·직접 `process.exit()` 사용은 제한합니다. 개발·마이그레이션 스크립트는 `scripts/`에 둡니다.
- StyleX는 `src/` 아래에서 `stylex.create`·`stylex.props`로 작성합니다. `globals.css`의 `@stylex`는 생성 CSS의 진입점입니다.

## 검사와 에디터

TS7 타입 검사와 Promise·React·Hooks·접근성 검사는 Oxlint가 담당합니다. Next 생성 validator도 타입 검사에 포함하며 자동수정하지 않습니다. 설정·스크립트는 검사하고 빌드 결과는 제외합니다.

named import 정렬은 Oxlint, import 선언·그룹·package.json 정렬과 포맷은 Oxfmt가 담당합니다. ESLint·외부 lint 플러그인은 사용하지 않습니다. 초기화 순서가 중요한 import 묶음은 각 import 앞에 `// oxfmt-ignore`를 붙입니다.

경로 기반 lint는 모든 전이 import를 추적하지 않으므로 `pnpm build`까지 실행합니다. Next·React·StyleX 공식 플러그인 전체와 동일한 검사 범위를 제공하지 않으며, warning은 검사 실패로 처리하지 않습니다.

[Oxc 확장](https://marketplace.visualstudio.com/items?itemName=oxc.oxc-vscode)을 설치하고 이 폴더를 열면 `.vscode/settings.json`이 적용됩니다.

## CI

`.github/workflows/ci.yml`은 PR·main push·수동 실행 시 `Lint & types`, `Format`, `Build`를 각각 독립 job으로 실행합니다. 하나가 실패해도 다른 job은 계속 실행합니다. 각 job은 Node 24와 고정 pnpm 버전으로 frozen install 후 위 명령을 실행합니다. 기본 브랜치를 변경하면 workflow의 `push.branches`도 변경합니다.
