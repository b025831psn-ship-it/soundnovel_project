# 하위 리포 구성과 교차 참고 규칙

공통 작업 방식(이슈, 브랜치, PR, 인계)은 `CONTRIBUTING.md`를 따르고, 이 문서는 하위 리포(submodule) 사용법만 다룬다.

## 하위 리포 목록

| 폴더 | 게임 | 비고 |
| --- | --- | --- |
| `majo-tach-sfc-kor` | 마녀들의 잠 (SFC) | `kor_patch` 리포의 `feature/sfc-localization` 브랜치 |
| `zakuro-sfc-kor` | 석류의 맛 (SFC) | |
| `otogirisou-sfc-kor` | 오토기리소우 (SFC) | |
| `kamaitachi-sfc-kor` | 카마이타치의 밤 (SFC) | |
| `yakouchuu-sfc-kor` | 야광충 (SFC) | |
| `anubis-sfc-kor` | 아누비스 (SFC) | |

게임을 추가할 때는 새 리포를 만든 뒤 이 표에 한 줄을 더하고, 아래 명령으로 연결한다.

```sh
git submodule add https://github.com/b025831psn-ship-it/<이름>.git <이름>
```

## 받는 방법

```sh
git clone --recurse-submodules https://github.com/b025831psn-ship-it/soundnovel_project.git
# 이미 받았다면
git submodule update --init --recursive
```

## 다른 게임 리포를 참고할 때

- 다른 게임 리포는 **읽기만** 한다. 수정은 그 게임을 맡은 세션이 그 리포에서 한다.
- 하위 리포는 상위 리포에 기록된 커밋 기준으로 보인다. 최신 내용이 필요하면 해당 리포를 직접 열거나 `git submodule update --remote <폴더>`로 갱신한다.
- 참고하려는 규칙이나 용어는 그 게임 리포의 문서를 먼저 확인하고, 여러 게임에 공통인 내용은 상위 리포 문서에 둔다.

## 하위 리포를 수정한 뒤

1. 하위 리포에서 브랜치, PR, 머지를 진행한다. 규칙은 `CONTRIBUTING.md`를 따른다.
2. 머지 후 상위 리포에서 새 커밋을 가리키도록 갱신하는 PR을 연다.
3. 갱신 PR은 하위 리포 하나당 작게 만든다. 여러 세션이 한 번에 포인터를 바꾸면 충돌하기 쉽다.

## 하위 리포의 AGENTS.md / CLAUDE.md

하위 리포만 열고 작업하는 세션도 규칙을 볼 수 있도록, 각 하위 리포의 `AGENTS.md`와 `CLAUDE.md`에 아래 한 줄을 둔다.

> 공통 협업 규칙은 soundnovel_project의 `CONTRIBUTING.md`와 `REPOSITORIES.md`를 따른다.

## 공개하지 않는 것

게임 ROM·디스크 이미지, BIOS, 개인 세이브는 어느 리포에도 커밋하지 않는다.
