# Next 올인원 검증 fixture

이 파일들은 의도한 위반을 포함합니다. 생성 프로젝트의 예제나 전체 저장소 lint 대상이 아닙니다. 각 사례를 **저장소 밖의 임시 복사본**에 하나씩 넣고, 확인 후 그 파일을 제거합니다. fixture 디렉터리에서 lint를 직접 실행하면 템플릿의 설정과 TypeScript 프로그램을 검증할 수 없습니다.

## 기본 검증

저장소 루트에서 실행합니다.

```sh
TEMPLATE_FIXTURES="$PWD/tests/fixtures/next-all-in-one"
TEMPLATE_SCRATCH="$(mktemp -d)"
cp -R templates/next-all-in-one "$TEMPLATE_SCRATCH/app"
cd "$TEMPLATE_SCRATCH/app"
pnpm install --frozen-lockfile
pnpm lint
pnpm format:check
pnpm typecheck
pnpm build
pnpm start
```

별도 터미널에서 `/api/health`가 HTTP 200과 `{"status":"ok"}`를 반환하는지 확인합니다. 첫 화면의 **Check health** 버튼은 성공 시 **Healthy**를 표시해야 합니다. 서버를 종료한 뒤 아래 검사를 진행합니다.

## 규칙 검증

예를 들어 미처리 Promise 검사는 다음과 같습니다. 종료 코드가 0이 아니고 결과에 `no-floating-promises`와 `no-misused-promises`가 모두 있어야 합니다. 같은 경로에 정상 fixture를 넣으면 통과해야 합니다.

```sh
cp "$TEMPLATE_FIXTURES/promises-bad.ts" src/verification-promises.ts
pnpm lint --format json
cp "$TEMPLATE_FIXTURES/promises-good.ts" src/verification-promises.ts
pnpm lint --format json
rm src/verification-promises.ts
```

아래 파일을 대상 경로에 하나씩 복사하고 `pnpm lint --format json`을 실행합니다. 실패만 확인하지 않고 해당 진단까지 확인합니다. 의도한 위반 파일에는 포맷 검사나 자동수정을 실행하지 않습니다.

| Fixture | 임시 복사본의 대상 경로 | 기대 결과 |
| --- | --- | --- |
| `promises-bad.ts` | `src/verification-promises.ts` | `no-floating-promises`, `no-misused-promises` |
| `promises-good.ts` | `src/verification-promises.ts` | 통과 |
| `floating.ts` | `src/verification-floating.ts` | `no-floating-promises`; LSP에서도 같은 진단 |
| `await-thenable.ts` | `src/verification-await.ts` | `await-thenable` |
| `unsafe.ts` | `src/verification-unsafe.ts` | `no-unsafe-*` |
| `client-node.ts` | `src/client/verification-node.ts` 또는 `src/verification.client.ts`, `src/verification.client.mjs` | `no-nodejs-modules` 또는 `no-restricted-imports` |
| `framework-bad.tsx` | `src/client/verification-framework.tsx` | `alt-text`, `no-sync-scripts`, `rules-of-hooks` |
| `framework-bad.jsx` | `src/verification-jsx.jsx` | `alt-text` |
| `compiler-bad.tsx` | `src/verification-compiler.tsx` | `purity` |
| `server-sync.ts` | `src/server/verification-sync.ts`, `src/server/verification-sync.mjs` | `no-sync` |
| `server-sync.ts` | `scripts/verification-sync.mjs` | 통과 |
| `process-exit.ts` | `src/server/verification-exit.ts` | `no-process-exit` |

추가로 `src/client/`에서 `require("node:fs")`는 `no-require-imports`, `@/server/*`·`drizzle-orm`·`kysely`·`pg`의 직접 import는 `no-restricted-imports`로 검출되어야 합니다. 이 검사는 DB 의존성을 설치하거나 실제 DB를 사용하지 않습니다.

## 서버·클라이언트의 전이 import

`boundary/src/`의 네 파일을 임시 복사본의 같은 `src/` 하위 경로에 복사한 뒤 `pnpm build`를 실행합니다. 파일은 서버 전용 모듈 → 공용 helper → Client Component → 페이지 순으로 연결됩니다.

빌드는 `only works in a Server Component` 또는 `cannot be imported from a Client Component` 진단으로 실패해야 합니다. `Module not found`·`Can't resolve` 실패는 경계 검증 성공이 아닙니다. 네 파일을 제거한 뒤 정상 빌드가 다시 통과하는지 확인합니다.

## 설정 로딩과 제외 범위

- `src/verification-config.ts`, `scripts/verification.mjs`, `verification.config.mjs`에 각각 `debugger;`를 넣으면 `no-debugger`로 실패해야 합니다.
- `.next`, `out`, `dist`, `coverage`, `node_modules`에 의도적으로 잘못된 문법의 파일을 넣고 `pnpm exec oxlint . --debug files`로 열거했을 때 해당 파일이 없어야 합니다. `next-env.d.ts`와 `*.tsbuildinfo`도 제외합니다.
- 위 검사는 정상 소스가 목록에 포함되는지도 함께 확인합니다. 파일이 전부 누락된 결과를 성공으로 보지 않습니다.

반복 실행 도구와 GitHub Actions 연결은 #5에서 다룹니다. 이 이슈에서는 템플릿별 사례와 재현 방법을 보관합니다.
