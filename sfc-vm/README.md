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
node sfc-vm/tools/trace-apu.mjs original.sfc /path/to/sound/apu.js /tmp/vm-apu.tsv 5701 150000000 /path/to/spc-ipl.bin /path/to/joypad.tsv
node sfc-vm/tools/compare-apu-trace.mjs /path/to/apu-ports.tsv /tmp/vm-apu.tsv 25
node sfc-vm/tools/compare-apu-trace.mjs /path/to/apu-ports.tsv /tmp/vm-apu.tsv 5700 semantic
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
생성 trace는 커밋하지 않는다. 초기 469k 고정 offset은 새 SRAM을 `$00`으로 만든
탓에 reset의 1 KiB save-block clear loop 5회 중 4회를 건너뛴 것이 원인이었다.
SRAM erased value를 `$FF`로 바꾸고 `STA long,X`에 잘못 붙인 internal cycle을
제거했다. 쓰기 전부와 port별 값이 바뀐 read만 남기는 `semantic` 대조에서 boot
구간의 VM 30,021행은 모두 기준과 일치하고 최대 master delta는 1,430이다.

frame 48 분기는 PPU read가 아니라 두 CPU 모델 차이였다. 짧은 DMA마다
`DMACPUSync=18`과 channel setup 8 master를 반영하고, VBlank 중 `$4200` NMI-enable
rising edge를 opcode boundary에서 처리한다. 또한 8-bit `LSR A`가 숨은 B byte까지
shift해 scheduler mask `$0200`을 `$0001`로 바꾸던 오류를 수정했다. 이 변경으로
frame 48 sound-stream command와 이후 semantic port sequence가 다시 일치한다.

frame 5700 runner 자체는 끝까지 실행된다. 현재 semantic 대조는 VM의 56,600행
전부가 기준 prefix와 일치하지만, 기준 frame 454의 다음 `r port0=40`이 VM에는
없어 거기서 중단된다. 마지막 공통 의미 행은 기준 frame 271/VM frame 174이고,
누적 timing drift 때문에 max master delta는 41,028,468이다. 따라서 다음 작업은
frame 174 이후 CPU/PPU 진행 분기와 장기 master timing을 맞추는 것이다.

native `$4016/$4017/$4218..$421F` read trace를 선택 입력으로 주면 runner는
`$4218/$4219` JOY1 word를 같은 frame의 NMI에 latch한다. 실제 첫 nonzero input은
frame 453의 `$4218=80`이다. 이를 재생해도 위 56,600행/첫 불일치 결과는 변하지
않았다. delta의 첫 100k jump는 semantic row 35,306(기준 frame 64, VM frame 63),
결정적인 jump는 row 41,891의 기준 frame 94→209 wait이다. 이 wait는 첫 패드
입력보다 앞이므로 입력 문제가 아니라 frame/fade wait 모델 차이다.
