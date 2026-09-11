# API

NestJS API입니다. Node 24 이상과 pnpm 12.3.4를 사용합니다. workspace 루트에서 `pnpm install --frozen-lockfile`을 실행합니다.

이 폴더에서 `pnpm dev`, `pnpm build`, `pnpm start`, `pnpm lint`, `pnpm lint:fix`, `pnpm typecheck`, `pnpm format:check`, `pnpm format`을 실행합니다. start는 빌드 후 실행합니다.

`GET /health`는 constructor DI로 주입된 서비스에서 `{ "status": "ok" }`를 반환합니다. DB readiness는 검사하지 않습니다. `PORT`는 기본 3001이며 프로세스 환경으로 전달합니다. 예: `PORT=4001 pnpm start`. `.env.example`은 자동 로딩하지 않습니다.

TS6이 컴파일과 decorator metadata 생성을 담당합니다. 일반 Oxlint만 실행하며 타입 기반 lint와 `consistent-type-imports`는 끕니다. 타입 검사는 미처리 Promise lint를 대신하지 않습니다.

[전체 구성과 검사 한계](../../README.md)를 참고하세요.

## Swagger와 Zod

Swagger UI는 <http://localhost:3001/docs>, OpenAPI JSON은 <http://localhost:3001/docs-json>입니다. API 프로세스가 문서를 제공하며 현재 템플릿에서는 실행 환경과 무관하게 활성화됩니다.

Nest 12의 공식 Standard Schema 연동과 Zod 4.6.2, `@nestjs/swagger` 12.0.1을 사용합니다. `nestjs-zod` 5.5.0의 peer 범위는 Nest 10·11이므로 추가하지 않습니다.

`health.schema.ts`의 스키마에서 응답 타입을 추론합니다. 같은 스키마를 `@SerializeOptions({ schema })`와 `@ApiOkResponse({ standardSchema })`에 연결해 실제 응답 검증과 OpenAPI 정의를 맞춥니다. Zod의 Standard JSON Schema 기능으로 변환하므로 별도 변환 라이브러리나 DTO 클래스는 필요하지 않습니다.

전역 `StandardSchemaValidationPipe`와 `StandardSchemaSerializerInterceptor`를 등록합니다. 새 요청에는 `@Body({ schema })`, `@Query({ schema })`, `@Param({ schema })`처럼 스키마를 지정합니다. 스키마를 지정하지 않은 요청·응답은 자동 검증하지 않습니다. 헬스체크는 입력이 없어 요청 DTO를 추가하지 않았습니다. 응답 검증 실패는 500이며 선언하지 않은 응답 필드는 제거됩니다.

Swagger의 전이 의존성 `@scarf/scarf` 설치 스크립트는 `allowBuilds`에서 비활성화합니다.

[Nest 공식 Zod·Swagger 연동](https://docs.nestjs.com/openapi/introduction#standard-schema-zod-valibot)
