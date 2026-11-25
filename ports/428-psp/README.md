# 428 ~封鎖された渋谷で~ (PSP) 웹 이식

원작 PSP판(ULJS-00219 v1.01)을 웹에서 원작 그대로 재현하는 이식. 엔진·도구는 이 저장소, 게임 자산(시나리오·사진·소리·영상)은 비공개 저장소에 둔다.

## 판본
- ISO SHA-256 `94731b7ddd7214e07645e5dcfc05fae1c4560ee2249432be6438169f504b5c2a`
- EBOOT(복호화본) SHA-256 `194a2dcb010c86f40302fd7f83e6be1f0cd446294716b0fbd05d7f2acafc3dce`

## 자산 추출 순서 (로컬, 원본 디스크 필요)
1. `tools/isols.py ISO` 로 파일 목록, ISO에서 `PSP_GAME/USRDIR/*.cpk` 복사
2. `gcc -O2 -o tools/crilayla tools/crilayla.c` 후 `python3 tools/cpk.py X.cpk out/X` (CRILAYLA 자동 해제)
3. 사진: `python3 tools/gim2png.py -all x png` (DXT1/DXT5/팔레트, PSP 스위즐)
4. 소리: `python3 tools/audio_all.py x snd` (AT3→Ogg + smpl 루프, CSB의 ADX/RIFF 구간 → Ogg + 인트로/루프 경계). 재개형, 160초 단위.
5. 영상: `python3 tools/pmf2mp4.py -all x mov <아무 AT3 파일>` (PSMF H.264 복사 + ATRAC3plus 비공개 스트림 분리)
6. 시나리오: `engine/sns.js` 의 `decryptSns` (암호문 − `CSD-CSCNV:01.82\0`), 디스어셈블은 `tools/dis.py`
7. 글꼴: `tools/gsf.py` (gsffont.gsf/.has, 4비트 RLE, 유니코드)

## 검사
- `node test/sns-walk.mjs to.sns` — 34개 스크립트 전체 동기, 점프 대상 누락 검사

VM 구조와 명령 메모는 [OPCODES.md](OPCODES.md).
