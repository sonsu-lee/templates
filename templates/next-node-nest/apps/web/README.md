# Web

StyleX를 사용하는 Next.js 웹입니다. 설치와 공통 명령은 [workspace README](../../README.md)를 참고하세요. 이 폴더에서도 `pnpm dev`, `pnpm check`, `pnpm verify`를 실행할 수 있습니다. 기본 포트는 3000입니다.

- 서버 전용 `API_URL`의 기본값은 `http://localhost:8080`입니다. `.env.example`을 `.env.local`로 복사해 변경합니다. `NEXT_PUBLIC_` 변수로 노출하지 않습니다.
- 클라이언트는 `src/client/` 또는 `*.client.*`에 두고 `"use client"`를 선언합니다. 서버 전용 모듈은 `src/server/`에 두고 `import "server-only"`를 유지합니다. 별도 npm 패키지는 필요하지 않습니다.
- StyleX 스타일은 `src/` 아래에 작성합니다. `globals.css`의 `@stylex` 진입점을 유지합니다.
