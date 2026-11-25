// Verify control-flow landmarks in the Japanese SLPS_251.32 executable.
// @category SoundNovel
import ghidra.app.decompiler.DecompInterface;
import ghidra.app.decompiler.DecompileResults;
import ghidra.app.script.GhidraScript;
import ghidra.program.model.address.Address;
import ghidra.program.model.listing.Function;
import ghidra.program.model.listing.Instruction;
import ghidra.program.model.symbol.SourceType;

public class OpeningChecks extends GhidraScript {
    private Address va(long value) {
        return currentProgram.getAddressFactory().getDefaultAddressSpace().getAddress(value);
    }

    private void directCall(long pc, long target) throws Exception {
        Instruction instruction = getInstructionAt(va(pc));
        if (instruction == null || !instruction.getFlowType().isCall() ||
                instruction.getFlows().length != 1 || !instruction.getFlows()[0].equals(va(target))) {
            throw new Exception(String.format("Unexpected call at %08x", pc));
        }
        println(String.format("OPENING call %08x -> %08x", pc, target));
    }

    @Override
    public void run() throws Exception {
        if (!currentProgram.getExecutableSHA256().equalsIgnoreCase(
                "591622064f7ae4dab96c87a9e0a01491a8086c6726ebd7860505dfe1b5f38dee") ||
                !currentProgram.getLanguageID().toString().equals("r5900:LE:32:default")) {
            throw new Exception("Requires the supported PS2 executable and R5900 language");
        }
        DecompInterface decompiler = new DecompInterface();
        if (!decompiler.openProgram(currentProgram)) throw new Exception("Could not open decompiler");
        long[] entries = {0x100008, 0x1000c8, 0x107c68, 0x1083b8, 0x131a78,
                          0x11b4d0, 0x11c490, 0x11bea0, 0x11bf58, 0x11c190,
                          0x13d140, 0x144338, 0x144420, 0x1444c0, 0x142e50,
                          0x1bd870, 0x1bd960, 0x1bd9c8, 0x1be2e8, 0x1bf110};
        String[] names = {"ee_startup", "game_entry_loop", "show_system_media", "game_title",
                          "dispatch_name_input", "begin_name_input", "normal_name_buttons",
                          "append_name_glyph", "erase_name_glyph", "confirm_name",
                          "dispatch_scene_audio", "queue_bgm_play", "queue_bgm_stop",
                          "queue_bgm_volume", "run_audio_queue", "bgm_play", "bgm_stop",
                          "bgm_volume", "scale_bgm_volume", "wait_bgm_fade"};
        try {
            for (int i = 0; i < entries.length; i++) {
                Address entry = va(entries[i]);
                if (getInstructionAt(entry) == null) disassemble(entry);
                Function f = getFunctionAt(entry);
                if (f == null) f = createFunction(entry, names[i]);
                if (f == null) throw new Exception("No function at " + entry);
                f.setName(names[i], SourceType.USER_DEFINED);
                DecompileResults result = decompiler.decompileFunction(f, 30, monitor);
                if (!result.decompileCompleted() || result.getHighFunction() == null)
                    throw new Exception("Could not decompile " + entry + ": " + result.getErrorMessage());
                println("OPENING decompiled " + entry + " " + names[i]);
            }
            directCall(0x1000a4, 0x1532d0);
            directCall(0x10016c, 0x107c68);
            directCall(0x100188, 0x107c68);
            directCall(0x100204, 0x107c68);
            directCall(0x108484, 0x108710);
            directCall(0x108498, 0x108710);
            directCall(0x131b70, 0x11b4d0);
            directCall(0x11c588, 0x11bea0);
            directCall(0x11c5a4, 0x11bf58);
            directCall(0x11c5d8, 0x11c190);
            // Both confirmation prompts pass the selected name to the same text loop.
            directCall(0x11d864, 0x11d978);
            directCall(0x11d8ec, 0x11d978);
            directCall(0x11d9c0, 0x16f808);
            directCall(0x16f9a8, 0x16dcd0);
            // Compare the character with CP932 full-width space and branch to 0x16dd10.
            if (getInt(va(0x16dcd4)) != 0x34028140 || getInt(va(0x16dce4)) != 0x10a2000a)
                throw new Exception("Unexpected full-width space dispatch");
            directCall(0x16f9b4, 0x16c580);
            directCall(0x16f9c0, 0x16c4e0);
            // The command switch indexes its table by (opcode - 2).
            if (getInt(va(0x21a240 + 4 * (0x6c - 2))) != 0x10f6c0 ||
                getInt(va(0x213578 + 12)) != 0x127858)
                throw new Exception("Unexpected CommandSelect dispatch");
            directCall(0x10f6cc, 0x127618);
            if (getInt(va(0x21a240 + 4 * (0x50 - 2))) != 0x10fa00)
                throw new Exception("Unexpected CommandWait dispatch");
            if (getInt(va(0x21a240 + 4 * (0x16 - 2))) != 0x10f700)
                throw new Exception("Unexpected CommandNoop16 dispatch");
            directCall(0x10f70c, 0x127e28);
            directCall(0x10fa0c, 0x12d1f8);
            directCall(0x12d230, 0x10cc10);
            directCall(0x12d23c, 0x112de8);
            directCall(0x12d244, 0x17a070);
            // jr ra, with daddu v0, zero, zero in its delay slot.
            if (getInt(va(0x17a070)) != 0x03e00008 || getInt(va(0x17a074)) != 0x0000102d)
                throw new Exception("Unexpected wait bypass predicate");
            directCall(0x12d258, 0x112de8);
            directCall(0x112740, 0x112e08);
            directCall(0x1010bc, 0x10ba28);
            directCall(0x10ba38, 0x1126a0);
            directCall(0x112748, 0x112ec0);
            directCall(0x10113c, 0x154480);
            directCall(0x1544c8, 0x1ccd60);
            directCall(0x154268, 0x1ccd40);
            // Both delay slots load the same synchronization object into a0.
            if (getInt(va(0x1544cc)) != 0x8f849128 || getInt(va(0x15426c)) != 0x8f849128)
                throw new Exception("Unexpected game loop synchronization object");
            directCall(0x12ec04, 0x101348);
            directCall(0x10135c, 0x1013d8);
            directCall(0x12ec20, 0x10cec8);
            if (getInt(va(0x2196b0 + 4 * 7)) != 0x101528 ||
                getInt(va(0x2196b0 + 4 * 12)) != 0x101538)
                throw new Exception("Unexpected equality or inequality dispatch");
            // Title and selection widgets use the same system cue call. a0 is the
            // cue ID and a1 is the integer volume (60); a2-a4 are zero.
            directCall(0x108bb4, 0x1bda78);
            directCall(0x108c78, 0x1bda78);
            if (getInt(va(0x108ba4)) != 0x24040002 || getInt(va(0x108ba8)) != 0x2405003c ||
                getInt(va(0x108c68)) != 0x24040004 || getInt(va(0x108c6c)) != 0x2405003c)
                throw new Exception("Unexpected title selection cue IDs or volume");
        } finally {
            decompiler.dispose();
        }
        println("OPENING verified");
    }
}
