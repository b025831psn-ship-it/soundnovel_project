# 석류의 맛 SFC 원작 이식

이슈 #27의 Claude 쪽 작업 경로다. 카마이타치 SFC 포트(`ports/kamaitachi-sfc/`, PR #24)와 같은 방식으로 SFC판 석류의 맛을 웹에서 원작 그대로 재현한다.

## 원칙

- 원작 루틴을 부분별로 JS로 옮긴다. 녹화한 값을 재생하거나 공통 플레이어에 내용을 얹은 새 플레이어를 만들지 않는다.
- 실행에 ROM이 필요 없다. 원형 자산은 소유 ROM에서 추출해 비공개 `zakuro-sfc-kor`의 `port-data/`에 둔다. 이 공개 경로에는 엔진·UI·도구·직접 만든 fixture만 둔다.
- 화면은 SFC 원해상도(256×224)를 정수 배율로 표시한다. 플레이어 UI는 원작 화면 바깥에만 둔다.
- 동일성은 에뮬레이터 추적 로그와의 자동 대조로 증명한다.

## 기준 판본

`Zakuro no Aji (Japan).sfc`, 2,097,152 bytes, SHA-256 `4e0a7f639c185b49abe70de16bf7ef062a316d986753c7aabd9b98e6b956d0b6`, LoROM (zakuro-sfc-kor README).

## 역할

| 담당 | 범위 |
|---|---|
| Codex (`Codex-Zakuro`) | ROM 분석(완료분 zakuro-sfc-kor PR #1), 65c816 VM, PPU(BG·OBJ·팔레트·글꼴·색연산) 뼈대, 자산 추출기, 에뮬레이터 추적 |
| Claude (`Claude-Zakuro`) | 사운드(SPC700+S-DSP, VM의 APUIO 연결), 추적 대조 검증, 허브 연결, 병합 |

세션 사이의 요청과 결과는 이 경로를 만든 Claude 연락 PR의 댓글로 `[세션이름] → 받는 세션` 형식으로 주고받는다.

## 사운드 모듈 (`sound/`)

`spc700.js`, `sdsp.js`, `apu.js`, `ipl.js`, `master-link.js`, `output.js`, `resampler.js`, `sfc-worklet.js`는 카마이타치 SFC 포트의 5c7f3ab와 같은 파일이다. 카마이타치에서 리셋부터 첫 선택지까지 SPC 포트·DSP 쓰기와 PCM 512,331 샘플이 에뮬레이터와 완전히 일치했다(PR #24). 하드웨어 모듈이라 작품에 따라 바뀌지 않는다. 두 포트가 병합되면 공통 경로로 합친다.

- 64바이트 IPL ROM과 512개 가우스 표는 칩 데이터라 포함하지 않는다. 가우스 표는 로컬 파일을 `--gauss`로 넘긴다.
- `APU.boot()`의 `iplClocks` 기본값(621,677)은 카마이타치의 측정값이다. 석류의 맛 부팅 시간은 에뮬레이터 추적으로 다시 잰다.

## 석류의 맛 드라이버 (`tools/`)

- `rom.mjs`: 판본 확인, `$30:8010` 부팅 descriptor(`[source:u24][dest:u16]`, 기준 ROM은 `$30:8927` → ARAM `$0600`, 3,303 bytes) 읽기.
- `cpu-side.mjs`: 런타임 전송의 메인 CPU 쪽. `$30:8383`의 순서(`$83E8`: port 0 ← `$FF`, `$BBAA` 대기 → `$8673` 범위별 전송 → `$8652` 종료 토큰)를 그대로 따른다. 드라이버는 IPL ROM으로 돌아가지 않고 같은 규약의 자체 수신 루틴으로 받는다. 65c816 VM이 이 루틴을 직접 실행하게 되면 테스트용으로만 남는다.
- `play-request.mjs <rom> <manifest.json> <request> <초> [out.wav] [--gauss 파일]`: 드라이버를 부팅하고 요청 하나를 실제 APUIO 규약으로 전송한 뒤 ARAM을 대조하고 S-DSP 출력을 WAV로 쓴다. 요청별 전송 범위는 zakuro-sfc-kor `tools/build_audio_images.py`의 manifest를 쓴다.

### 확인 결과 (2026-11-25)

- 44개 요청 모두 전송 규약 통과, 전송 후 ARAM 범위 일치. 요청 29는 5초 무음, 37은 5초 안에 소리 없음(Codex 기록과 같음: 29는 의도된 무음, 37은 긴 도입부).
- CPU 쪽 시각은 아직 모형화하지 않았다. 다음 단계는 에뮬레이터의 APU 포트·DSP 쓰기·PCM 기록과 클록 단위로 대조하는 것이다.

## 테스트

`npm test` (직접 조립한 프로그램만 사용, 19개).
