// Scenario commands that reach the memory card, run as the translated original routines
// (src/menu/translated.js): 0x1f (0x8001f328), 0x3d the bookmark restore (0x80021320 ->
// 0x800329ec) and 0x44 (0x8002188c). Each is called as the interpreter's table entry is,
// with the interpreter's sp.
import { HANDLERS } from "./interp.js";
import { op1f, op3d, op44 } from "../menu/translated.js";

HANDLERS[0x1f] = function* (ctx) { yield* op1f(ctx); };
HANDLERS[0x3d] = function* (ctx) { yield* op3d(ctx); };
HANDLERS[0x44] = function* (ctx) { yield* op44(ctx); };
