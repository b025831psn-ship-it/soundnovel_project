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

검증기는 원본 파일이나 경로를 읽지 않고 매니페스트의 구조만 검사한다. 실제
해시 생성기는 CUE 파싱과 트랙 주소 검증을 함께 구현한 뒤 추가한다.
