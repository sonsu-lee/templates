# Personal application templates

개인 프로젝트에 복사해 사용하는 Next.js 템플릿 모음입니다. StyleX, Oxlint, Oxfmt를 사용합니다.

| 템플릿                                                           | 구성                                                |
| ---------------------------------------------------------------- | --------------------------------------------------- |
| [Next.js 풀스택](templates/next-fullstack/README.md)             | Next.js가 화면과 API를 처리                         |
| [Next.js Node + NestJS](templates/next-node-nest/README.md)      | Next.js 웹과 NestJS API를 분리한 pnpm workspace     |
| [Next.js 정적 웹 + NestJS](templates/next-static-nest/README.md) | 정적 export 웹과 NestJS API를 분리한 pnpm workspace |

## 사용법

Node **24 이상**과 pnpm **12.3.4**가 필요합니다. 저장소 루트에서 사용할 템플릿을 새 프로젝트 경로로 복사합니다.

```sh
cp -R templates/next-fullstack ../my-app
cd ../my-app
pnpm install --frozen-lockfile
pnpm dev
```

웹은 <http://localhost:3000>에서 확인할 수 있습니다. 환경 변수, 명령어, 배포 방법은 각 템플릿 README를 참고하세요.
