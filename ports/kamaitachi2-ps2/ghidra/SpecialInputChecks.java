// Decompile the scenario commands that stop for direct player input.
// @category SoundNovel
import ghidra.app.decompiler.DecompInterface;
import ghidra.app.decompiler.DecompileResults;
import ghidra.app.script.GhidraScript;
import ghidra.program.model.address.Address;
import ghidra.program.model.listing.Function;

public class SpecialInputChecks extends GhidraScript {
    private Address va(long value) {
        return currentProgram.getAddressFactory().getDefaultAddressSpace().getAddress(value);
    }

    public void run() throws Exception {
        DecompInterface decompiler = new DecompInterface();
        if (!decompiler.openProgram(currentProgram)) throw new Exception("decompiler open failed");
        long[] entries = {
            0x12fe10, // CommandClickMap::Execute
            0x130a18, // CommandPanel::Execute
            0x130f80, // CommandDelusionPanel::Execute
            0x131d08, // CommandNameInput::Execute
            0x131a78, // name-input dispatcher
            0x133538, // CommandCipher::Execute
            0x11b4d0, // begin name input
            0x11c190, // finish name input
            0x118f78, // begin cipher input
            0x11e348, // install name-result targets
            0x11e590, // create criminal-name UI
            0x11e610  // initialize criminal-name table/UI
        };
        for (long value : entries) {
            Address entry = va(value);
            Function function = getFunctionAt(entry);
            if (function == null) function = createFunction(entry, null);
            DecompileResults result = decompiler.decompileFunction(function, 60, monitor);
            if (!result.decompileCompleted()) throw new Exception("decompile failed at " + entry);
            println(String.format("SPECIAL %08x\n%s", value, result.getDecompiledFunction().getC()));
        }
    }
}
