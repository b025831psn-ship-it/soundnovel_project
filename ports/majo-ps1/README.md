# 『마녀들의 잠 부활제』 PS1

일본 일반판 `SLPS-01863` 조사와 웹 이식을 위한 공개 코드다. 게임 원본과 추출 대사는 포함하지 않는다.

- [대본 형식과 추출 검증](docs/script-format.md)
- `tools/extract_script.py`: `SLPS_018.63`의 리소스 색인과 압축 해제 루틴에 맞춘 대본 추출기

## 엔진 대조

Python 3과 PCSX-ReARMed libretro 코어로 두 트랙을 참조하는 원본 CUE를 부팅한다. 코어의 내장 HLE BIOS와 임시 시스템·저장 폴더를 사용한다. 창을 열지 않으며 매 프레임의 화면과 오디오 SHA-256, 마지막 프레임의 메인 RAM SHA-256을 새 JSONL 파일에 기록한다. 프레임 번호는 1부터 시작하고 입력은 지정한 한 프레임 동안 누른다.

```sh
python -B tools/boot_oracle.py /path/to/core /path/to/disc.cue /private/idle.jsonl --frames 6000
python -B tools/boot_oracle.py /path/to/core /path/to/disc.cue /private/input.jsonl --frames 15000 --press 9000:start
```

SLPS-01863 Track 1과 Windows x64 코어(SHA-256 `7f39419a7d085ffaf3f89f74b5e5084929687ab8b0895a4b41a31702af1fc8cd`)에서 무입력 6,000프레임 두 번의 기록이 일치했다. 영상 파일 36개의 SHA-1도 디스크 추출 manifest와 일치했다.

`src/scenario-vm.mjs`의 PC는 압축을 푼 시나리오 시작 기준 바이트 오프셋이다. 00~14의 21개 명령을 해석한다. 점프·분기·플래그는 VM 상태에 반영하고, 본문·그림·영상·전환·진동·사운드·엔딩 명령은 표시 또는 장치 처리를 요청하는 이벤트를 반환한다. VM의 반환 시점과 실제 장치 처리 완료 시점은 별도로 검증한다.

Node.js와 Python용 Unicorn 2.1.4가 있는 환경에서 아래 명령으로 JS를 원본 MIPS 디스패처와 대조한다. 합성 피연산자를 넣고 두 실행의 PC, 플래그, 난수 상태와 선택지 대상 목록을 비교한다.

```sh
python -B tools/compare_scenario.py /path/to/SLPS_018.63
python -B tools/compare_handlers.py /path/to/SLPS_018.63
```
