# 『마녀들의 잠 부활제』 PS1

일본 일반판 `SLPS-01863` 조사와 웹 이식을 위한 공개 코드다. 게임 원본과 추출 대사는 포함하지 않는다.

- [대본 형식과 추출 검증](docs/script-format.md)
- `tools/extract_script.py`: `SLPS_018.63`의 리소스 색인과 압축 해제 루틴에 맞춘 대본 추출기

## 엔진 대조

Python 3과 PCSX-ReARMed libretro 코어로 두 트랙을 참조하는 원본 CUE를 부팅한다. 코어의 내장 HLE BIOS와 임시 시스템·저장 폴더를 사용한다. 창을 열지 않으며 매 프레임의 화면과 오디오 SHA-256, 마지막 프레임의 메인 RAM SHA-256을 새 JSONL 파일에 기록한다. 프레임 번호는 1부터 시작하고 입력은 지정한 한 프레임 동안 누른다.

```sh
python -B tools/boot_oracle.py /path/to/core /path/to/disc.cue /private/idle.jsonl --frames 6000
python -B tools/boot_oracle.py /path/to/core /path/to/disc.cue /private/input.jsonl --frames 15000 --press 9000:start --checkpoint 7313
python -B tools/compare_checkpoints.py qa/checkpoints.json /private/run-a.jsonl /private/run-b.jsonl
```

SLPS-01863 Track 1과 Windows x64 코어(SHA-256 `7f39419a7d085ffaf3f89f74b5e5084929687ab8b0895a4b41a31702af1fc8cd`)에서 무입력 6,000프레임 두 번의 기록이 일치했다. 영상 파일 36개의 SHA-1도 디스크 추출 manifest와 일치했다.

`src/scenario-vm.mjs`의 PC는 압축을 푼 시나리오 시작 기준 바이트 오프셋이다. 00~14의 21개 명령을 해석한다. 점프·분기·플래그는 VM 상태에 반영하고, 본문·그림·영상·전환·진동·사운드·엔딩 명령은 표시 또는 장치 처리를 요청하는 이벤트를 반환한다. VM의 반환 시점과 실제 장치 처리 완료 시점은 별도로 검증한다.

시나리오 전수 검사는 9개 리소스의 모든 레코드를 각각 진입점으로 삼아 명령과 분기 대상을 훑는다. 원본 KF1 글꼴 범위, EXE의 STR 이름표, SCRP.D의 그림·음악·효과음 색인을 함께 대조한다. 보고서에는 대사나 원본 바이트를 쓰지 않고 주소·라벨·자산 이름과 건수만 쓴다.

```sh
python -B tools/audit_scenarios.py --exe /path/to/SLPS_018.63 --scrp /path/to/SCRP.D --output /private/audit.json
```

Node.js와 Python용 Unicorn 2.1.4가 있는 환경에서 아래 명령으로 JS를 원본 MIPS 디스패처와 대조한다. 합성 피연산자를 넣고 두 실행의 PC, 플래그, 난수 상태와 선택지 대상 목록을 비교한다.

```sh
python -B tools/compare_scenario.py /path/to/SLPS_018.63
python -B tools/compare_handlers.py /path/to/SLPS_018.63
```

## 브라우저 프레임 검증

아래 예시는 포트 폴더에서 실행한다. Python용 Playwright와 설치된 Chromium 계열 브라우저를 사용한다. `boot_oracle.py`는 새 파일에만 기록하므로 `$trace`에는 저장소 밖의 새 경로를 지정한다. 6,000번째 프레임부터 13,500번째 프레임까지 60프레임마다 Start를 한 번 누르고, 각각 20프레임 뒤에 ○를 누른다.

```powershell
$buttons = foreach ($n in 100..225) {
    '--press'
    '{0}:start' -f ($n * 60)
    '--press'
    '{0}:circle' -f ($n * 60 + 20)
}
python -B tools/boot_oracle.py $core $cue $trace --frames 15000 @buttons
python -B tools/compare_background.py $files $trace 7313=TITLE.P 9448=ATOGAKI.P 12987=TEL.P 13026=BK.P 13349=OFFICE.P --text-window 9977,70,A10.BIN,1682,OFFICE.P --browser $browser
```

배경은 압축된 그림에서 직접 팔레트와 픽셀을 해독한다. 본문 검사는 지정한 시나리오 오프셋에서 VM을 한 번 실행하고 원본 KF1 글꼴·글꼴 색인·웹 텍스트 렌더러로 매 VSync의 화면을 만든다. 캔버스에서 다시 읽은 320×240 픽셀을 RGB565로 변환해 원본 기록과 비교한다. 이 명령으로 정지 화면 5개와 본문이 두 번째 줄로 넘어가는 연속 70프레임(9,977~10,046)을 검증했다. 이는 장면 위치를 지정한 검증이며, 타이틀부터 동일한 입력으로 장면에 도달하는 전체 플레이와 오디오 동기는 이후 검증 범위다.

`qa/walkthroughs.json`은 공략 두 곳과 원본 분기 감사를 대조한 0-base 선택 입력 및 완결·번외·후기·예고편·숨김 시나리오 해금 조건이다. 특히 숨김 대기 조건은 60 Hz 기준 18,000프레임이며, 자동 진행 입력을 넣어서는 안 된다. `qa/checkpoints.json`은 원본에서 확인한 대표 화면과 연속 본문 구간을 고정한다. 같은 코어·디스크·입력으로 두 번 기록해 화면·오디오·직렬화 상태 해시를 비교한다.

## 게임 화면과 저장

`GameSession`은 타이틀의 새로 시작/이어하기, 원본 순서의 네 이름 항목, 독서 중 메뉴, 저장과 불러오기를 한 상태로 유지한다. 빈 128 KiB 가상 메모리 카드로 시작하며 원본 제품 코드 `BISLPS-01863`의 한 블록에 이어하기 상태를 둔다. 일본어 기본값은 `津田 俊夫`·`中込 依子`, 한글 기본값은 `츠다 토시오`·`나카고메 요리코`다. 성과 이름은 각각 최대 네 글자이며 가나·한자·영숫자·기호, 웹 한글판에서는 한글도 입력할 수 있다.

`AudioDirector`는 비공개 포트 데이터 manifest의 정확한 loopStart/loopEnd로 음악을 반복하고 같은 곡 재요청, 정지, 효과음 뱅크 초기화를 처리한다. `TransitionPlayer`는 VM의 전환 action을 VSync 단위의 그림·본문 명암으로 변환한다. 공개 저장소에는 음원이나 그림, 저장 데이터가 들어 있지 않다.
