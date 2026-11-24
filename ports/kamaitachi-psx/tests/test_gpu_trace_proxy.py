import ctypes
import json
import os
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path


TOOL = Path(__file__).parents[1] / "tools" / "gpu_trace_proxy.c"
FAKE = r'''
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
long GPUinit(void){return 0;} long GPUshutdown(void){return 0;}
long GPUopen(unsigned long*a,char*b,char*c){return 0;} long GPUclose(void){return 0;}
uint32_t GPUreadData(void){return 0;} void GPUreadDataMem(uint32_t*a,int b){}
uint32_t GPUreadStatus(void){return 0;} void GPUwriteStatus(uint32_t a){}
void GPUwriteData(uint32_t a){} void GPUwriteDataMem(uint32_t*a,int b){}
long GPUdmaChain(uint32_t*a,uint32_t address){FILE*f=fopen(getenv("FAKE_RESULT"),"w");fprintf(f,"%u\n",address);fclose(f);return 0;}
void GPUupdateLace(void){} long GPUfreeze(uint32_t a,void*b){return 0;}
'''


@unittest.skipUnless(shutil.which("gcc"), "gcc is required")
class GpuTraceProxyTests(unittest.TestCase):
    def test_direct_burst_dma_and_frame_events(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            fake_source = root / "fake.c"
            fake_source.write_text(FAKE)
            fake = root / "fake.so"
            proxy = root / "proxy.so"
            trace = root / "trace.jsonl"
            result = root / "result.txt"
            subprocess.run(["gcc", "-shared", "-fPIC", str(fake_source), "-o", str(fake)], check=True)
            subprocess.run(["gcc", "-shared", "-fPIC", str(TOOL), "-ldl", "-o", str(proxy)], check=True)
            os.environ.update(PSX_GPU_REAL=str(fake), PSX_GPU_TRACE=str(trace), FAKE_RESULT=str(result))
            library = ctypes.CDLL(str(proxy))
            library.GPUwriteStatus(0x03000001)
            library.GPUwriteData(ctypes.c_uint32(0xE1000200))
            burst = (ctypes.c_uint32 * 2)(0xA0000000, 0x11223344)
            library.GPUwriteDataMem(burst, 2)
            ram = (ctypes.c_uint32 * (2 * 1024 * 1024 // 4))()
            ram[0x100 // 4] = (2 << 24) | 0x200
            ram[0x104 // 4], ram[0x108 // 4] = 0x600000FF, 0x00100020
            ram[0x200 // 4], ram[0x204 // 4] = (1 << 24) | 0xFFFFFF, 0xE6000000
            library.GPUdmaChain(ram, 0x100)
            library.GPUupdateLace()
            events = [json.loads(line) for line in trace.read_text().splitlines()]
            self.assertEqual([event["port"] for event in events], ["gp1", "gp0", "gp0", "gp0", "gp0", "gp0", "gp0", "frame"])
            self.assertEqual([event.get("value") for event in events[4:7]], [0x600000FF, 0x00100020, 0xE6000000])
            self.assertEqual(result.read_text().strip(), str(0x100))


if __name__ == "__main__":
    unittest.main()
