# Personal application templates

개인 프로젝트의 시작점으로 복사해 사용하는 템플릿을 제공합니다.

| 템플릿                                                      | 구성                                            |
| ----------------------------------------------------------- | ----------------------------------------------- |
| [Next.js 풀스택](templates/next-fullstack/README.md)        | Next.js가 화면과 API를 처리                     |
| [Next.js Node + NestJS](templates/next-node-nest/README.md) | Next.js 웹과 NestJS API를 분리한 pnpm workspace |

## 사용

새 프로젝트 경로로 템플릿 디렉터리를 복사합니다. 아래 명령은 저장소 루트에서 실행하며, 대상 경로는 아직 존재하지 않아야 합니다.

```sh
cp -R templates/next-fullstack ../my-app
cd ../my-app
pnpm install --frozen-lockfile
pnpm dev
```

Node 24 이상과 pnpm 12.3.4를 사용합니다. Node는 최신 LTS를 권장합니다. 웹은 `http://localhost:3000`, 헬스체크는 `http://localhost:3000/api/health`에서 확인합니다.

## 구성

템플릿은 Oxlint·Oxfmt·TypeScript 설정, 의존성과 잠금 파일, 실행 명령과 에디터 설정을 직접 소유합니다. 공통 lint 설정을 상속하지 않습니다. Next는 StyleX와 TS7 타입 기반 lint를 사용하고, 예제는 첫 화면과 HTTP 헬스체크만 제공합니다.

Next 정적 + Nest 템플릿, Rust CLI, 공통 검증 실행기·CI와 릴리스 배포는 별도 이슈에서 다룹니다.
