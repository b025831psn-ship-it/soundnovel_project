// Decompile the SN4 missing-glyph and full-width-space renderer paths.
// @category SoundNovel
import ghidra.app.decompiler.DecompInterface;
import ghidra.app.decompiler.DecompileResults;
import ghidra.app.script.GhidraScript;
import ghidra.program.model.address.Address;
import ghidra.program.model.listing.Function;

public class FontFallbackChecks extends GhidraScript {
    private Address va(long value) {
        return currentProgram.getAddressFactory().getDefaultAddressSpace().getAddress(value);
    }
    public void run() throws Exception {
        DecompInterface decompiler = new DecompInterface();
        decompiler.openProgram(currentProgram);
        long[] entries = {0x16dcd0, 0x16ce70, 0x16cf48, 0x170408, 0x1702b0,
                          0x16c580, 0x16c4e0, 0x16f978, 0x16f808};
        for (long value : entries) {
            Address entry = va(value);
            Function function = getFunctionContaining(entry);
            if (function == null) function = createFunction(entry, null);
            DecompileResults result = decompiler.decompileFunction(function, 30, monitor);
            println(String.format("FONT %08x entry=%s\n%s", value, function.getEntryPoint(),
                    result.getDecompiledFunction().getC()));
        }
    }
}
