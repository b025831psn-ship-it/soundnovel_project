// Decompile SN4 text layout/effect Execute handlers recovered from the vtables.
// @category SoundNovel
import ghidra.app.decompiler.DecompInterface;
import ghidra.app.decompiler.DecompileResults;
import ghidra.app.script.GhidraScript;
import ghidra.program.model.address.Address;
import ghidra.program.model.listing.Function;

public class LayoutChecks extends GhidraScript {
    private Address va(long value) {
        return currentProgram.getAddressFactory().getDefaultAddressSpace().getAddress(value);
    }
    public void run() throws Exception {
        DecompInterface decompiler = new DecompInterface();
        decompiler.openProgram(currentProgram);
        long[] entries = {0x12ad70,0x12a3e8,0x135980,0x12de30,0x12e1d8,0x12d9f0,
                          0x12ba20,0x12a6f8,0x12bd38,0x12c070,0x12c798,0x132ab8,
                          0x12c6b8,0x132940,0x12dca0,0x12e0e0,0x12d8d8,
                          0x16e690,0x16e6c8,0x16e700,0x16e968,0x16e9f0,
                          0x16e430,0x16e438,0x16e440,0x16e448,
                          0x16f238,0x16f278,0x16f69c};
        for (long value : entries) {
            Address entry = va(value);
            Function function = getFunctionContaining(entry);
            if (function == null) function = createFunction(entry, null);
            DecompileResults result = decompiler.decompileFunction(function, 30, monitor);
            println(String.format("LAYOUT %08x entry=%s\n%s", value, function.getEntryPoint(),
                    result.getDecompiledFunction().getC()));
        }
    }
}
