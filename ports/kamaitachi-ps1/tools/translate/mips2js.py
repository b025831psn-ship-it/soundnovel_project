# MIPS (R3000, little-endian) -> JS generator, one switch case per basic block.
import struct,capstone,sys,re
import os
EXE=os.environ.get('SLPS', 'SLPS_017.94') # the user's own EXE (not in the repository)
d=open(EXE,'rb').read()
base,size=struct.unpack_from('<II',d,0x18); T=d[0x800:0x800+size]
md=capstone.Cs(capstone.CS_ARCH_MIPS,capstone.CS_MODE_MIPS32+capstone.CS_MODE_LITTLE_ENDIAN)
GP=0x8007913c
def w32(a): return struct.unpack_from('<I',T,a-base)[0]
def body(a):
  ins=[];far=a
  for i in md.disasm(T[a-base:a-base+4*8000],a):
    ins.append(i)
    if i.mnemonic in BR or i.mnemonic in ('j','b'):
      tg=int(i.op_str.split(',')[-1].strip(),16)
      if tg>far: far=tg
    if i.mnemonic=='jr' and i.op_str=='$ra' and i.address>=far:
      ins.append(next(md.disasm(T[i.address+4-base:i.address+8-base],i.address+4))); break
  return ins
BR={'beq','bne','beqz','bnez','bgez','bgtz','blez','bltz','bgezal','bltzal'}
def R(x):
  x=x.strip().lstrip('$')
  if x=='zero': return '0'
  if x=='gp': return '0x8007913c'
  if x=='s8': x='fp'
  return x
def W(x):
  x=x.strip().lstrip('$')
  if x=='s8': x='fp'
  return x
def imm(s): return int(s.strip(),0)
def mem(s):
  m_=re.match(r'(-?(?:0x)?[0-9a-f]+)?\(\$(\w+)\)',s.strip())
  o=int(m_.group(1) or '0',0); b=R('$'+m_.group(2))
  return f"(({b}) + {o}) >>> 0"
def ex(i):
  op=i.mnemonic; a=[x.strip() for x in i.op_str.split(',')] if i.op_str else []
  if op=='nop': return ''
  if op=='break': return f'throw new Error("break {i.op_str} at 0x{i.address:08x}");'
  if op in('addiu','addi'):
    return f"{W(a[0])} = ({R(a[1])} + {imm(a[2])}) | 0;" if W(a[0])!='zero' else ''
  if op in('addu','add'): return f"{W(a[0])} = ({R(a[1])} + {R(a[2])}) | 0;"
  if op in('subu','sub'): return f"{W(a[0])} = ({R(a[1])} - {R(a[2])}) | 0;"
  if op=='negu': return f"{W(a[0])} = (-{R(a[1])}) | 0;"
  if op=='move': return f"{W(a[0])} = {R(a[1])} | 0;"
  if op=='not': return f"{W(a[0])} = ~{R(a[1])};"
  if op=='and': return f"{W(a[0])} = {R(a[1])} & {R(a[2])};"
  if op=='or': return f"{W(a[0])} = {R(a[1])} | {R(a[2])};"
  if op=='xor': return f"{W(a[0])} = {R(a[1])} ^ {R(a[2])};"
  if op=='nor': return f"{W(a[0])} = ~({R(a[1])} | {R(a[2])});"
  if op=='andi': return f"{W(a[0])} = {R(a[1])} & {imm(a[2])&0xffff};"
  if op=='ori': return f"{W(a[0])} = {R(a[1])} | {imm(a[2])&0xffff};"
  if op=='xori': return f"{W(a[0])} = {R(a[1])} ^ {imm(a[2])&0xffff};"
  if op=='lui': return f"{W(a[0])} = {(imm(a[1])<<16)&0xffffffff:#x} | 0;"
  if op=='sll': return f"{W(a[0])} = {R(a[1])} << {imm(a[2])};"
  if op=='srl': return f"{W(a[0])} = ({R(a[1])} >>> {imm(a[2])}) | 0;"
  if op=='sra': return f"{W(a[0])} = {R(a[1])} >> {imm(a[2])};"
  if op=='sllv': return f"{W(a[0])} = {R(a[1])} << ({R(a[2])} & 31);"
  if op=='srlv': return f"{W(a[0])} = ({R(a[1])} >>> ({R(a[2])} & 31)) | 0;"
  if op=='srav': return f"{W(a[0])} = {R(a[1])} >> ({R(a[2])} & 31);"
  if op=='slt': return f"{W(a[0])} = ({R(a[1])} | 0) < ({R(a[2])} | 0) ? 1 : 0;"
  if op=='sltu': return f"{W(a[0])} = ({R(a[1])} >>> 0) < ({R(a[2])} >>> 0) ? 1 : 0;"
  if op=='slti': return f"{W(a[0])} = ({R(a[1])} | 0) < {imm(a[2])} ? 1 : 0;"
  if op=='sltiu': return f"{W(a[0])} = ({R(a[1])} >>> 0) < {imm(a[2])&0xffffffff} ? 1 : 0;"
  if op=='mult': return f"[hi, lo] = mult({R(a[0])}, {R(a[1])}, true);"
  if op=='multu': return f"[hi, lo] = mult({R(a[0])}, {R(a[1])}, false);"
  if op=='div': return f"[hi, lo] = div({R(a[0])}, {R(a[1])}, true);"
  if op=='divu': return f"[hi, lo] = div({R(a[0])}, {R(a[1])}, false);"
  if op=='mfhi': return f"{W(a[0])} = hi;"
  if op=='mflo': return f"{W(a[0])} = lo;"
  if op=='mthi': return f"hi = {R(a[0])};"
  if op=='mtlo': return f"lo = {R(a[0])};"
  if op=='lb': return f"{W(a[0])} = (m.read({mem(a[1])}, 1) << 24) >> 24;"
  if op=='lbu': return f"{W(a[0])} = m.read({mem(a[1])}, 1);"
  if op=='lh': return f"{W(a[0])} = (m.read({mem(a[1])}, 2) << 16) >> 16;"
  if op=='lhu': return f"{W(a[0])} = m.read({mem(a[1])}, 2);"
  if op=='lw' and W(a[0])=='ra': return ''
  if op=='lw': return f"{W(a[0])} = m.read({mem(a[1])}, 4) | 0;"
  if op in ('lwl','lwr','swl','swr'):
    A=f"(({mem(a[1])}) & ~3) >>> 0"; N=f"(({mem(a[1])}) & 3)"; r=W(a[0]); R0=R(a[0])
    if op=='lwl': return f"{{ const n = {N}, w = m.read({A}, 4) | 0; {r} = ({R0} & (0x00ffffff >>> (n * 8))) | (w << (24 - n * 8)); }}"
    if op=='lwr': return f"{{ const n = {N}, w = m.read({A}, 4) >>> 0; {r} = ({R0} & (0xffffff00 << ((3 - n) * 8))) | (w >>> (n * 8)); }}"
    if op=='swl': return f"{{ const n = {N}, w = m.read({A}, 4); m.write({A}, ((w & (0xffffff00 << (n * 8))) | ({R0} >>> (24 - n * 8))) >>> 0, 4); }}"
    if op=='swr': return f"{{ const n = {N}, w = m.read({A}, 4); m.write({A}, ((w & (0x00ffffff >>> ((3 - n) * 8))) | ({R0} << (n * 8))) >>> 0, 4); }}"
  if op=='sb': return f"m.write({mem(a[1])}, {R(a[0])} & 0xff, 1);"
  if op=='sh': return f"m.write({mem(a[1])}, {R(a[0])} & 0xffff, 2);"
  if op=='sw':
    if W(a[0])=='ra': return f"m.write({mem(a[1])}, 0, 4);"
    return f"m.write({mem(a[1])}, {R(a[0])} >>> 0, 4);"
  raise Exception(f"{i.address:x} {op} {i.op_str}")
def cond(i):
  op=i.mnemonic; a=[x.strip() for x in i.op_str.split(',')]
  if op=='beq': return f"({R(a[0])} | 0) === ({R(a[1])} | 0)"
  if op=='bne': return f"({R(a[0])} | 0) !== ({R(a[1])} | 0)"
  if op=='beqz': return f"({R(a[0])} | 0) === 0"
  if op=='bnez': return f"({R(a[0])} | 0) !== 0"
  if op=='bgez': return f"({R(a[0])} | 0) >= 0"
  if op=='bgtz': return f"({R(a[0])} | 0) > 0"
  if op=='blez': return f"({R(a[0])} | 0) <= 0"
  if op=='bltz': return f"({R(a[0])} | 0) < 0"
  raise Exception(op)
def translate(a,name,extra=(),hooks=None,touch=False):
  hooks=hooks or {}
  ins=body(a); by={i.address:i for i in ins}
  lead={a}|set(extra)
  for i in ins:
    if i.mnemonic in BR or i.mnemonic in('j','b','jal','jr','jalr'):
      lead.add(i.address+8)
      if i.mnemonic in BR or i.mnemonic in ('j','b'): lead.add(int(i.op_str.split(',')[-1].strip(),16))
  out=[]; P=out.append
  uses_gen=any(i.mnemonic in('jal','jalr') for i in ins)
  P(f"// 0x{a:08x}, translated instruction by instruction ({len(ins)} instructions).")
  P(f"export function{'*' if uses_gen else ''} {name}(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {{")
  P("  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;")
  P("  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = " + f"0x{a:08x};")
  if touch: P("  const prevTouch = ctx.touch ? ctx.touch.menu : null; // the caller's tap rows, back on return")
  P("  for (;;) switch (pc) {")
  k=0; n=len(ins)
  while k<n:
    i=ins[k]
    if i.address in lead: P(f"  case 0x{i.address:08x}:")
    op=i.mnemonic
    if i.address in hooks: P("    "+hooks[i.address])
    if touch and op=='jr' and i.op_str=='$ra': P("    if (ctx.touch) ctx.touch.menu = prevTouch;")
    if op in BR or op in('j','b','jal','jr','jalr'):
      ds=ins[k+1]; dl=ex(ds)
      if op in BR:
        tg=int(i.op_str.split(',')[-1].strip(),16)
        P(f"    {{ const c = {cond(i)}; {dl} if (c) {{ pc = 0x{tg:08x}; continue; }} }}")
        if i.address+8 not in lead: lead.add(i.address+8)
      elif op in('j','b'):
        tg=int(i.op_str.split(',')[-1].strip(),16)
        P(f"    {dl} pc = 0x{tg:08x}; continue;")
      elif op=='jal':
        tg=int(i.op_str,16)
        P(f"    {dl} [v0, v1] = yield* call(ctx, sp, 0x{tg:08x}, a0, a1, a2, a3);")
      elif op=='jalr':
        r=R(i.op_str.split(',')[-1])
        P(f"    {{ const f = {r}; {dl} [v0, v1] = yield* call(ctx, sp, f >>> 0, a0, a1, a2, a3); }}")
      elif op=='jr':
        if i.op_str=='$ra': P(f"    {dl} return [v0, v1]; // v0, and v1 for 64-bit results (the soft-float doubles)")
        else:
          r=R(i.op_str); P(f"    {{ const t = {r}; {dl} pc = t >>> 0; continue; }}")
      k+=2
      if k<n and ins[k].address not in lead: P(f"  case 0x{ins[k].address:08x}:"); lead.add(ins[k].address)
      continue
    s=ex(i)
    if s: P("    "+s)
    k+=1
  P(f"  default: throw new Error(`{name}: no block at 0x${{(pc >>> 0).toString(16)}}`);")
  P("  }")
  P("}")
  return "\n".join(out), {int(i.op_str,16) for i in ins if i.mnemonic=='jal'}
if __name__=='__main__':
  for spec in sys.argv[1:]:
    parts=spec.split(':'); a=int(parts[0],16); name=parts[1] if len(parts)>1 else f"f{a:08x}"
    extra=[int(x,16) for x in parts[2].split('+')] if len(parts)>2 and parts[2] else []
    js,calls=translate(a,name,extra); print(js); print("// calls: "+" ".join(f"0x{c:08x}" for c in sorted(calls))); print()
def check(a):
  ins=body(a); lead=set()
  for i in ins:
    if i.mnemonic in BR or i.mnemonic in ('j','b'): lead.add(int(i.op_str.split(',')[-1].strip(),16))
  for k,i in enumerate(ins):
    if (i.mnemonic in BR or i.mnemonic in('j','b','jal','jr','jalr')) and ins[k+1].address in lead: print(f"delay-slot target {ins[k+1].address:x} in {a:x}")
  return [i for i in ins if i.mnemonic not in BR and i.mnemonic not in('j','b','jal','jr','jalr')]
