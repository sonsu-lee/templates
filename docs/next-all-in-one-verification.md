# Next 올인원 검증 기록

검증일: 2026-09-11. 대상: `templates/next-all-in-one`. 환경: macOS arm64, Node 24.21.0, pnpm 12.3.4. Next 16.3.4, TypeScript 7.0.2, Oxlint 1.82.0, Oxfmt 0.67.0, `oxlint-tsgolint` 7.0.2001을 사용했습니다.

## 설치와 실행

템플릿 디렉터리만 저장소 밖 OS 임시 경로에 복사하고 `pnpm install --frozen-lockfile`로 설치했습니다. Rust CLI, 다른 템플릿, 관리 저장소의 설정·의존성은 필요하지 않았습니다.

| 검사 | 결과 |
| --- | --- |
| `pnpm lint` | 정상 소스 통과 |
| `pnpm format:check` | 템플릿의 코드·설정·문서 통과 |
| `pnpm typecheck` | `next typegen && tsc --noEmit` 통과, TypeScript 7.0.2 확인 |
| `pnpm build` | 프로덕션 빌드 통과, `/api/health`는 동적 Node Route Handler |
| 프로덕션 서버 기동 | `/` HTTP 응답과 `/api/health`의 HTTP 200·`{"status":"ok"}` 확인 |
| 설정 독립성 | 설치된 Oxlint schema 확인, 공통 `extends`·JS 플러그인 없음 |

## 규칙과 경계

기본 검증 명령 26건 중 17건은 의도한 실패 사례입니다. 모두 기대한 종료 코드와 진단을 확인했습니다. 별도의 추가 검사 4건은 `await-thenable`과 클라이언트의 Drizzle·Kysely·pg 직접 import를 확인했으며 모두 의도한 규칙으로 실패했습니다. HTTP와 native LSP 검사는 명령 건수와 별도로 기록했습니다.

- 미처리 Promise·Promise 조건식·unsafe 위반을 검출하고 정상 Promise 처리를 허용했습니다.
- React Hooks·접근성·Next 동기 스크립트·React Compiler purity 위반을 검출했습니다. TSX와 JSX를 모두 확인했습니다.
- 클라이언트 경로와 `.client.ts`·`.client.mjs`의 Node import, 클라이언트의 `require()`·서버 모듈·DB 런타임 직접 import를 검출했습니다.
- 런타임 서버의 동기 I/O·`process.exit()`를 검출하고 `scripts/`의 동기 파일 읽기는 허용했습니다.
- `server-only` 모듈을 공용 helper를 통해 Client Component로 가져오면 빌드가 서버·클라이언트 경계 진단으로 실패했습니다. 모듈을 찾지 못해서 발생한 실패와 구분했습니다.
- 앱·설정·스크립트의 `debugger` 위반을 검출했습니다. 빌드 디렉터리·coverage·node_modules·Next 생성 선언이 열거 대상에서 제외되는지 확인했습니다.
- `.vscode/settings.json`의 옵션으로 native LSP를 실행하여 일반 규칙과 타입 기반 Promise 진단을 확인했습니다. 실제 VS Code UI 자동화와는 구분합니다.

재현 방법과 입력 파일은 [fixture 안내](../tests/fixtures/next-all-in-one/README.md)에 있습니다. 이번 실행은 로컬 검증 도구로 수행했으며, 반복 실행기와 GitHub Actions 도입은 별도 이슈 #5의 범위입니다.

## 브라우저 확인

별도 임시 복사본을 설치·빌드한 뒤 Chromium 151.0.7922.34에서 확인했습니다. 데스크톱은 1000×700, 모바일은 390×844이며 device scale factor 1, light theme, en-US, Asia/Tokyo를 사용했습니다.

- 초기 `Not checked` → 요청 중 버튼 비활성화 → 실제 HTTP 응답 후 `Healthy` 표시를 확인했습니다.
- HTTP 503을 주입하면 `Health check returned 503`을 표시하고 버튼을 다시 사용할 수 있었습니다.
- 모바일에서도 헬스체크가 성공하고 가로 넘침이 없었습니다.
- 처리되지 않은 브라우저 예외가 없었습니다.

신규 템플릿이라 비교할 이전 화면은 없습니다. 성공 상태의 스크린샷에서 1번 표시는 헬스체크 버튼과 결과 영역이며, 검토용 표시를 추가한 사본입니다.

## 범위와 한계

다른 운영체제, 원격 CI, 호스팅·컨테이너 배포, 실제 VS Code UI는 검증하지 않았습니다. 헬스체크는 DB readiness를 의미하지 않습니다. lint의 경로 규약 밖에 선언한 Client Component나 임의의 동적 모듈 로딩까지 모두 차단한다고 보장하지 않습니다.

정확한 명령 출력은 로컬 `.cache/verification/2026-09-11T10-16-48.011Z/`에, 추가 검사와 브라우저 결과는 `.cache/issue-1-validation/`에 보관했습니다. 로그·임시 실행기·설치 산출물·스크린샷은 템플릿 원본에 포함하지 않습니다.
