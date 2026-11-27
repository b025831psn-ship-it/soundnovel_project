# 비공개 디스크 매니페스트

매니페스트는 로컬 원본 판본을 고정하기 위한 JSON이다. 실제 파일 경로와 원본
파일명은 공개 커밋 전에 제거하며, 매니페스트 자체는 비공개 저장소에 둔다.

```json
{
  "schemaVersion": 1,
  "media": "ps1-cue-bin",
  "files": [
    {
      "role": "cue",
      "size": 123,
      "sha256": "64자리 소문자 16진수"
    },
    {
      "role": "track-data",
      "size": 123456,
      "sha256": "64자리 소문자 16진수"
    }
  ],
  "disc": {
    "volumeId": null,
    "bootPath": null,
    "productCode": null
  }
}
```

`files` 순서는 CUE에서 참조되는 순서를 보존한다. `role`은 `cue`,
`track-data`, `track-audio` 중 하나다. 확인 전 값은 빈 문자열 대신 `null`로
두어 미확정과 실제 빈 값을 구분한다. SHA-256은 파일 바이트 전체를 대상으로 한다.

초기 제절초 전용 예시는 호환 참고용이다. 실제 매니페스트는 저장소 루트의
`tools/media-inventory/`로 생성한다. 범용 도구는 CUE 참조 파일을 스트리밍으로
해시하고 트랙·ISO9660·SYSTEM.CNF·부팅 실행 파일을 함께 조사한다.
