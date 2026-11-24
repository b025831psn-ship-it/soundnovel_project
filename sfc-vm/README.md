# SFC VM

카마이타치의 밤 SFC 원본을 브라우저에서 실행하기 위한 trace-first 런타임입니다.
화면을 추정해 다시 그리는 플레이어가 아니라 ROM의 65c816 명령과 SNES I/O를
실행하는 방향으로 확장합니다.

현재 첫 관통 기준은 reset vector부터 첫 입력/선택지까지입니다. ROM과 실제
게임 데이터는 커밋하지 않으며, 판본별 비공개 추출물은 `kamaitachi-sfc-kor`에
둡니다.

```sh
node --test sfc-vm/tests
```

초기 구현은 reset 직후의 CPU 모드 전환, WRAM 상태 비교, PPU/DMA 레지스터 설정과
LoROM SRAM checksum 진입까지 실제 opcode로 실행합니다. 미구현 opcode는 즉시
예외를 내므로, reference trace와 대조하면서 한 명령씩 범위를 넓힐 수 있습니다.
