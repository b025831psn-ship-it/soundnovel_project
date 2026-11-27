# MIPS → JS translator

`src/menu/translated.js` is generated from the game's own EXE (which stays with the user):

```sh
cd tools/translate
SLPS=/path/to/SLPS_017.94 python3 gen-menu.py > /tmp/body.js   # needs python3-capstone
```

Then replace everything after the header (the comment block and imports) of
`src/menu/translated.js` with the output. `gen-menu.py` lists the routines and their names, and
the tap rows (`HOOKS`) inserted before each selection loop's frame wait. Routines the
translated code calls but that are ported by hand elsewhere are wired in `src/menu/calls.js`.

Each routine becomes one generator with a `switch` case per basic block: registers are
locals, memory is the PS1 RAM at the original addresses, branch delay slots run before the
jump, and `jal` goes through `call()` with the caller's sp (stack arguments stay where the
original puts them, from sp + 0x10).
