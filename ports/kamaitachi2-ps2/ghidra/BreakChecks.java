// Decompile the one CommandBreak path and its state-changing callees.
// @category SoundNovel
import ghidra.app.decompiler.DecompInterface;
import ghidra.app.decompiler.DecompileResults;
import ghidra.app.script.GhidraScript;
import ghidra.program.model.address.Address;
import ghidra.program.model.listing.Function;

public class BreakChecks extends GhidraScript {
    private Address va(long value) {
        return currentProgram.getAddressFactory().getDefaultAddressSpace().getAddress(value);
    }
    public void run() throws Exception {
        DecompInterface decompiler = new DecompInterface();
        if (!decompiler.openProgram(currentProgram)) throw new Exception("decompiler open failed");
        long[] entries = {0x1373b8, 0x10c6a8, 0x100e58, 0x112a80, 0x11b230, 0x122c08};
        for (long value : entries) {
            Address entry = va(value);
            Function function = getFunctionAt(entry);
            if (function == null) function = createFunction(entry, null);
            DecompileResults result = decompiler.decompileFunction(function, 30, monitor);
            println(String.format("BREAK %08x\n%s", value,
                    result.getDecompiledFunction().getC()));
        }
    }
}
