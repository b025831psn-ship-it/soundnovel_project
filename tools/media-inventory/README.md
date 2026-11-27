# 범용 게임 미디어 조사 도구

로컬에 보관한 원본을 Git이나 서버에 업로드하지 않고 판본 식별용 JSON을 만드는
Python 표준 라이브러리 전용 도구다. SFC, Nintendo 64, GBA, PS1, PS2를 지원한다.

## 사용법

```sh
python3 inventory.py /path/to/game.sfc -o manifest.json
python3 inventory.py /path/to/game.cue -o manifest.json
python3 inventory.py /path/to/game.iso -o manifest.json
```

여러 입력도 한 번에 조사할 수 있다. 파일은 읽기 전용으로 열고 변경하지 않는다.

```sh
python3 inventory.py game1.gba game2.z64 game3.cue -o manifest.json
```

출력에는 절대경로를 넣지 않고 파일의 기본 이름, 크기, SHA-256과 판별된 헤더
정보만 기록한다. 외부 공유 시 파일명도 숨겨야 하면 `--redact-names`를 사용한다.

```sh
python3 inventory.py game.cue --redact-names -o shareable.json
```

## 조사 범위

- SFC: 512바이트 copier header 후보, LoROM/HiROM 헤더, 제목, mapper, ROM/RAM 크기,
  지역, 체크섬/보수 관계
- N64: z64/v64/n64 바이트 순서, 내부 이름, clock/entry/release, cartridge ID,
  국가 코드
- GBA: Nintendo 고정 바이트, 제목, game/maker code, unit/device/version,
  헤더 체크섬
- PS1/PS2: CUE의 FILE/TRACK/INDEX, 참조 파일 해시, ISO9660 PVD, volume ID,
  SYSTEM.CNF의 BOOT/BOOT2 대상, PS-X EXE 또는 ELF 헤더

형식을 확정할 근거가 부족하면 `unknown`으로 남긴다. 작품별 아카이브나 시나리오
형식은 이 도구에서 추측하지 않고 후속 분석기의 입력으로 넘긴다.

## 테스트

```sh
python3 -m unittest discover -s tests -v
```

테스트는 직접 생성한 합성 ROM/디스크만 사용한다.
