# Web

Next.js와 StyleX를 사용하는 정적 웹입니다. 설치, 환경 변수, 공통 명령어는 [프로젝트 README](../../README.md)를 참고하세요.

## 실행

이 디렉터리에서 `pnpm dev`로 개발 서버를 실행합니다. 기본 주소는 <http://localhost:3000>입니다.

빌드 결과를 확인하려면 개발 서버를 종료한 뒤 실행합니다.

```sh
pnpm build
pnpm start
```

정적 파일은 `out/`에 생성되며 `start`는 `serve`로 해당 파일을 제공합니다.

## 소스 구조

- `src/app/`: 페이지, 레이아웃, 전역 스타일
- `src/client/` 또는 `src/**/*.client.*`: Client Component

실시간 데이터는 브라우저에서 Nest API를 호출합니다. API 주소는 `NEXT_PUBLIC_API_URL`로 설정합니다.
