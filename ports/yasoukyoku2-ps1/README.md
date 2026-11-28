# 야상곡 2 PS1 원본 오라클

판본은 SLPS-03213이다. 비공개 추출 기준은 5c24bc372956c38afa0abfe6897894e3b921437f다.

PCSX-ReARMed Windows x64 코어 SHA-256은 7f39419a7d085ffaf3f89f74b5e5084929687ab8b0895a4b41a31702af1fc8cd다. PR #51의 boot_oracle.py를 커밋 056879050ab893cb84ee9e6c453af3b07bc63fe8에서 사용한다. 빈 임시 디렉터리에서 HLE BIOS로 실행한다.

각 시나리오는 원본 CUE에서 12,050프레임을 실행한다. idle은 무입력이다. buttons는 n=1..120 각각에 100*n 프레임에서 circle, 100*n+40 프레임에서 start를 한 프레임씩 누른다. 두 기록에서 화면이 처음 갈라지는 프레임은 276이다. 1,800프레임 무입력 독립 실행 두 번의 영상·음성 및 최종 RAM 기록이 일치했다.

검증 명령은 python tools/verify_trace.py idle TRACE 또는 python tools/verify_trace.py buttons TRACE다. 매 프레임의 화면 해시, 화면 크기, 픽셀 형식, PCM 해시와 최종 RAM 해시를 포함한 JSONL을 검사한다.

1편 SLPS-01462의 디스크는 D0~D5 하위 디렉터리와 분리 파일을 사용한다. 2편은 EXE의 색인으로 YASO.D의 리소스를 읽는다. 1편 M00.BIN의 헤더와 2편 SCE00.BIN의 시작 명령은 구조가 다르다. 시나리오 실행 루틴의 동등성은 추가 대조 대상이다.
