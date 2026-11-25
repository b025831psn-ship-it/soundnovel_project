# libsnd / libspu entry points used by the sound module (SLPS_017.94)

Named from call sites in the game module and from each function's body
(argument shapes, attribute masks, SPU register use). "?" = inferred from use only.

| Address | Name | Evidence |
|---|---|---|
| 0x80055f28 | SsInit | first call in reset 0x80028ccc |
| 0x80055d88 | SsEnd | reset, only when already initialised |
| 0x80058ec8 | SsSetTableSize(tbl, 16, 1) | 3 args, table at 0x801fc568 |
| 0x800590e8 | SsSetTickMode(0x1000 = SS_NOTICK) | VSync callback calls SsSeqCalledTbyT |
| 0x800589a8 | SsStart | after tick mode |
| 0x800585b8 | SsSetSerialAttr(0, 0, 1) | CD mix on |
| 0x8005e088 / 0x8005e098 | SsSetMono / SsSetStereo | chosen by option byte 0x800792c5 |
| 0x8005e0a8 | ? (arg 0x11) | reset only |
| 0x80054738 | SsSeqCalledTbyT | VSync callback 0x80028f88 |
| 0x8005e188 | SsVabOpenHeadSticky(head, -1, sbaddr) | music sbaddr = 0x80000 - (head size + reverb area) |
| 0x8005e5b8 | SsVabTransBody(body, vab) | |
| 0x8005e678 | SsVabTransCompleted(mode) | polled until 1 |
| 0x8005e0d8 | SsVabClose | |
| 0x80055f58 | SsSeqOpen(seq, vab) | returns access number |
| 0x80058418 | SsSeqPlay(acc, 1, loops) | wraps 0x80058498 |
| 0x80058d58 | SsSeqStop | |
| 0x80055ba4 | SsSeqClose | |
| 0x800592c8 | SsSeqSetVol(acc, l, r) | fade steps |
| 0x80055d1c | SsSeqSetDecrescendo? (acc, 0, 1) | wraps 0x80055bf8 with sub 0 |
| 0x80058678 | SsSetMVol(l, r) | value*129, common attr mask 3 |
| 0x800586c8 | SsSetRVol(l, r) | value*0x7fff/127, reverb depth mask 6 |
| 0x8005a5a8 | SsUtSetReverbDepth(l, r) | libsnd reverb attr at 0x8009daa0, mask 6 |
| 0x8005a638 | SsUtSetReverbType(type) | range < 10, negative = clear |
| 0x8005a6e8 | SsUtSetReverbFeedback | attr field +0x10 |
| 0x8005a748 / 0x8005a728 | SsUtReverbOn / SsUtReverbOff | SpuSetReverb(1/0) at 0x800603b8 |
| 0x80059cd8 | SsUtKeyOn(vab, prog, tone, note, fine, l, r) | UI sounds 0x80028c74 |
| 0x8005a188 | SsUtKeyOnV(voice, vab, prog, tone, note, fine, l, r) | effect op 3 |
| 0x8005a4e8 | SsUtKeyOffV(voice) | effect ops 3/9, stop |
| 0x80059848 | SsUtChangePitch(voice, vab, prog, old note, old fine, new note, new fine) | effect pitch ramp |
| 0x8005a974 | SsUtSetVVol(voice, l, r) | per frame 0x800272a4 |
| 0x80061368 | SpuGetKeyStatus(1 << voice) | channel ends when not ON |
| 0x8005fd48 | SpuMallocWithStartAddr(0x1010, size) | effect banks |
| 0x8005fff8 | SpuFree | |
| 0x80060ff8 | VSync(n)? | VSync(5) between reverb changes |
