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
                          0x11b4d0, 0x11c490, 0x11bea0, 0x11bf58, 0x11c190};
        String[] names = {"ee_startup", "game_entry_loop", "show_system_media", "game_title",
                          "dispatch_name_input", "begin_name_input", "normal_name_buttons",
                          "append_name_glyph", "erase_name_glyph", "confirm_name"};
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
            // The command switch indexes its table by (opcode - 2).
            if (getInt(va(0x21a240 + 4 * (0x6c - 2))) != 0x10f6c0 ||
                getInt(va(0x213578 + 12)) != 0x127858)
                throw new Exception("Unexpected CommandSelect dispatch");
            directCall(0x10f6cc, 0x127618);
            if (getInt(va(0x21a240 + 4 * (0x50 - 2))) != 0x10fa00)
                throw new Exception("Unexpected CommandWait dispatch");
            directCall(0x10fa0c, 0x12d1f8);
            directCall(0x12d230, 0x10cc10);
            directCall(0x12d23c, 0x112de8);
            directCall(0x12d258, 0x112de8);
            directCall(0x112740, 0x112e08);
            directCall(0x12ec04, 0x101348);
            directCall(0x10135c, 0x1013d8);
            directCall(0x12ec20, 0x10cec8);
            if (getInt(va(0x2196b0 + 4 * 7)) != 0x101528 ||
                getInt(va(0x2196b0 + 4 * 12)) != 0x101538)
                throw new Exception("Unexpected equality or inequality dispatch");
        } finally {
            decompiler.dispose();
        }
        println("OPENING verified");
    }
}
