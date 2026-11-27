# 시나리오·EBOOT 조사 도구 (휴식 전 정리, 2026-11-28)
- `node ctl.mjs to.sns LABEL [n]` 라벨부터 제어 명령만(본문 제외) 출력
- `node varw.mjs to.sns N` 변수 N을 쓰는 곳, `node varr.mjs to.sns N` 읽고 쓰는 곳
- `node zapv.mjs to.sns to.flo` JUMP 칸 전체와 대상 CONTINUE_CHECK 조건 변수
- `node raw.mjs to.sns LABEL before after` 라벨 앞뒤 원시 명령
- `fn.sh ADDR [n]` eboot.asm에서 함수 하나 출력 (eboot.asm은 같은 폴더에 있어야 함)
스크립트가 안 쓰는 변수(예: 14)는 EBOOT의 vars(ctx+0x1660) 쓰기를 먼저 찾는다.
