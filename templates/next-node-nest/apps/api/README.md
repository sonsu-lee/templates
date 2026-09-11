# API

NestJS API입니다. Node 24 이상과 pnpm 12.3.4를 사용합니다. workspace 루트에서 `pnpm install --frozen-lockfile`을 실행합니다.

이 폴더에서 `pnpm dev`, `pnpm build`, `pnpm start`, `pnpm lint`, `pnpm lint:fix`, `pnpm typecheck`, `pnpm format:check`, `pnpm format`을 실행합니다. start는 빌드 후 실행합니다.

`GET /health`는 constructor DI로 주입된 서비스에서 `{ "status": "ok" }`를 반환합니다. DB readiness는 검사하지 않습니다. `PORT`는 기본 3001이며 프로세스 환경으로 전달합니다. 예: `PORT=4001 pnpm start`. `.env.example`은 자동 로딩하지 않습니다.

TS6이 컴파일과 decorator metadata 생성을 담당합니다. 일반 Oxlint만 실행하며 타입 기반 lint와 `consistent-type-imports`는 끕니다. 타입 검사는 미처리 Promise lint를 대신하지 않습니다.

[전체 구성과 검사 한계](../../README.md)를 참고하세요.
