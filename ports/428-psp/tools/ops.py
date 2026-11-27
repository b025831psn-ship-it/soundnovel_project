import re,struct
L=open('eboot.asm').read().splitlines()
idx={}
for i,l in enumerate(L):
    m=re.match(r'\s*([0-9a-f]+):',l)
    if m: idx[int(m.group(1),16)]=i
d=open('EBOOT.BIN.dec','rb').read();base=0x8804000-0x54
names={0x887c510:'RD',0x887c610:'SKIP',0x887c638:'SKIP1',0x887c670:'STR',0x887c660:'TELL',0x887c668:'SEEK',0x887ae44:'ctx'}
def body(a,maxn=400):
    i=idx[a];out=[];regs={}
    for k in range(maxn):
        l=L[i+k]
        m=re.search(r'addiu\t\$(\d+), \$zero, (-?0x[0-9a-f]+|-?\d+)',l)
        if m: regs[m.group(1)]=int(m.group(2),0)
        m=re.search(r'move\t\$(\d+), \$zero',l)
        if m: regs[m.group(1)]=0
        m=re.search(r'jal\t0x([0-9a-f]+)',l)
        if m:
            t=int(m.group(1),16)
            # delay slot
            l2=L[i+k+1];m2=re.search(r'addiu\t\$5, \$zero, (-?0x[0-9a-f]+|-?\d+)',l2)
            v=int(m2.group(1),0) if m2 else regs.get('5')
            out.append(names.get(t,hex(t))+('(%s)'%v if t in(0x887c510,0x887c610) else ''))
        if re.search(r'\tjr\t\$ra',l): break
    return out
for op in range(193):
    h=struct.unpack('<I',d[0x89c090c+op*8-base:0x89c090c+op*8-base+4])[0]
    print('%02x %x'%(op,h),' '.join(body(h))[:300])
