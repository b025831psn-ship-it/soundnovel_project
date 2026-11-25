# SFC VM

카마이타치의 밤 SFC 원본을 브라우저에서 실행하기 위한 trace-first 런타임입니다.
화면을 추정해 다시 그리는 플레이어가 아니라 ROM의 65c816 명령과 SNES I/O를
실행하는 방향으로 확장합니다.

현재 첫 관통 기준은 reset vector부터 첫 입력/선택지까지입니다. ROM과 실제
게임 데이터는 커밋하지 않으며, 판본별 비공개 추출물은 `kamaitachi-sfc-kor`에
둡니다.

```sh
node --test sfc-vm/tests
node sfc-vm/tools/trace-boot.mjs path/to/original.sfc 2000000
node sfc-vm/tools/trace-boot.mjs path/to/original.sfc 2000000 1,60,120 /tmp/kamai/frame
node sfc-vm/tools/render-snapshot.mjs /tmp/kamai/frame.60 /tmp/kamai/frame.60.ppm
node sfc-vm/tools/trace-apu.mjs original.sfc /path/to/sound/apu.js /tmp/vm-apu.tsv 25 2000000 /path/to/spc-ipl.bin
node sfc-vm/tools/compare-apu-trace.mjs /path/to/apu-ports.tsv /tmp/vm-apu.tsv 25
```

초기 구현은 reset 직후의 CPU 모드 전환, WRAM 상태 비교, PPU/DMA 레지스터 설정과
LoROM SRAM checksum 진입까지 실제 opcode로 실행합니다. 미구현 opcode는 즉시
예외를 내므로, reference trace와 대조하면서 한 명령씩 범위를 넓힐 수 있습니다.
장시간 runner는 trace 객체를 전부 보관하지 않고 마지막 상태만 유지하며,
main-thread 주소 휴리스틱 대신 명령 시간축으로 VBlank를 공급합니다.
DMA mode 0–7의 B-bus 패턴과 VRAM/CGRAM/OAM/WRAM data port를 모델링해 원본이
생성한 PPU 메모리와 전송 통계를 보존합니다. auto-joypad 결과는 controller 1의
하드웨어 JOY1 비트 순서(`B/Y/Select/Start/Up/Down/Left/Right/A/X/L/R`)로 공급합니다.
trace runner의 네 번째 인수는 쉼표로 구분한 snapshot frame, 다섯 번째 인수는
출력 prefix이며, 여섯 번째 인수에는 `frame:mask` 입력 일정을 쉼표로 지정할 수
있습니다. 일곱 번째 인수는 frame당 명령 수(기본 20,000), 여덟 번째 인수는
300-instruction trace를 시작할 frame입니다. snapshot은 ROM 데이터가 포함될 수
있으므로 로컬 분석물로만 둡니다.

## Master-clock/APU 연결

`Cpu65816.masterCycle`은 Snes9x와 같은 master-clock 단위로 opcode fetch,
operand/stack access, internal cycle, WRAM refresh stall과 DMA byte 시간을 누적한다.
각 bus transaction은 현재 시각을 `SfcBus.read8/write8`에 넘긴다. APUIO branch는
`ports/kamaitachi-sfc/sound/master-link.js`의 `MasterLink`를 호출해 APU를 먼저
동기화한 뒤 latch를 접근한다. APU가 없는 단독 CPU 테스트에서는 기존 IPL
shim을 fallback으로 유지한다.

`trace-apu.mjs`의 APU module과 64-byte SPC IPL은 로컬 소유 입력이다. ROM, IPL,
생성 trace는 커밋하지 않는다. 현재 native boot 대조에서는 첫 17개 APUIO 행의
방향·port·값이 일치한다. 첫 불일치는 IPL이 `$CC`를 내보내는 polling 횟수이며,
첫 행의 VM master clock은 기준보다 469,274 이르다. 업로드 뒤 `CHUN` 4-port
write는 기준 frame 37/master 13,024,472, VM frame 36/master 12,555,036에서
동일한 `43 68 75 6E` 순서로 성립했다(469,436 master-clock 조기). 따라서 frame
5700 행 단위 완전 일치는 아직 주장하지 않으며, 남은 작업은 HDMA/NMI event
timing 및 미구현 65c816 dummy/page-cross cycle을 기준 trace에 맞추는 것이다.
