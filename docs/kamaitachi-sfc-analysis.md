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

## 관통 조건

- reference emulator와 JS VM의 instruction trace(PC/opcode/P/E/M/X/A/X/Y/S/D/DBR)
- PPU/CPU I/O write와 DMA/HDMA descriptor
- SPC700 IPL 업로드 포트 `$2140-$2143` 왕복
- controller strobe/auto-joypad 및 첫 입력 소비 지점
- 첫 선택지 표시 시 VRAM/CGRAM/OAM과 텍스트/선택지 데이터 포인터

위 이벤트를 같은 ROM 해시와 frame/cycle 기준으로 대조한다. 현재 환경에는
reference emulator가 설치되어 있지 않아 probe 실행기를 별도로 준비 중이다.
