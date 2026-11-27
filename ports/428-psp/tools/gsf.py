import struct,collections
G=open('gsffont.gsf','rb').read();H=open('gsffont.has','rb').read()
def recs():
    out=[]
    for o in range(4096,len(H)-5,6):
        b0,b1,code,gi=H[o],H[o+1],*struct.unpack('>HH',H[o+2:o+6])
        out.append(dict(last=b0>>7,font=(b0>>3)&15,size=((b0<<8)|b1)&0x7ff,code=code,glyph=gi))
    return out
def glyph(gi):
    off=(G[gi*4]|G[gi*4+1]<<8|G[gi*4+2]<<16)<<5
    h=G[off:off+0x28];w,hh=struct.unpack('>HH',h[0x24:0x28])
    return off,h,w,hh
def decode(gi):
    off,h,w,hh=glyph(gi);p=off+0x28;idx=0;run=0;val=0;img=[]
    def nib():
        nonlocal idx
        b=G[p+idx//2];v=(b>>4) if idx%2==0 else (b&15);idx+=1;return v
    for y in range(hh):
        row=[]
        for x in range(w):
            if run==0:
                val=nib();run=1
                if val==15: val=nib();run=nib()+4
            row.append(val);run-=1
        img.append(row)
    return w,hh,img,h
if __name__=='__main__':
    r=recs();print(len(r))
    print(collections.Counter((x['font'],x['size']) for x in r).most_common(20))
    print(r[:3])
