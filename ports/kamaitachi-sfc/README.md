# 카마이타치의 밤 SFC 원작 이식

이슈 #20의 작업 경로다. GBA 포트(`ports/kamaitachi-gba/`, PR #16)와 같은 방식으로 SFC판을 웹에서 원작 그대로 재현한다.

## 원칙

- 원작 루틴을 부분별로 JS로 옮긴다. 녹화한 값을 재생하거나 비슷한 모양의 새 플레이어를 만들지 않는다.
- 실행에 ROM이 필요 없다. 원형 자산은 소유 ROM에서 추출해 비공개 `kamaitachi-sfc-kor`의 `port-data/`에 둔다. 이 공개 경로에는 엔진·UI·도구·직접 만든 fixture만 둔다.
- 화면은 SFC 원해상도(256×224, 비월 모드 기준)를 정수 배율로 표시한다. 플레이어 UI는 원작 화면 바깥에만 둔다.
- 동일성은 에뮬레이터 추적 로그와의 자동 대조로 증명한다.

## 역할

| 담당 | 범위 |
|---|---|
| Codex (`web_player_kamai_sfc`) | ROM 판본·해시, 65c816 시나리오 VM, PPU(BG·OBJ·팔레트·글꼴·창) 뼈대, 자산 추출기, 에뮬레이터 추적 |
| Claude (`Claude-SFC`) | 사운드 엔진(SPC700 드라이버 이식 또는 S-DSP 재현), 추적 대조 검증, 허브 연결, 병합 |

세션 사이의 요청과 결과는 이 경로를 만든 Claude 연락 PR의 댓글로 `[세션이름] → 받는 세션` 형식으로 주고받는다.

## 첫 단계

1. Codex: 판본 표(파일명, 크기, SHA-256, 헤더 제목·지역·버전, LoROM/HiROM), 리셋부터 새 게임 진입까지의 주요 루틴 주소, 시나리오 바이트코드 위치와 명령 폭 표를 비공개 저장소에 올리고 경로와 커밋 SHA를 PR 댓글로 알린다.
2. Codex: 사운드 드라이버 업로드 루틴(APU 포트 $2140–$2143 전송), SPC 프로그램·샘플(BRR)·시퀀스 데이터의 ROM 위치를 알려 준다.
3. Claude: 2의 위치로 SPC 데이터를 `port-data/sound/`에 추출하고, SPC700+S-DSP 실행 모듈을 만들어 에뮬레이터의 APU 포트 쓰기 기록·DSP 레지스터 기록과 대조한다.
4. 공통: 부팅 또는 새 게임 진입부터 첫 선택지까지 명령 순서·화면·오디오 호출을 추적 로그로 대조한다.

## 사운드 모듈 (`sound/`)

- `spc700.js`: SPC700 CPU 전체 명령(256개)과 기본 클록, SMP I/O(`$F0–$FF`: CONTROL, DSP 주소·데이터, 포트 4개, 타이머 3개). 클록 단위는 SPC700 1.024 MHz이고, 분기 성립 시 2클록을 더한다.
- 64바이트 IPL 부트 ROM은 하드웨어 펌웨어라 포함하지 않는다. 로컬 이미지가 있으면 `loadIplImage()`로 실제 IPL 전송을 돌리고, 없으면 `uploadRecords()`가 `[길이, 목적지, 내용]` 레코드를 ARAM에 놓고 종료 레코드의 목적지로 점프한다. 점프 시점의 레지스터 상태는 IPL 직후 ARAM·레지스터 스냅샷과 대조해 확정한다.
- `onDspWrite(clock, reg, value)`와 `onPortWrite(clock, port, value)`로 에뮬레이터 로그와 같은 형식의 기록을 남긴다. clock은 해당 명령 시작 시점이다.
- 테스트: `npm test` (직접 조립한 프로그램만 사용).
- `sdsp.js`: S-DSP 8음. BRR 복호(shift·필터 4종), ADSR/GAIN 엔벨로프와 전역 rate 카운터, 가우스 보간, 노이즈, 피치 변조, 에코(8탭 FIR·피드백), KON/KOFF 2샘플 주기 처리. 32클록마다 스테레오 1샘플을 낸다. 샘플 단위로 처리하므로 한 샘플 안의 음성별 클록 위상은 아직 재현하지 않는다.
- 512개 가우스 보간 표는 칩 데이터라 포함하지 않고 생성자 인수로 받는다. 표가 없으면 테스트용 선형 보간으로 대신한다.
- `apu.js`: SPC700과 S-DSP가 64 KiB ARAM을 공유하는 오디오 장치. 메인 CPU 쪽은 `cpuWrite/cpuRead`로 `$2140–$2143`을 다룬다.
- `tools/boot-driver.mjs <rom>`: 소유 ROM(SHA-256 `3228a3b3…`)에서 IPL 레코드 4개를 읽어 드라이버를 부팅하고, CPU `$00:B7BE`의 부팅 handshake(`"Chun"` 쓰기 → `"SOFT"` 응답 → port 0에 0)를 재생한다. DSP 쓰기를 `clock reg value` TSV로 출력한다. 2026-11-25 확인: SOFT 응답 54,500클록, 드라이버 main loop(`$11C6` receiver) 진입, 첫 1초 DSP 쓰기 237건(대부분 KOFF).
- `tools/replay-trace.mjs <rom> <apu-ports.tsv> <dsp-writes.tsv>`: 에뮬레이터의 APU 포트 로그를 시간에 맞춰 재생하고, CPU가 읽은 포트 값과 DSP 쓰기 순서(reg, value)를 자동 대조한다. 첫 불일치 위치와 클록 오차 최대값을 출력한다. 로그 형식은 PR #24 댓글 7149110384.

### 대조 결과 (2026-11-25, kamaitachi-sfc-kor 76b42db 로그 기준)

- 부팅 handshake 직후 ARAM 64 KiB가 `boot-aram.bin`과 완전히 같다. DSP는 드라이버가 쓴 레지스터가 모두 같고, 나머지 81개는 드라이버가 쓰지 않은 전원 투입 값이다.
- `tools/replay-spc.mjs`: reset부터 첫 선택지(frame 5700)까지 SPC 포트 쓰기 37,772건과 DSP 쓰기 53,944건이 순서·값이 모두 같고, 시각 차이는 최대 1 SPC 클록이다.
- `tools/compare-pcm.mjs`: frame 40~1000의 S-DSP 출력 512,331 스테레오 샘플(1,024,662값)이 원본 PCM과 전부 같다.
- 일치에 필요했던 것: S-DSP를 32단계 클록 처리로 바꾼 것, DSP 접근을 명령 시작 시점에 반영한 것, 전원 투입 뒤 IPL 동안(621,677클록) DSP와 타이머 분주기가 계속 돌았다는 점을 `APU.boot()`에 넣은 것, BRA 클록 중복 가산 수정.
- `tools/replay-trace.mjs`는 CPU 쪽 로그(`apu-ports.tsv`) 기준 대조다. CPU가 읽은 APU 응답 4,209,120건이 모두 맞는다.
- `sound/master-link.js`: 65c816 VM 연결. VM의 master clock을 `15664/328125`(나머지 누적)로 SPC 클록에 옮기고, `$2140–$2143` 접근 전에 APU를 그 시각까지 진행한다. 포트 값이 보이는 시점은 기준 trace에서 잰 값을 쓴다. CPU 읽기(정확한 SPC 시각 T)는 시작 시각 s가 `s + 1 < T`인 SPC 쓰기만 본다(값 변화 34,886건에서 예외 없음). CPU 쓰기는 SPC 포트 읽기 명령의 opcode별 읽기 시점에서 보인다. `MOV A,!$F4`(E5)는 `s >= T`, `CMP A,!$F4`(65)는 `s >= T + 3`부터다(Snes9x `apu-ports-pc.tsv`, CPU 쓰기는 모두 `STA abs` bus access 시작 시각).
- `tools/replay-link.mjs <rom> <apu-ports.tsv> <dsp-writes.tsv>`: CPU 쪽 로그를 보정 없이 `master-link.js`로만 재생해 CPU 읽기 4,209,120건을 대조한다. VM 연결 규칙 자체를 검증하는 도구다. 2026-11-25: reset부터 frame 5700까지 CPU 읽기 4,209,120건이 모두 같고, 같은 실행의 SPC 포트 쓰기 37,772건도 순서·값이 같으며 시각 차이는 1클록 이내다.
- 실제 IPL 경로: 로컬 64바이트 IPL 이미지가 있으면 `APU.powerOn(ipl)` 뒤 VM이 게임의 업로드 루틴을 그대로 실행한다. 기준 trace에 맞춘 power-on 위상은 S-DSP 0, 타이머 분주기 1, SPC700 코어 3(master 0 = SPC 시각 0)이다. IPL의 마지막 `JMP [!abs+X]`는 1클록 더 걸리고, `$CC` 대기의 `CMP dp,#imm` read point는 −9다. `IPL=<image> node tools/replay-link.mjs …`로 reset부터 frame 5700까지 CPU 읽기 4,263,523건이 모두 같고 driver 첫 DSP 쓰기가 621,717에 온다. 같은 경로의 PCM 512,331 샘플도 완전 일치한다.
- `sound/ipl-hle.js`: 펌웨어 없는 IPL 대역. 웹 빌드는 IPL 이미지 없이 `APU.powerOn()`만 호출하고, VM이 게임의 업로드 루틴을 실행하면 이 모듈이 공개된 IPL 전송 규약을 단계별로 따라 응답한다. 각 단계는 해당 명령의 클록과 포트 읽기 opcode를 쓴다. 실제 IPL 경로와 비교한 결과 reset부터 frame 1000까지 SPC 포트 쓰기 29,742건, DSP 쓰기 5,672건이 시각까지 같고, driver 진입 레지스터·ARAM과 PCM도 같다. `IPL=hle node tools/replay-link.mjs …`로 reset부터 frame 5700까지 CPU 읽기 4,263,523건이 모두 일치한다.
- 타이머 `$FD–$FF` 읽기는 명령 시작이 아니라 `max(0, 명령 클록 − 3)` 시점 값이다(석류의 맛 포트 20471cf에서 옮김). 이 규칙에서도 replay-spc와 PCM 대조는 그대로 완전 일치한다.
- `sound/output.js`·`sound/sfc-worklet.js`·`sound/resampler.js`: 브라우저 출력. APU는 VM과 같은 스레드에서 돌고, S-DSP 샘플을 블록으로 AudioWorklet에 보낸다. 워크릿은 32,040 Hz를 기기 출력률로 선형 보간하고, 버퍼 채움 정도로 비율을 ±0.5% 안에서 보정한다. 음소거·일시정지 지원.
- `sound/demo.html`: 비공개 `port-data/sound/ipl-records.bin`·`dsp-gauss.bin`과 `trace/spc-ports.tsv`로 reset부터 첫 선택지까지의 사운드를 실시간 재생하는 확인 페이지. 저장소 상위 폴더를 정적 서버로 열고 `ports/kamaitachi-sfc/sound/demo.html`에 접속한다(`?data=`로 자료 경로 변경).
- `sound/realtime.js`: 에뮬레이션을 벽시계에 맞춰 진행하고 출력 버퍼를 채우는 공통 루프. 기계는 `time`(초), `runTo(sec)`, 선택적 `end`만 제공하면 된다. 지금은 `sound/replay-machine.js`(기록된 입력 재생)가 쓰고, 브라우저 VM도 같은 계약으로 붙인다. 긴 정지 뒤에는 한 프레임에 최대 0.1초만 따라잡고 기준 시각을 다시 잡는다.
- `sound/vm-demo.html` + `sound/vm-worker.js` + `sound/vm-sound.js`: VM과 APU는 Worker에서 돌고, 샘플은 `out.connectPort()`/`sound/pcm-sink.js`로 worklet에 직접 간다. 원작 65c816 코드를 `sfc-vm/machine.js`(Codex `SfcMachine`)로 실행하고 APU를 `MasterLink`로 구동하는 페이지. 기록된 입력이 아니라 VM이 직접 소리를 내고, `SfcMachine.onFrame` framebuffer를 Worker에서 받아 256×224 캔버스에 정수배로 그린다. 입력은 GBA판과 같은 터치 방식이다(`sound/touch.js`): 화면 탭은 A, 선택지·栞 선반·이름 확인에서는 항목을 탭하면 커서가 가고 선택된 항목을 다시 탭하면 결정한다. 화면 오른쪽 아래 메뉴 아이콘에 X(앞 문장)·SELECT(글자 숨기기)·START·B·Y가 있다. 판별에 쓰는 WRAM: 선택지 행 위치 표 `$0426`(16비트, 13+23k 오름차순)과 현재 행 `$15E7`, 栞 카드 `$00D0`(+ `$2101`=02), 이름 확인 `$03C3`=3과 커서 `$2482`. 누름은 `PressQueue`가 3프레임 누름·3프레임 뗌으로 넣는다. `?data=`(사운드 자료), `?game=`(게임 이미지 URL, 기본 `data/game/kamaitachi.sfc`). 키: 방향키, X=A, Z=B, A=Y, S=X, Q/W=L/R, Enter=START, Shift=SELECT. `sfc-vm/`이 같은 상위 폴더에 있어야 한다(Codex 브랜치 병합 후).
- 출력 버퍼(`sound/resampler.js`)는 목표량(기본 80 ms)이 찰 때까지, 그리고 버퍼가 비었다가 다시 찰 때까지 재생을 미룬다. 재생 시작 때 짧은 끊김이 반복되던 문제를 없앴다(헤드리스 Chromium 12초 재생에서 부족 0).
- `tools/extract-sound.mjs <rom> <kamaitachi-sfc-kor/port-data/sound>`: 드라이버 부팅 레코드(file `$003A3F`, 10,011 bytes)를 `ipl-records.bin`으로 추출한다.
- `sound/state.js`: 상태 저장/복원. `APU.saveState()/loadState()`, `MasterLink.saveState()/loadState()`(대기 중인 포트 쓰기와 APU 포함). 콜백은 저장하지 않고 살아 있는 것을 유지하며, 타입 배열은 `.set`으로 되돌려 S-DSP와 SPC700이 ARAM을 계속 공유한다. VM 쪽 `SfcMachine.saveState`와 합쳐 웹 중단 저장과 분기 탐색에 쓴다.

## 플레이어 (`index.html`, `player.js`, `shell.css`)

- 허브에서 여는 실제 플레이어다. ROM을 요구하지 않는다. 비공개 `kamaitachi-sfc-kor/port-data/program/`(`tools/extract-program.mjs`로 소유 ROM에서 만든 64 KiB 범위 48개와 `manifest.json`)을 받아 범위별·전체 SHA-256을 확인하고, `sound/vm-worker.js`에서 `sfc-vm/machine.js`와 APU를 실행한다. 기본 자료 경로는 저장소 루트의 `kamaitachi-sfc-kor/port-data/`이고 `?data=URL`로 바꿀 수 있다. `sfc-vm/`은 저장소 루트에 있어야 한다.
- 조작은 모든 포트 공통 기준(이슈 #41)을 따른다(`sound/touch.js`). 본문은 아무 곳이나 탭하면 다음, 선택지·책갈피·이름 확인은 누른 항목이 바로 선택되고(커서를 옮긴 뒤 A), 목록에서 항목과 먼 곳을 누르면 아무것도 결정하지 않는다. 본문에서 아래로 끌면 앞 문장(X), 글자판에서 위아래로 끌거나 휠을 돌리면 한자 목록이 넘어간다. 키: Z·Enter=결정(A), X=취소(B), C=앞 문장, Space=START, Shift=SELECT, S=메뉴. 범인 이름 글자판과 새 게임의 이름 바꾸기 글자판(주인공·여자친구, `$03C3` = 5·7)에서는 글자, 왼쪽 문자 종류(漢字·ひらがな·カタカナ), 오른쪽 명령(スペース·なおす·全消·終り), 한자 목록 위아래 화살표를 탭하면 게임 커서(`$1020`)를 한 칸씩 옮겨 바로 입력한다. 글자판이 떠 있는 동안 메뉴 버튼은 終り를 가리지 않게 숨는다. 게임은 글자가 다 나오기 전의 입력을 버리므로, 선택지·책갈피·이름 확인 탭은 게임 커서를 다시 읽으며 이동을 반복하고 A도 목록이 사라질 때까지 0.5초 간격으로 최대 6번 누른다. 화면 오른쪽 아래 메뉴 아이콘(GBA·PS1과 같은 모양)에 앞 문장·글자 숨기기·START·취소가 있다.
- 세이브는 공용 저장소(`shared/save/`, 설계 `docs/save/README.md`)에 들어가고 `/sync` 서버(PC 프록시, Cloudflare D1 같은 API)와 동기화된다(`save/sfc-save.js`). 배터리 SRAM 8 KiB는 체크섬을 따로 가진 2 KiB 블록 4개(ROM 표 `$01:846D`)이고 블록마다 슬롯 하나로 바이트 그대로 저장한다: `system`=0x0000(읽고 있는 책갈피의 작업용 사본), `manual-0..2`=0x0800·0x1000·0x1800(책갈피 1–3). 게임이 쓴 블록만(쓴 뒤 0.5초 바뀌지 않으면) 저장하고, 빈 블록(게임이 새 SRAM에 쓰는 06CD 체크섬만 있는 상태)은 새 기기가 서버의 책갈피와 부딪히지 않도록 올리지 않는다. 다른 기기의 책갈피는 시작할 때(첫 동기화 뒤) 또는 리셋 때 게임에 들어간다. 게임이 다른 기기에서 바뀐 블록 위에 쓰면 리비전 0으로 올려 서버가 409로 돌려주고, 대화상자에서 "이 기기 것 / 다른 기기 것"을 고른다. 빈 블록과 부딪힌 경우는 묻지 않고 다른 기기 것을 쓴다. 예전 `localStorage`의 `kamaitachi-sfc.sram`은 처음 한 번 옮기고 지우지 않는다.
- 웹 전용 중단 저장(`suspend`)은 SRAM을 뺀 VM 상태 전체(`save/state-pack.js`: 타입 배열을 바이트로 모은 뒤 gzip, 약 125 KB)다. 탭을 숨길 때와 플레이 중 90초마다 쓰고, 화면 아래 구름 버튼의 대화상자에서 "중단한 곳에서 이어하기"로 불러온다. 다른 기기의 중단 저장이 들어오면 대화상자가 저절로 열린다. 서버 한도(암호화 뒤 256 KB) 때문에 base64 190,000자를 넘는 상태는 쓰지 않는다.
- 시험: `node --test tests/save.test.mjs`, 실제 브라우저 PC↔폰 시험 `[SAVE_SERVER=d1] KAMAITACHI_SFC_KOR=<경로> NODE_PATH=$(npm root -g) node tests/save-sync-browser.mjs [seed.srm]`.
