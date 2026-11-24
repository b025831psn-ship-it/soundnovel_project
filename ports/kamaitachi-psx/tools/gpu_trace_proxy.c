/* PSEmu GPU proxy that records GP0, GP1, DMA-chain, and frame events as JSONL. */
#define _GNU_SOURCE
#include <dlfcn.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>

static void *real_gpu;
static FILE *trace_file;

static void load_real(void) {
  const char *path;
  if (real_gpu) return;
  path = getenv("PSX_GPU_REAL");
  if (!path || !*path) { fputs("gpu trace proxy: PSX_GPU_REAL is required\n", stderr); abort(); }
  real_gpu = dlopen(path, RTLD_NOW | RTLD_LOCAL);
  if (!real_gpu) { fprintf(stderr, "gpu trace proxy: %s\n", dlerror()); abort(); }
}

static void *symbol(const char *name) {
  void *result;
  load_real();
  result = dlsym(real_gpu, name);
  if (!result) { fprintf(stderr, "gpu trace proxy: missing %s\n", name); abort(); }
  return result;
}

static FILE *trace(void) {
  const char *path;
  if (trace_file) return trace_file;
  path = getenv("PSX_GPU_TRACE");
  if (!path || !*path) return NULL;
  trace_file = fopen(path, "a");
  if (trace_file) setvbuf(trace_file, NULL, _IOLBF, 0);
  return trace_file;
}

static void word(const char *port, uint32_t value) {
  FILE *output = trace();
  if (output) fprintf(output, "{\"port\":\"%s\",\"value\":%u}\n", port, value);
}

char *PSEgetLibName(void) { return "PSEmu GPU trace proxy"; }
unsigned long PSEgetLibType(void) { return 2; }
unsigned long PSEgetLibVersion(void) { return (1u << 16); }

#define REAL(name, type) ((type)symbol(name))
long GPUinit(void) { return REAL("GPUinit", long (*)(void))(); }
long GPUshutdown(void) { return REAL("GPUshutdown", long (*)(void))(); }
long GPUopen(unsigned long *display, char *caption, char *config) {
  return REAL("GPUopen", long (*)(unsigned long *, char *, char *))(display, caption, config);
}
long GPUclose(void) { return REAL("GPUclose", long (*)(void))(); }
uint32_t GPUreadData(void) { return REAL("GPUreadData", uint32_t (*)(void))(); }
void GPUreadDataMem(uint32_t *memory, int size) { REAL("GPUreadDataMem", void (*)(uint32_t *, int))(memory, size); }
uint32_t GPUreadStatus(void) { return REAL("GPUreadStatus", uint32_t (*)(void))(); }
void GPUwriteStatus(uint32_t value) { word("gp1", value); REAL("GPUwriteStatus", void (*)(uint32_t))(value); }
void GPUwriteData(uint32_t value) { word("gp0", value); REAL("GPUwriteData", void (*)(uint32_t))(value); }
void GPUwriteDataMem(uint32_t *memory, int size) {
  for (int index = 0; index < size; index++) word("gp0", memory[index]);
  REAL("GPUwriteDataMem", void (*)(uint32_t *, int))(memory, size);
}
long GPUdmaChain(uint32_t *memory, uint32_t address) {
  uint32_t original = address;
  uint32_t seen[3] = { 0xffffff, 0xffffff, 0xffffff };
  for (unsigned packets = 0; address != 0xffffff && packets < 2000000; packets++) {
    uint32_t header;
    unsigned count;
    address &= 0x1ffffc;
    if (address == seen[1] || address == seen[2]) break;
    if (address < seen[0]) seen[1] = address; else seen[2] = address;
    seen[0] = address;
    header = memory[address >> 2];
    count = header >> 24;
    for (unsigned index = 0; index < count; index++) word("gp0", memory[(address + 4 + index * 4) >> 2]);
    address = header & 0xffffff;
  }
  return REAL("GPUdmaChain", long (*)(uint32_t *, uint32_t))(memory, original);
}
void GPUupdateLace(void) {
  FILE *output = trace();
  if (output) fputs("{\"port\":\"frame\"}\n", output);
  REAL("GPUupdateLace", void (*)(void))();
}
long GPUfreeze(uint32_t mode, void *data) { return REAL("GPUfreeze", long (*)(uint32_t, void *))(mode, data); }
