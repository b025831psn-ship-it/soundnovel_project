# 원작 화면 캡처 (PPSSPP, 화면 없이)

사용자 PC를 쓰지 않고 클라우드/리눅스에서 원작을 돌려 대표 지점을 캡처한다.

1. PPSSPP v1.19.3을 빌드한다(`-DHEADLESS=ON`, SDL2). 최신 main은 SDL3가 필요하다.
2. 빌드 폴더에서 실행: `HOME=<작업폴더> ./PPSSPPHeadless <iso> --graphics=software --debugger=45458 --timeout=3000`
   (디버거가 시작 지점에서 멈추므로 `cpu.resume`을 한 번 보낸다.)
3. `S=<출력폴더> PRESS_MS=400 node capture.mjs p:circle w:3 g:name ...`
   - `p:버튼` 누르기(circle, cross, up, …), `w:초` 기다리기, `g:이름` VRAM 캡처 → `<이름>.png`(왼쪽·오른쪽 = 두 프레임 버퍼).
   - 게임 안 결정은 ○, 취소는 ×. PPSSPP 시스템 대화상자(저장·불러오기)는 × 결정이며 글자가 보이지 않는다(PPGe 글꼴 없음). 불러오기 확인은 ←, ×.
4. 프레임 버퍼는 VRAM 0x04000000, 512폭 16비트(5551).

알아낸 원작 수치(K01A_0010): 본문 왼쪽 x=50, 첫 줄 위 26, 줄 간격 27, 오른쪽 한계 430, 글자 진행폭 = 글리프 진행값 × 480/1280 + 0.5, 글자 테두리는 어두운 1px.
