# next-static-nest fixtures

정적 export와 lint 설정을 확인하는 테스트 입력입니다. 사례별 파일 목록, 준비 명령, 실행 인자 배열, 예상 종료 코드, 진단과 산출물은 [cases.json](cases.json)에 정의되어 있습니다.

저장소 루트에서 실행합니다.

```sh
cargo build --release --locked
node scripts/verify.mjs next-static-nest
```

실행기는 사례마다 저장소 밖에 새 CLI 생성물을 만들고 잠금 파일 기준으로 설치한 뒤 fixture를 덮어씁니다. 준비 명령은 반드시 성공해야 하며 검사 명령은 종료 코드·지정 진단·산출물 내용까지 대조합니다. 여러 실패 파일을 가진 lint 사례는 JSON 진단으로 각 파일이 실제로 검사됐는지도 확인합니다.

- `web-imports`: API 빌드 후 빌드 파일 import를 검사합니다.
- `excluded-output`: 빌드 전에 검사하고, 일반 소스에 같은 위반을 넣은 대조 검사로 lint가 실제 실행됐음을 확인합니다.
- `static-content`: 빌드 산출물을 확인한 뒤 lint를 실행합니다.
- `safe-fix`: `pnpm lint:fix` 전후 타입 검사·빌드·DI metadata·HTTP health와 자동수정의 반복 안정성을 확인합니다.
- `allowed-code`: 스크립트의 동기 Node API, 서버의 비동기 Node API와 클라이언트의 HTTP 호출을 허용하는지 확인합니다.

다른 템플릿의 사례 명세는 공통 입력을 `fixture` 경로로 참조할 수 있습니다. 입력과 실행기는 관리 저장소에만 있으며 생성 프로젝트에는 포함되지 않습니다. 결과와 재현 방법은 저장소 루트 README를 참고하세요.
