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
