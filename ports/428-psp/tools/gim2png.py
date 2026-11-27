import struct,sys,os
import numpy as np
from PIL import Image
def blocks(d):
    # flat walk: root(2)->picture(3)->image(4)/palette(5)
    res=[];stack=[(16,len(d))]
    while stack:
        off,end=stack.pop()
        while off<end:
            bid,_,size,nxt,doff=struct.unpack('<HHIII',d[off:off+16])
            if bid in(2,3): stack.append((off+doff,off+size))
            elif bid in(4,5): res.append((bid,off+doff))
            if nxt==0: break
            off+=nxt
    return res
def c565(c):
    r=((c>>11)&31)*255//31; g=((c>>5)&63)*255//63; b=(c&31)*255//31
    return r,g,b
def hdr(d,o):
    hs,ref,fmt,order,w,h,bpp,pa,ha=struct.unpack('<9H',d[o:o+18])
    ps=struct.unpack('<I',d[o+0x1c:o+0x20])[0]
    return fmt,order,w,h,bpp,pa,ha,o+ps
def unswizzle(buf,w_bytes,h):
    out=bytearray(len(buf));rowblocks=w_bytes//16;i=0
    for by in range(0,h,8):
        for bx in range(rowblocks):
            for y in range(8):
                if by+y>=h: i+=16;continue
                o=(by+y)*w_bytes+bx*16
                out[o:o+16]=buf[i:i+16];i+=16
    return bytes(out)
def dxt(data,w,h,fmt):
    bw,bh=(w+3)//4,(h+3)//4;bs=8 if fmt==8 else 16;n=bw*bh
    b=np.frombuffer(data[:n*bs],np.uint8).reshape(n,bs)
    idx=b[:,0:4].copy().view('<u4')[:,0].astype(np.uint32)
    c0=b[:,4:6].copy().view('<u2')[:,0].astype(np.int32);c1=b[:,6:8].copy().view('<u2')[:,0].astype(np.int32)
    def rgb(c): return np.stack([((c>>11)&31)*255//31,((c>>5)&63)*255//63,(c&31)*255//31],-1)
    A=rgb(c0);B=rgb(c1)
    three=(fmt==8)&(c0<=c1)
    p2=np.where(three[:,None],(A+B)//2,(2*A+B)//3);p3=np.where(three[:,None],0,(A+2*B)//3)
    pal=np.stack([A,B,p2,p3],1)  # n,4,3
    k=np.arange(16);ci=(idx[:,None]>>(2*k))&3  # n,16
    col=np.take_along_axis(pal,ci[:,:,None].astype(np.int64),1)  # n,16,3
    if fmt==8: al=np.where(three[:,None]&(ci==3),0,255)
    elif fmt==9:
        ai=b[:,8:16].copy().view('<u8')[:,0];al=((ai[:,None]>>(4*k.astype(np.uint64)))&15).astype(np.int32)*17
    else:
        a0=b[:,14].astype(np.int32);a1=b[:,15].astype(np.int32)
        ai=np.zeros(n,np.uint64)
        for j in range(6): ai|=b[:,8+j].astype(np.uint64)<<np.uint64(8*j)
        jj=np.arange(1,7)
        big=np.concatenate([a0[:,None],a1[:,None],((7-jj)*a0[:,None]+jj*a1[:,None])//7],1)
        jj5=np.arange(1,5)
        small=np.concatenate([a0[:,None],a1[:,None],((5-jj5)*a0[:,None]+jj5*a1[:,None])//5,np.zeros((n,1),int),np.full((n,1),255)],1)
        ap=np.where((a0>a1)[:,None],big,small)
        aidx=((ai[:,None]>>(np.uint64(3)*k.astype(np.uint64)))&np.uint64(7)).astype(np.int64)
        al=np.take_along_axis(ap,aidx,1)
    img=np.concatenate([col,al[:,:,None]],2).astype(np.uint8).reshape(bh,bw,4,4,4).transpose(0,2,1,3,4).reshape(bh*4,bw*4,4)
    return img[:h,:w]
def convert(path,out):
    d=open(path,'rb').read();bl=blocks(d)
    imgs=[o for b,o in bl if b==4];pals=[o for b,o in bl if b==5]
    if not imgs: return None
    fmt,order,w,h,bpp,pa,ha,ps=hdr(d,imgs[0])
    if fmt in(8,9,10):
        bs=8 if fmt==8 else 16;n=((w+3)//4)*((h+3)//4)*bs
        im=dxt(d[ps:ps+n],w,h,fmt)
    elif fmt in(4,5,3):
        wb=((w*bpp//8)+pa-1)//pa*pa if pa else w*bpp//8; hh=(h+ha-1)//ha*ha if ha else h
        raw=d[ps:ps+wb*hh]
        if order==1: raw=unswizzle(raw,wb,hh)
        a=np.frombuffer(raw,np.uint8).reshape(hh,wb)
        if fmt==3: im=a[:h,:w*4].reshape(h,w,4).copy()
        else:
            if fmt==4: ix=np.stack([a&15,a>>4],-1).reshape(hh,wb*2)[:h,:w]
            else: ix=a[:h,:w]
            pf,po,pw,_,pb,_,_,pps=hdr(d,pals[0])
            assert pf==3
            pal=np.frombuffer(d[pps:pps+pw*4],np.uint8).reshape(pw,4)
            im=pal[ix]
    else: raise Exception('fmt %d'%fmt)
    Image.fromarray(im,'RGBA').save(out)
    return (fmt,w,h)
if __name__=='__main__':
    import json
    if sys.argv[1]=='-all':
        src,dst=sys.argv[2],sys.argv[3];log={}
        for root,_,fs in os.walk(src):
            for f in fs:
                if not f.endswith('.gim'):continue
                p=os.path.join(root,f);rel=os.path.relpath(p,src);o=os.path.join(dst,rel[:-4]+'.png')
                os.makedirs(os.path.dirname(o),exist_ok=True)
                try: log[rel]=convert(p,o)
                except Exception as e: log[rel]='ERR '+repr(e)
        json.dump(log,open(os.path.join(dst,'gim-log.json'),'w'),indent=0)
        print(len(log),sum(1 for v in log.values() if isinstance(v,str)),sum(1 for v in log.values() if v is None))
    else: print(convert(sys.argv[1],sys.argv[2]))
