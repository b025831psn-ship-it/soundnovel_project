# Zakuro SFC: screen checkpoints and replay tools

`boot-screens.mjs` drives the VM with a token list. The native side uses the same tokens with Snes9x 2005 libretro, where one token step is one `retro_run`.

| token | meaning |
|---|---|
| `N<n>` | run n fields with no button held |
| `S<n>` `A<n>` `B<n>` `X<n>` `Y<n>` | START, A, B, X, Y held for n fields |
| `U<n>` `D<n>` `L<n>` `R<n>` | d-pad up, down, left, right held for n fields |
| `l<n>` `r<n>` | L and R shoulder held for n fields |
| `E<n>` | SELECT held for n fields |
| `@name` | capture the current frame, then keep going |
| `RESET` | console reset (VM `reset()`, native `retro_reset`) |
| `?` | print scene, slot (`$0348`) and the SRAM slot markers |

Every sequence starts from power-on with empty SRAM (filled with `$60`).

```text
BOOT  = N301,S3,N181,A3,N181,S3,N181
title         : N301,S3,N8,N173                                     (@ after: PUSH START screen)
slot-empty    : BOOT                                                 (@ after: one "未使用" disk)
name-grid     : BOOT,A3,N181                                         (@ after: 主人公の名前を入力して下さい)
name-custom   : BOOT,A3,N181,A3,N181,R3,N10,A3,N20,R3,N10,A3,N60     (@ after: 土門亜亜)
NEWGAME       = BOOT,A3,N181,A3,N181,R3,N10,A3,N20,R3,N10,A3,N60,S3,N181,A3,N181,S3,N181
slot-used     : NEWGAME,RESET,N301,S3,N181,A3,N181,S3,N181           (@ after: 土門亜亜 0回 00%)
file-menu     : <slot-used>,l3,N120                                  (@ after: 途中から再開する / 最初から始める / ファイルを消す)
erase-prompt  : <slot-used>,l3,N120,D3,N30,D3,N30,A3,N120,R3,N30     (@ after: いいえ / はい, はい selected)
erased        : <erase-prompt>,A3,N180                               (@ after: 未使用; SRAM $0000 = FF FF)
slot-2        : <slot-used>,D12,N60                                  (@ after: second disk in front)
```

The QA thread confirmed with these same inputs that native Snes9x 2005 reaches the same states: name, slot 2 and erase (project file `qa/zakuro-sfc-beta/hidden/`).

Story checkpoints (choice box, portrait scene, numbered ending, bonus quiz) come from `vm-completion.mjs`. It replays zakuro-sfc-kor `routes/completion.json` with the `autoplay.py` and `completion_campaign.py` input timing. To capture at the same field on both sides:

- choice box: the first `advance()` that returns `menu` in play 1 (scene 5)
- numbered ending: the `advance()` that returns `ending` in play 1 (scene 317)
- bonus quiz: the first menu of play 32 (scene 1311, opening 1310). It starts from the SRAM after play 31.

`vm-completion.mjs` usage:

```sh
node vm-completion.mjs <ports/zakuro-sfc> <rom> <ipl.bin> <boot-dsp.bin> <autoplay-layout.json> <completion.json> <out.json> [sramDir]
# Parallel ranges from a saved slot: FROM=<play> TO=<play> SRAM=<sramDir>/after-play-<FROM-1>.srm
# RESET=power rebuilds the VM between plays (the old workaround). The default is now vm.reset() after e06333e.
```
