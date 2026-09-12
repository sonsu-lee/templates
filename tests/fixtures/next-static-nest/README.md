# next-static-nest fixtures

정적 export와 lint 설정을 확인하는 테스트 입력입니다. 각 디렉터리의 파일을 템플릿 복사본에 덮어써서 사용합니다. 사례별 명령, 예상 종료 코드, 진단과 산출물은 [cases.json](cases.json)에 정의되어 있습니다.

## 실행 방법

저장소 루트에서 실행합니다. 사례마다 저장소 밖에 새 복사본을 만듭니다.

```sh
fixture_case=static-content
fixture_root=$(mktemp -d)
cp -R templates/next-static-nest "$fixture_root/project"
cp -R "tests/fixtures/next-static-nest/$fixture_case/." "$fixture_root/project/"
cd "$fixture_root/project"
pnpm install --frozen-lockfile
pnpm --dir apps/web build
```

다른 사례는 `fixture_case`와 마지막 명령을 `cases.json`에 맞게 바꿉니다. 결과는 종료 코드뿐 아니라 지정된 진단과 산출물 내용까지 대조합니다.

- `web-imports`: lint 전에 `pnpm --dir apps/api build`로 import 대상인 API 빌드 파일을 생성합니다.
- `excluded-output`: 빌드 없이 `pnpm lint`를 실행합니다. 먼저 빌드하면 검사할 `dist` 파일이 삭제됩니다.
- `static-content`: 빌드에 이어 `pnpm --dir apps/web lint`도 확인합니다.
- `safe-fix`: `pnpm lint:fix` 전후로 API 타입 검사, 빌드와 `/health` 응답을 확인합니다.

이 fixture는 복사용 템플릿에 포함되지 않습니다.
