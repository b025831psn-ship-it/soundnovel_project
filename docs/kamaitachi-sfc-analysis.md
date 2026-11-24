# 카마이타치의 밤 SFC 원본 분석

이 문서는 이슈 #20의 공개 가능한 분석 기록입니다. ROM, 추출 대사, 전체
trace는 비공개 `kamaitachi-sfc-kor` 저장소에서 관리합니다.

## 기준 판본

- 파일 크기: 3,145,728 bytes (copier header 없음)
- SHA-256: `3228a3b35f7d234a7bf91f8159ccc56518199222e84d258c14a153f54f9fcbc7`
- 내부 제목: `KAMAITACHI NO YORU`
- 매핑: LoROM (`$20`), 일본 (`$00`), internal version `0`
- checksum/complement: `$815C` / `$7EA3`
- reset vector: `$8000` (ROM offset `$000000`)

## reset 진입점

정적 디코딩과 VM 실행을 함께 확인한 reset preamble은 다음 순서다.

1. `CLC; XCE`로 emulation mode에서 native mode로 전환한다.
2. `LDA #$8F; STA $2100`으로 INIDISP를 forced blank 상태로 둔다.
3. `STZ $4200; STZ $420C`로 NMI/joypad 및 HDMA enable을 끈다.
4. `REP #$30`으로 16-bit A/X/Y를 선택하고 stack을 `$0CA8`, direct page를
   `$0000`으로 초기화한다.
5. `PEA #$0100; PLB; PLB`로 data bank를 `$01`로 만들고 `SEP #$10`으로 index만
   8-bit로 바꾼 뒤 X=`$06`, Y=`$00`에서 다음 초기화 루프에 진입한다.

이 단계는 추정 UI가 아니라 실제 opcode와 I/O write를 실행한 결과이며,
`sfc-vm/tests/reset.test.mjs`가 공개 가능한 짧은 reset byte fixture로 고정한다.

reset preamble 뒤에는 `$01:829E`의 4-word 표를 WRAM `$03E1`과 비교하고,
DMA channel 0을 `$01:829C`에서 PPU `$2180`으로 향하도록 설정한다. 이어
`$70:0800/$70:1000/$70:1800`의 LoROM SRAM 세 구간을 XOR해 초기화 상태를
판정한다. VM은 header의 SRAM size code `$03`에 맞춰 이 창을 8 KiB로
미러링한다. 현재 VM은 BRK/COP 시스템 호출과 native NMI frame을 실행하며,
SPC700 IPL 업로드와 `Chun` → `SOFT` 드라이버 identity handshake를 통과한다.
VBlank NMI를 공급한 실제 ROM 실행은 166 frame, 126만 명령 이상을 지나
타이틀 초기화용 데이터 처리 루틴까지 진행한다.

PPU 관통 단계에서는 `$420B` DMA의 mode별 B-bus 패턴을 실행해 `$2118/$2119`
VRAM, `$2122` CGRAM, `$2104` OAM, `$2180` WRAM port의 결과를 별도 메모리에
보존한다. 2백만 명령 기준 forced blank가 해제된 밝기 `$0F`와 CGRAM/OAM
변경을 확인했으며, 장시간 runner는 각 destination별 transfer/byte 수와 세 PPU
메모리 SHA-256을 출력한다.

frame snapshot 계측으로 logo 표시 중 mode 3, BG1 tilemap base `$0000`, BG1 8bpp
tile base `$2000`(VRAM byte address), main-screen BG1/OBJ enable을 확인했다. VM이
원본 DMA로 채운 VRAM/CGRAM만 mode-3 BG1 decoder에 넣어 CHUN SOFT logo를
복원했으며, 별도 이미지나 추정 UI는 사용하지 않았다. logo 구간의 VRAM은
5,308 nonzero bytes까지 증가한 뒤 다음 장면 초기화의 64 KiB VRAM clear DMA로
0이 된다. 따라서 관통 검증은 실행 종료 상태뿐 아니라 frame별 peak/snapshot도
함께 비교한다.

auto-joypad `$4218/$4219`는 하드웨어 순서인
`B/Y/Select/Start/Up/Down/Left/Right/A/X/L/R`로 기록한다. 예를 들어 Start는
`$1000`, A는 `$0080`이다. runner는 frame별 controller mask를 공급해 첫 입력
소비 위치를 찾을 수 있다.

## 어셈블리 분석 1차 기준점

첫 웹 포트 관통에 필요한 reset→파일 선택→새 게임→1장 bytecode와 이름 입력,
SPC 초기 적재 및 runtime streaming 루틴의 경계와 호출 관계를 확정했다. 비공개
저장소의 `data/assembly-map.json`은 CPU/file 주소, 역할, 호출 edge를 기계 판독
형식으로 보존하고 `tools/verify-assembly-map.mjs`가 대상 ROM의 SHA-256, 핵심
opcode prefix 10개, reset vector와 SPC descriptor chain을 검증한다.

주요 경계는 reset `$00:8000`, 시나리오 reader `$00:9C60/$00:9C99`, text/control
dispatch `$00:A0DD`, 이름 입력 `$04:8000/$04:893D`, SPC IPL uploader
`$00:B9C8`, runtime streamer `$00:E72F`다. script PC는 byte 주소가 아니라
`bank:address.bit`이고 새 게임 흐름은 `$05:FD01.5` → `$05:FE31.1` →
`$05:FE62.4` → `$05:FE6B.2`로 이어진다.

이것은 ROM 전체 분석 완료 선언이 아니다. 첫 관통 구현에 필요한 주소와 데이터
계약을 고정한 기준점이며, 이후 control handler 전수 명명, bank `$04` 이름 입력,
PPU DMA/decompressor, SPC700 driver CFG 순서로 분석을 계속한다. RGB565 캡처
순차 재생은 실제 VM 구현으로 간주하지 않는다.

## 동기종 분석 방법 공유

`zakuro-sfc-kor` PR #1에서 사용한 M/X-aware 65C816 disassembly, ROM jump-table
검증, lossless raw IR, DMA transaction grouping 방식을 참고했다. 게임별 주소와
opcode 의미는 공유하지 않고 방법만 적용한다. 카마이타치의 첫 적용에서는
`$01:A901` control metadata 99개를 `$00:958E` prepare table과 `$00:B496`
print table에 전수 결합했다. BRK/COP 뒤의 game-specific inline byte까지 반영한
handler 재분석과 `$00:E909` sound command table 결합으로 99개 모두 구조적
역할을 확인했다. 여기에는 실행 handler가 없는 placeholder와 아직 청각적 의미를
붙이지 않은 command `$03/$06` variant도 명시적으로 포함된다. control 실행은
read-ahead/prepare와 on-screen print의 두 단계이므로 포트에서도 두 phase를
분리해야 한다.

sound command의 다음 계층도 `$00:B51E..$00:B733` execution handler와
`$00:B950` 32-entry ring queue까지 분석했다. queue는 `$1E10/$1E30/$1E50/$1E70`
네 배열에 message와 인수를 보존하고 `$1EA6/$1EA8`을 write/read index로 쓴다.
command 18개와 queue helper 15개의 edge를 비공개 `data/sound-cfg.json`에서
원본 opcode signature로 검증한다.

consumer 계층은 `$00:E180` walker가 `$1EA8`부터 `$1EA6`까지 순회하고,
`$00:E1AF`에서 message 하위 6비트를 `$00:E8CF` word table로 dispatch한다.
table은 ring 크기와 다른 29-entry(`$00..$1C`)이며 19개 고유 handler로 모인다.
`$00:E8CA`는 consumer 본체가 아니라 BRK scheduler wrapper `$00:EAF9` 호출부다.
`$00:EAF4/$00:EAF9`의 inline word `$1000/$0001`은 native BRK handler
`$00:8185`와 service 0 `$00:81B4`가 해석한다. 웹 VM에서 이를 별개의 연속 BRK로
취급하면 queue 진행과 대기가 깨진다. 전수 표와 opcode 검증기는 비공개
`data/apu-consumer-map.json`, `tools/analyze-apu-consumer.mjs`에 있다.

runtime streamer의 실제 store opcode 위치도 다시 고정했다. `$00:E746`,
`$00:E755`, `$00:E764`가 APUIO1/2/3에 세 byte를 쓰고 `$00:E778`이 APUIO0에 commit/toggle을
쓴다.

SPC700 측은 IPL descriptor로 ARAM을 재구성해 `$0B97` main loop, `$0BA7`의
25-entry CPU-command table, `$0BD9` dispatcher를 원본 opcode로 검증했다.
`$11C6..$12D6` receiver는 APUIO mirror `$F4..$F7`과 handshake `$9B`를 사용하며,
transfer state `$97`에 따라 `$00/$01/$02/$03/$04/$80` 여섯 경로로 나뉜다.
destination `$8C/$8D`와 remaining length `$8E/$8F`를 갱신하는 경로 및 `$12EC`
acknowledge까지 비공개 `data/spc-driver-map.json`에 고정했다. CPU queue의 29개
message와 SPC command 25개는 서로 다른 dispatch 계층이다.

## 기준 코어 probe 대조

native Snes9x probe에서 CHUN SOFT logo, SFC title, 음향 설정, 기본 이름 확인
메뉴를 지나 주인공 이름 문자판에 진입하고, 주인공 기본 이름을 확정한 뒤
여자친구 이름 문자판으로 전환되는 것까지 확인했다.

기준 코어 WRAM과 VM snapshot을 비교하면 `$0408`의 SPC stream callback 설치는
양쪽 모두 같은 초기 frame에 관측된다. 최초 차이는 CPU→APU와 APU→CPU port
latch를 한 배열로 취급하던 모델과, IPL 동안 실제 frame/NMI가 흐르지 않던 runner
시간축이었다. 두 port 방향을 분리하고 runner를 instruction-time frame으로
변경했다. 다만 instruction 수는 실제 65c816 cycle과 같지 않으므로 `$02:DF63`
critical-section NMI의 정확한 phase는 계속 reference trace와 대조한다.

## 관통 조건

- reference emulator와 JS VM의 instruction trace(PC/opcode/P/E/M/X/A/X/Y/S/D/DBR)
- PPU/CPU I/O write와 DMA/HDMA descriptor
- SPC700 IPL 업로드 포트 `$2140-$2143` 왕복
- controller strobe/auto-joypad 및 첫 입력 소비 지점
- 첫 선택지 표시 시 VRAM/CGRAM/OAM과 텍스트/선택지 데이터 포인터

위 이벤트를 같은 ROM 해시와 frame/cycle 기준으로 대조한다. 현재 환경에는
reference emulator가 설치되어 있지 않아 probe 실행기를 별도로 준비 중이다.
