import sys,struct
f=open(sys.argv[1],'rb')
def rd(lba,n):
    f.seek(lba*2048); return f.read(n)
pvd=rd(16,2048)
print('vol',pvd[40:72].decode('ascii','replace').strip(),'sys',pvd[8:40].decode().strip(),'date',pvd[813:830])
root=pvd[156:190]
out=[]
def walk(rec,path):
    lba=struct.unpack('<I',rec[2:6])[0]; size=struct.unpack('<I',rec[10:14])[0]
    data=rd(lba,size); i=0
    while i<len(data):
        l=data[i]
        if l==0:
            i=(i//2048+1)*2048; continue
        r=data[i:i+l]; nl=r[32]; name=r[33:33+nl]
        flags=r[25]; elba=struct.unpack('<I',r[2:6])[0]; esz=struct.unpack('<I',r[10:14])[0]
        if name not in (b'\x00',b'\x01'):
            n=name.decode('ascii','replace').split(';')[0]
            p=path+'/'+n
            if flags&2: walk(r,p)
            else: out.append((p,elba,esz))
        i+=l
walk(root,'')
for p,l,s in out: print(f'{l:8d} {s:11d} {p}')
