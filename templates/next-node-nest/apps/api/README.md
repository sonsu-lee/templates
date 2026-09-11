# API

NestJS API입니다. 설치와 공통 명령은 [workspace README](../../README.md)를 참고하세요. 이 폴더에서도 `pnpm dev`, `pnpm check`, `pnpm verify`를 실행할 수 있습니다.

`GET /health`는 `{ "status": "ok" }`를 반환합니다. `PORT`는 기본 8080이며 프로세스 환경으로 전달합니다. `.env.example`은 자동 로딩하지 않습니다.

TS6이 컴파일과 decorator metadata 생성을 담당합니다. DI에 필요한 클래스는 런타임 import를 유지합니다. 타입 기반 lint와 `consistent-type-imports`는 사용하지 않습니다.

## Swagger와 Zod

- Swagger UI: <http://localhost:8080/docs>
- OpenAPI JSON: <http://localhost:8080/docs-json>

Nest의 공식 Standard Schema 연동을 사용합니다. `health.schema.ts`의 Zod 스키마를 타입 추론, `@SerializeOptions({ schema })`의 응답 검증, `@ApiOkResponse({ standardSchema })`의 문서 생성에 함께 사용합니다.

요청 검증은 전역 `StandardSchemaValidationPipe`에 연결된 `@Body({ schema })`, `@Query({ schema })`, `@Param({ schema })`로 지정합니다. 스키마를 지정하지 않은 요청·응답은 자동 검증하지 않습니다. 응답 검증 실패는 500이며 선언하지 않은 응답 필드는 제거됩니다.

현재 Swagger 문서는 모든 실행 환경에서 노출됩니다. 배포 시 공개 범위에 맞게 설정하세요. [Nest 공식 연동 문서](https://docs.nestjs.com/openapi/introduction#standard-schema-zod-valibot)
