# next-node-nest

Next.js Node 서버와 NestJS API를 함께 실행하는 pnpm workspace입니다. 이 디렉터리만 복사해 사용합니다. 앱별 Oxlint·Oxfmt·TypeScript 설정은 독립적이며, DB·ORM은 포함하지 않습니다.

## 시작

Node **24 이상**(최신 LTS 권장)과 pnpm **12.3.4**가 필요합니다.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

- 웹: <http://localhost:3000>
- Nest 헬스체크: <http://localhost:8080/health>
- Swagger: <http://localhost:8080/docs> / [OpenAPI JSON](http://localhost:8080/docs-json)

첫 화면의 버튼은 Next `/api/health`를 거쳐 Nest `/health`를 호출합니다. 연결 실패·잘못된 응답·5초 타임아웃은 서버 로그에 기록하고 502로 반환합니다. DB readiness 검사는 포함하지 않습니다.

## 명령

workspace 루트에서 실행합니다.

| 명령                                | 동작                                           |
| ----------------------------------- | ---------------------------------------------- |
| `pnpm lint` / `pnpm lint:fix`       | 앱별 lint / 명시적 자동수정                    |
| `pnpm typecheck`                    | API TS6 타입 검사 (웹 타입 검사는 lint에 포함) |
| `pnpm format:check` / `pnpm format` | 전체 포맷 검사 / 적용                          |
| `pnpm build`                        | 두 앱 프로덕션 빌드                            |

자동수정은 `pnpm lint:fix && pnpm format`으로 실행합니다. 이후 각 검사 명령을 다시 실행합니다. `lint`는 소스를 자동수정하지 않으며 Next 생성 타입은 갱신합니다.

빌드 후 별도 터미널에서 `pnpm --dir apps/api start`와 `pnpm --dir apps/web start`를 실행합니다. 빌드 시 Nest가 실행 중일 필요는 없습니다.

## 환경 변수

| 앱  | 변수      | 기본값                  | 설정 방법                                                                  |
| --- | --------- | ----------------------- | -------------------------------------------------------------------------- |
| 웹  | `API_URL` | `http://localhost:8080` | `apps/web/.env.example`을 `.env.local`로 복사하거나 프로세스 환경으로 전달 |
| API | `PORT`    | `8080`                  | 프로세스 환경으로 전달. 예: `PORT=4001 pnpm --dir apps/api start`          |

API의 `.env.example`은 자동 로딩하지 않습니다. 컨테이너에서는 `API_URL`을 Next 서버가 접근할 수 있는 Nest 주소로 지정합니다. 브라우저는 같은 출처의 Next API를 호출합니다.

## 개발 규칙

- [웹](apps/web/README.md)은 StyleX·TS7과 타입 기반 Oxlint를 사용합니다. Next 생성 validator도 타입 검사에 포함하며 자동수정하지 않습니다.
- [API](apps/api/README.md)는 Nest 컴파일러 호환성을 위해 TS6을 사용합니다. 일반 lint와 타입 검사를 분리하고 DI에 필요한 런타임 클래스 import를 유지합니다.
- 데이터 접근은 Nest가 담당합니다. 웹에서 Nest 구현·DB 모듈 직접 import와 `require()`를 제한하며 Next 서버도 HTTP로 API를 호출합니다.
- Client Component는 `src/client/**` 또는 `src/**/*.client.*`에 둡니다. 서버 코드는 `src/server/**`와 `import "server-only"`를 사용합니다. Next가 내부 처리하므로 npm 패키지는 설치하지 않습니다. [Next 공식 설명](https://nextjs.org/docs/app/getting-started/server-and-client-components#preventing-environment-poisoning)
- 서버 소스의 동기 I/O·직접 `process.exit()` 사용은 제한합니다. 개발 스크립트는 각 앱의 `scripts/`에 둡니다.

named import 정렬은 Oxlint, import 선언·그룹·package.json 정렬과 포맷은 Oxfmt가 담당합니다. ESLint·외부 lint 플러그인은 사용하지 않습니다. 초기화 순서가 중요한 import 묶음은 각 import 앞에 `// oxfmt-ignore`를 붙입니다.

경로 기반 lint는 모든 전이 import를 추적하지 않으므로 `pnpm build`까지 실행합니다. Next·React·StyleX 공식 플러그인 전체와 동일한 검사 범위를 제공하지 않으며, warning은 검사 실패로 처리하지 않습니다. API의 타입 검사는 Promise 오용 lint를 대신하지 않습니다.

## 에디터

[Oxc 확장](https://marketplace.visualstudio.com/items?itemName=oxc.oxc-vscode)을 설치하고 `project.code-workspace`를 엽니다. web·api를 별도 폴더로 열어 웹에만 타입 기반 lint를 적용합니다. 루트에서는 `pnpm lint`로 앱별 검사를 실행합니다.

## CI

`.github/workflows/ci.yml`은 PR·main push·수동 실행 시 `Web lint & types`, `API lint`, `API types`, `Format`, `Web build`, `API build`를 각각 독립 job으로 실행합니다. 포맷은 workspace 전체를 한 번 검사합니다. 하나가 실패해도 다른 job은 계속 실행합니다. 각 job은 Node 24와 고정 pnpm 버전으로 frozen install 후 위 명령을 실행합니다. 기본 브랜치를 변경하면 workflow의 `push.branches`도 변경합니다.
