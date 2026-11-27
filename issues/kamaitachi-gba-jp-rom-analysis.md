# 일본판 GBA ROM 역분석 인계

Claude-A에게. 일본판 AKZJ 원본을 기준으로 진행한 어셈블리 분석과 독립 검수의 현재 상태다. 전체 의미 해석은 미완료 상태다. 기준 ROM은 16,777,216바이트이고 SHA-256은 `d3dcb52173c1105aeeed74680e922ef742eaef41c1497768ae5a4aea94efffee`다.

## 확인한 동작

- 시나리오 뱅크 35개의 명령 경계 52,754개와 VM 핸들러 101종을 분석했다. 정상 입력으로 플로차트를 열어 뱅크 27의 첫 명령을 실행했다. 특수 참조 47개 중 46개는 메뉴의 유형 검사에서 재개가 차단됐다. 노드 261은 표시 플래그를 강제로 켰을 때만 해당 행으로 재개하는 것을 확인했다. [플로차트 분석과 로그](https://github.com/b025831psn-ship-it/kamaitachi-gba-kor/blob/cb3c121/analysis/jp-whole/scenario/chart-reachability.md)
- ROM 끝부분에서 AGBPrint의 상태·보호·출력 주소를 확인했다. mGBA 0.10.5에서는 보호값을 직접 쓴 실험에서 에뮬레이터의 출력 스텁이 활성화됐다. 개발 장비에서 실제 페이지가 전환되는 조건은 미확정이다. [디버그 페이지 분석](https://github.com/b025831psn-ship-it/kamaitachi-gba-kor/blob/cb3c121/analysis/jp-whole/embedded/activation.md)
- 독립 검수에서 네 입력 경로의 PC·RAM 기록과 플로차트 결과를 재현했다. [독립 검수 보고서](https://github.com/b025831psn-ship-it/kamaitachi-gba-kor/blob/cb3c121/analysis/jp-whole/review/README.md)

## 종결한 항목 (2026-11-24)

두 항목을 아래 기준으로 닫았다. Codex-A가 작성했고 Claude-A가 검수했다. [종결 근거](https://github.com/b025831psn-ship-it/kamaitachi-gba-kor/blob/9f7c56e/analysis/jp-whole/closure.md) · [743바이트 분류표](https://github.com/b025831psn-ship-it/kamaitachi-gba-kor/blob/9f7c56e/analysis/jp-whole/systems/closure.tsv)

- **미분류 743바이트: 종결.** 사유별로 나누면 다음과 같다.
  - D 654: 정상 VM 디스패치 상한 밖. 시나리오 명령 52,754개의 최대 opcode는 0x64이고, 101칸 표는 `0881FF74`에서 끝난다.
  - C 4: 강제 상태에서만 읽힌 워드.
  - N 38: 확인한 루틴의 인덱스 상한이나 초기 상태 때문에 읽지 않는 바이트.
  - R 43: 오디오·효과·라이브러리 잔여. 615개 트랙에서 해당 오디오 키는 선택되지 않는다. 효과 플래그 197은 정상 ID 범위 0–196 밖이다.
  - A 4: 정렬 후보.
  - 검수: 합계 743, 구간 겹침 없음, cb3c121 주소표의 `unresolved` 바이트 집합과 정확히 일치.
- **ROM 끝 디버그 페이지: 종결.**
  - 본편 코드에서는 도달 경로를 찾지 못했다. 간접 분기 BX 654·MOV PC 22·스텁 호출 54곳의 정적 추적에서 0건, 정상 실행에서 진입 0회.
  - 활성화하려면 외부 디버거가 이 영역을 매핑하고 보호값을 써야 하며, 이는 개발 환경의 조건으로 기록한다. 실물 장비의 페이지 전환 순서는 장비 없이 검증할 수 없어 이번 범위 밖이다.

10×7 비트맵 후보 70바이트는 743바이트 집계 밖이며 소비 루틴이 없다는 기록을 유지한다.

## 이어서 확인할 근거 (종결 전 기록)

- 전체 주소표에서 미분류인 바이트는 743개다. 가장 큰 구간은 파일 오프셋 `81FF74–82026C`에 있다. 네 일반 입력 경로와 정상 플로차트 진입을 감시한 결과 이 범위의 CPU·DMA 데이터 읽기는 0건이었다.
- 강제 진입에서 잔류 opcode `9E` 때문에 Thumb 명령 `08003478`이 버스 주소 `08820058`의 4바이트를 읽었다. 이는 VM 디스패치 표의 범위를 벗어난 계산으로 발생한다.
- 파일 오프셋 `8206B0–8206F6`의 70바이트는 10×7 비트맵 후보로 분류했다. 원본에서 이 데이터를 읽는 루틴은 미확정이다. 이 후보와 다른 미검증 정렬·명령 후보가 존재하므로 미분류 바이트 수를 전체 의미 해석의 진척률로 사용할 수 없다.

새 분석을 추가할 때는 파일 오프셋과 GBA 버스 주소, 데이터를 읽는 명령, 관찰한 진입 조건을 함께 기록해 달라. 특히 노드 261에 이르는 일반 입력 경로나 개발 장비의 페이지 매핑을 확인할 수 있는 근거가 있으면 기존 강제 진입 결과와 대조할 수 있다.

[분석 전체와 재현 방법](https://github.com/b025831psn-ship-it/kamaitachi-gba-kor/tree/cb3c121/analysis/jp-whole) · [전체 주소표](https://github.com/b025831psn-ship-it/kamaitachi-gba-kor/blob/cb3c121/analysis/jp-whole/coverage.tsv) · [읽기 추적과 재현 코드](https://github.com/b025831psn-ship-it/kamaitachi-gba-kor/blob/cb3c121/analysis/jp-whole/systems/unresolved-reads.md)
