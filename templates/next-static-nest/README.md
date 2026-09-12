# next-static-nest

Next.js 정적 웹과 NestJS API를 함께 개발하고 독립적으로 배포하는 pnpm workspace입니다. StyleX, Oxlint, Oxfmt를 사용하며 API에는 Swagger와 Zod가 설정되어 있습니다.

## 시작하기

Node **24 이상**과 pnpm **12.3.4**가 필요합니다. 이 템플릿 디렉터리를 복사한 뒤 아래 명령을 실행합니다.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

웹은 <http://localhost:3000>, API는 <http://localhost:8080>에서 실행됩니다. 첫 화면의 **Check health** 버튼으로 API 연결을 확인할 수 있습니다.

## 프로젝트 구조

| 경로                           | 역할            |
| ------------------------------ | --------------- |
| [apps/web](apps/web/README.md) | Next.js 정적 웹 |
| [apps/api](apps/api/README.md) | NestJS API      |

VS Code에서는 `project.code-workspace`를 열고 권장 Oxc 확장을 설치합니다.

## 명령어

프로젝트 루트에서 실행합니다. 앱별로 실행하려면 `pnpm --dir apps/web <명령>` 또는 `pnpm --dir apps/api <명령>`을 사용합니다.

| 명령                                | 설명                                        |
| ----------------------------------- | ------------------------------------------- |
| `pnpm dev`                          | 웹·API 개발 서버 실행                       |
| `pnpm build`                        | 웹·API 빌드                                 |
| `pnpm start`                        | 빌드된 웹·API 실행                          |
| `pnpm lint` / `pnpm lint:fix`       | lint 검사 / 자동수정                        |
| `pnpm typecheck`                    | API 타입 검사. 웹 타입 검사는 `lint`에 포함 |
| `pnpm format:check` / `pnpm format` | 포맷 검사 / 적용                            |

`pnpm start`를 실행하기 전에 `pnpm build`를 실행합니다. 웹은 정적 파일 서버인 `serve`로, API는 Node.js로 실행됩니다.

GitHub Actions는 PR과 `main` 브랜치 push 시 lint, 타입, 포맷, 빌드를 검사합니다.

## 환경 변수

| 앱  | 변수                  | 기본값                  |
| --- | --------------------- | ----------------------- |
| 웹  | `NEXT_PUBLIC_API_URL` | `http://localhost:8080` |
| API | `WEB_ORIGIN`          | `http://localhost:3000` |
| API | `PORT`                | `8080`                  |

웹은 `apps/web/.env.example`을 `apps/web/.env.local`로 복사해 설정합니다. `NEXT_PUBLIC_API_URL`에는 경로 없이 API origin을 지정합니다. 예를 들어 `https://api.example.com`으로 설정하면 `/health`를 해당 주소에 요청합니다. 이 값은 브라우저에 공개되며 빌드에 포함되므로 변경 시 재빌드해야 합니다.

API는 `.env`를 자동으로 읽지 않으므로 환경 변수를 프로세스에 전달합니다. `WEB_ORIGIN`에는 웹 주소를 지정합니다. 브라우저에서 접속하는 주소의 프로토콜·호스트·포트가 일치해야 CORS 요청이 허용됩니다.

## 배포

```sh
NEXT_PUBLIC_API_URL=https://api.example.com pnpm build
WEB_ORIGIN=https://app.example.com PORT=8080 pnpm --dir apps/api start
```

웹의 `apps/web/out`을 정적 호스트에 배포하고, API는 별도 Node.js 서비스로 실행합니다. 정적 호스트는 경로별 `index.html`을 제공하고 없는 경로는 404로 처리하도록 설정합니다. SPA fallback은 사용하지 않습니다.

웹은 정적 export를 사용합니다. 요청 시 서버 실행이 필요한 기능의 지원 여부는 [Next.js 정적 export 문서](https://nextjs.org/docs/app/guides/static-exports)를 참고하세요.
