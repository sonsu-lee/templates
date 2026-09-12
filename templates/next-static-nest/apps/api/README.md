# API

Swagger와 Zod를 사용하는 NestJS API입니다. 설치, 환경 변수, 공통 명령어는 [프로젝트 README](../../README.md)를 참고하세요.

## 실행

이 디렉터리에서 `pnpm dev`로 개발 서버를 실행합니다. 기본 주소는 <http://localhost:8080>입니다.

빌드 결과를 실행하려면 개발 서버를 종료한 뒤 실행합니다.

```sh
pnpm build
pnpm start
```

## 엔드포인트

| 경로                                            | 설명                      |
| ----------------------------------------------- | ------------------------- |
| [`GET /health`](http://localhost:8080/health)   | `{ "status": "ok" }` 반환 |
| [`/docs`](http://localhost:8080/docs)           | Swagger UI                |
| [`/docs-json`](http://localhost:8080/docs-json) | OpenAPI JSON              |

헬스체크 예제는 `src/health.controller.ts`, `src/health.service.ts`, `src/health.schema.ts`에 있습니다. Zod 스키마를 응답 검증과 API 문서 생성에 사용합니다.
