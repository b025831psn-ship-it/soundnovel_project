import struct,collections,sys
import sys
d=open(sys.argv[2] if len(sys.argv)>2 else "to.sns","rb").read()
n=struct.unpack('<I',d[0x100:0x104])[0]
NOLEN={0x02,0x1c,0x1d}
stats=collections.Counter();lens=collections.defaultdict(collections.Counter)
def walk(si,verbose=False):
    a,sz=struct.unpack('<II',d[0x104+si*8:0x10c+si*8])
    f=d[a:a+sz];name=f[4:0x104].split(b'\0')[0].decode()
    hdr=struct.unpack('<5I',f[0x420:0x434]);p=hdr[4];end=len(f)
    out=[]
    while p<end:
        op=f[p]
        if op==0x01:
            q=f.index(b'\x02',p+1)
            out.append((p,op,f[p+1:q].decode('cp932','replace')));p=q;stats[op]+=1;continue
        if op in NOLEN:
            out.append((p,op,b''));p+=1;stats[op]+=1;continue
        if p+1>=end: break
        ln=f[p+1]
        out.append((p,op,f[p+2:p+2+ln]));stats[op]+=1;lens[op][ln]+=1;p+=2+ln
    return name,hdr,out,p,end
for si in range(n):
    name,hdr,out,p,end=walk(si)
    print(si,name,[hex(x) for x in hdr],len(out),'end ok' if p==end else 'END MISMATCH %x %x'%(p,end))
print(sorted((hex(k),v) for k,v in stats.items()))

if __name__=='__main__' and len(sys.argv)>1:
    import json
    o=open(sys.argv[1],'w',encoding='utf-8')
    for si in range(n):
        name,hdr,out,p,end=walk(si)
        o.write('### script %d %s hdr=%s\n'%(si,name,[hex(x) for x in hdr]))
        for (pos,op,arg) in out:
            if isinstance(arg,str): o.write('%06x 01 "%s"\n'%(pos,arg))
            elif op==0x56: o.write('%06x 56 LABEL %s\n'%(pos,arg[1:].split(b'\0')[0].decode()))
            else: o.write('%06x %02x %s\n'%(pos,op,arg.hex(' ')))
