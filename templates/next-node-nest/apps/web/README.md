# Web

StyleX를 사용하는 Next.js 웹입니다. Node 24 이상과 pnpm 12.3.4를 사용합니다. workspace 루트에서 `pnpm install --frozen-lockfile`을 실행합니다.

이 폴더에서 `pnpm dev`, `pnpm build`, `pnpm start`, `pnpm lint`, `pnpm lint:fix`, `pnpm typecheck`, `pnpm format:check`, `pnpm format`을 실행합니다. 기본 포트는 3000이며 start는 빌드 후 실행합니다.

브라우저 → Next `/api/health` → Nest `/health` 순서로 호출합니다. 서버 전용 `API_URL`의 기본값은 `http://localhost:3001`입니다. `.env.example`을 `.env.local`로 복사해 변경할 수 있습니다. 빌드 시 Nest 실행은 필요하지 않습니다.

TS7과 타입 기반 Oxlint를 사용합니다. Nest·DB 구현 직접 import와 `require()`는 제한합니다. 클라이언트는 `src/client/` 또는 `*.client.*`, 서버는 `src/server/`와 `server-only`를 사용합니다. StyleX는 `src/`에서 CSS를 추출합니다.

[전체 구성과 검사 한계](../../README.md)를 참고하세요.
