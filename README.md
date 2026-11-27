# soundnovel_project

Codex와 Claude는 작업 시작 전에 [공통 협업 규칙](CONTRIBUTING.md)을 확인합니다.

## 카마이타치의 밤 SFC 원본 플레이어

원본 SFC 실행 관통용 페이지는 `/sfc-player/`입니다. ROM은 저장소에 포함하지
않으며 사용자가 고른 로컬 파일의 크기와 SHA-256을 브라우저에서 확인한 뒤에만
실행합니다.

```sh
npm install
npm run serve
# http://127.0.0.1:8770/sfc-player/
```

웹 플레이 관통은 검증된 Snes9x WASM 하드웨어 코어를 사용합니다. `sfc-vm/`의
65c816/PPU/SPC trace-first VM은 대체 화면을 그리는 런타임이 아니라, 원본 루틴과
데이터 구조를 instruction 단위로 역분석하고 기준 코어와 대조하기 위한 별도
실험 장치입니다.
