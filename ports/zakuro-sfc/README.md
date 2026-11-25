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

`spc700.js`, `sdsp.js`, `apu.js`, `ipl.js`, `master-link.js`, `output.js`, `resampler.js`, `sfc-worklet.js`는 카마이타치 SFC 포트의 5c7f3ab에서 가져왔다. `spc700.js`(타이머 읽기 시점), `sdsp.js`(rate 0), `apu.js`(타이머 분주 위치 인수)를 고쳤다(아래). 카마이타치에서 리셋부터 첫 선택지까지 SPC 포트·DSP 쓰기와 PCM 512,331 샘플이 에뮬레이터와 완전히 일치했다(PR #24). 하드웨어 모듈이라 작품에 따라 바뀌지 않는다. 두 포트가 병합되면 공통 경로로 합친다.

- 64바이트 IPL ROM과 512개 가우스 표는 칩 데이터라 포함하지 않는다. 가우스 표는 로컬 파일을 `--gauss`로 넘긴다.
- `APU.boot()`의 `iplClocks` 기본값(621,677)은 카마이타치의 측정값이다. 석류의 맛 부팅 시간은 에뮬레이터 추적으로 다시 잰다.

## 석류의 맛 드라이버 (`tools/`)

- `rom.mjs`: 판본 확인, `$30:8010` 부팅 descriptor(`[source:u24][dest:u16]`, 기준 ROM은 `$30:8927` → ARAM `$0600`, 3,303 bytes) 읽기.
- `cpu-side.mjs`: 런타임 전송의 메인 CPU 쪽. `$30:8383`의 순서(`$83E8`: port 0 ← `$FF`, `$BBAA` 대기 → `$8673` 범위별 전송 → `$8652` 종료 토큰)를 그대로 따른다. 드라이버는 IPL ROM으로 돌아가지 않고 같은 규약의 자체 수신 루틴으로 받는다. 65c816 VM이 이 루틴을 직접 실행하게 되면 테스트용으로만 남는다.
- `play-request.mjs <rom> <manifest.json> <request> <초> [out.wav] [--gauss 파일]`: 드라이버를 부팅하고 요청 하나를 실제 APUIO 규약으로 전송한 뒤 ARAM을 대조하고 S-DSP 출력을 WAV로 쓴다. 요청별 전송 범위는 zakuro-sfc-kor `tools/build_audio_images.py`의 manifest를 쓴다.

- `replay-spc.mjs <rom> <zakuro-sfc-kor/port-data> [--gauss 파일]`: 에뮬레이터 기록(Codex 599e867, f1dfd5f)의 SPC 쪽 포트 입력을 원본 SPC 클록에 넣고 부팅 ARAM, SPC 포트 쓰기, DSP 쓰기, PCM을 대조한다.

### 원본 대조 (2026-11-25, zakuro-sfc-kor 599e867/f1dfd5f, reset~첫 선택지)

- 드라이버 첫 명령 시점(SPC cycle 1,223,778)의 ARAM 64 KiB가 같다. IPL이 남기는 `$00-$01`(마지막 목적지 `$0600`)도 맞춘다. DSP 레지스터는 전원 투입 때 정해지지 않으므로 기준 실행의 값(`boot-dsp.bin`)을 IPL 단계 전부터 넣는다.
- SPC 포트 쓰기 120,284건과 DSP 쓰기 264,389건이 순서와 값 모두 같다. 기록 시각은 버스 접근 시각이고 read 행에는 쓰기 명령의 dummy read가 들어 있다. 제 쪽 시각(명령 시작)과의 차이는 모든 행에서 일정하다.
- **PCM: frame 40~1000의 512,331 스테레오 샘플(1,024,662값)이 전부 같다.** 첫 sample 시각은 679,996(f1dfd5f 정정값)이다.
- 맞추는 데 필요했던 것(`tools/rom.mjs`의 `APU_TIMING`):
  - 타이머 `$FD-$FF`는 읽기 클록 2클록 전까지의 tick을 본다(`spc700.js`). 이 드라이버는 `MOV Y,!$00FD`(4클록)로 기다린다. 명령 시작 기준이면 24.6초 지점 음 높이 미끄럼 한 단계가 빠진다.
  - 타이머 분주기 위치 `timerLead: 3`(드라이버 첫 명령 기준), 포트 입력은 기록된 읽기 시각 4클록 전에 둔다.
  - DSP 쓰기(`MOV !$00F3,A`, 5클록)는 명령 끝에서 반영된다(`dspAccessOffset: 5`).
  - S-DSP rate 0은 절대 발생하지 않는다(카운터 주기 30,721). 기존 표는 30,720이라 카운터가 한 바퀴 돌 때 rate 0 엔벨로프가 한 번 움직였다(`sdsp.js`).
- 카마이타치(d07f1ef)는 기본값(`timerLead -1`, `dspAccessOffset 0`) 그대로 이 수정본에서도 포트·DSP 쓰기와 PCM 512,331 샘플이 완전히 일치한다.

### VM 연결 (`sound/master-link.js`, `tools/replay-cpu.mjs`)

- `master-link.js`와 `spc700.js`의 `onPortRead`는 카마이타치 포트(5cf35c6)와 같다. `writeHold` 인수만 더했다(기본 3, 동작 같음).
- `replay-cpu.mjs <rom> <port-data> --link`: 기준 실행의 CPU `$2140-$2143` 접근 1,253,625건을 master clock 그대로 `MasterLink`에 넣는다. VM이 할 일과 같다. CPU 읽기 982,716건이 모두 같은 값을 받고, 그 결과 DSP 쓰기 264,389건도 모두 같다.
- 석류의 맛 드라이버용 시각 규칙은 `tools/rom.mjs`의 `LINK_TIMING`이다(측정값과 근거는 주석). 드라이버가 포트를 `!abs` 주소로만 접근해서 카마이타치(`dp` 주소)와 값이 다르다.

### 전송 확인 (2026-11-25)

- 44개 요청 모두 전송 규약 통과, 전송 후 ARAM 범위 일치. 요청 29는 5초 무음, 37은 5초 안에 소리 없음(Codex 기록과 같음: 29는 의도된 무음, 37은 긴 도입부).
- CPU 쪽 시각은 모형화하지 않았다. 65c816 VM이 붙으면 VM이 직접 전송한다.

## 테스트

`npm test` (직접 조립한 프로그램만 사용, 21개).
