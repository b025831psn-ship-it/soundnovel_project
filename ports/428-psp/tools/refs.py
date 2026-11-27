import re,sys
L=open('eboot.asm').read().splitlines()
lui={}
targets=[int(x,16) for x in sys.argv[1:]]
for i,l in enumerate(L):
    m=re.search(r'lui\t\$(\d+), (0x[0-9a-f]+)',l)
    if m: lui[m.group(1)]=(int(m.group(2),16),i); continue
    m=re.search(r'(addiu|lw|lbu|lh|lhu|sw|lb|ori)\t\$(\d+), (?:\$(\d+), )?(-?0x[0-9a-f]+|-?\d+)(?:\(\$(\d+)\))?',l)
    if m:
        base=m.group(3) or m.group(5)
        if base in lui and i-lui[base][1]<40:
            hi=lui[base][0]
            v=(hi<<16)+(int(m.group(4),0) if m.group(1)!='ori' else int(m.group(4),0))
            v&=0xffffffff
            for t in targets:
                if t<=v<t+4 if len(sys.argv)>2 else v==t: print(hex(t),l.strip())
