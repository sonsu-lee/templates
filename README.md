# Personal application templates

개인 프로젝트에 복사해 사용하는 Next.js 템플릿입니다. StyleX·Oxlint·Oxfmt를 사용하며 각 템플릿이 설정과 의존성을 직접 소유합니다.

| 템플릿                                                      | 구성                                            |
| ----------------------------------------------------------- | ----------------------------------------------- |
| [Next.js 풀스택](templates/next-fullstack/README.md)        | Next.js가 화면과 API를 처리                     |
| [Next.js Node + NestJS](templates/next-node-nest/README.md) | Next.js 웹과 NestJS API를 분리한 pnpm workspace |

Node **24 이상**(최신 LTS 권장)과 pnpm **12.3.4**가 필요합니다. 저장소 루트에서 아직 존재하지 않는 경로로 복사합니다.

```sh
cp -R templates/next-fullstack ../my-app
cd ../my-app
pnpm install --frozen-lockfile
pnpm dev
```

변경 후 `pnpm check`, 빌드를 포함한 검증은 `pnpm verify`로 실행합니다. 앱별 환경 변수와 개발 규칙은 각 템플릿 README를 참고하세요.
