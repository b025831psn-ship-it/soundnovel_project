import sys,os,struct,subprocess,tempfile,glob
def demux_audio(d):
    i=0x800;out=bytearray();n=len(d)
    while i<n-6:
        if d[i:i+3]!=b'\x00\x00\x01': i+=1;continue
        sid=d[i+3]
        if sid==0xba:
            i+=14+(d[i+13]&7);continue
        ln=struct.unpack('>H',d[i+4:i+6])[0]
        if sid==0xbd:
            hl=d[i+8];p=i+9+hl;end=i+6+ln
            if d[p]==0x00: out+=d[p+4:end]
        i+=6+ln
    return bytes(out)
def frames(a):
    fr=[];i=0
    while i+8<=len(a):
        if a[i:i+2]!=b'\x0f\xd0': raise Exception('sync %x'%i)
        sz=(((a[i+2]&3)<<8)|a[i+3])*8+8
        fr.append(a[i+8:i+8+sz]);i+=8+sz
    return fr,sz,a[2]
def riff(fr,bs,tmpl,b2=0x28):
    t=open(tmpl,'rb').read();i=12;fmt=None
    while i<len(t):
        cid=t[i:i+4];sz=struct.unpack('<I',t[i+4:i+8])[0]
        if cid==b'fmt ': fmt=bytearray(t[i+8:i+8+sz])
        if cid==b'data':break
        i+=8+sz+(sz&1)
    struct.pack_into('<H',fmt,12,bs)  # block align
    ch=(b2>>2)&7
    if ch==1:
        struct.pack_into('<H',fmt,2,1);struct.pack_into('<I',fmt,20,4);fmt[0x2a]=b2;fmt[0x2b]=fmt[0x2b]
    data=b''.join(fr)
    body=b'WAVE'+b'fmt '+struct.pack('<I',len(fmt))+bytes(fmt)+b'data'+struct.pack('<I',len(data))+data
    return b'RIFF'+struct.pack('<I',len(body))+body
def convert(p,o,tmpl):
    d=open(p,'rb').read()
    with tempfile.TemporaryDirectory() as tmp:
        v=os.path.join(tmp,'v.mps');open(v,'wb').write(d[0x800:])
        a=demux_audio(d);args=['ffmpeg','-v','error','-y','-fflags','+genpts','-i',v]
        has=False
        if a:
            fr,bs,b2=frames(a);w=os.path.join(tmp,'a.at3');open(w,'wb').write(riff(fr,bs,tmpl,b2));wv=os.path.join(tmp,'a.wav');subprocess.run(['ffmpeg','-v','error','-y','-i',w,'-f','wav',wv],check=True);args+=['-i',wv];has=True
        args+=['-map','0:v']+(['-map','1:a','-c:a','aac','-b:a','160k'] if has else [])+['-c:v','copy','-movflags','+faststart',o]
        subprocess.run(args,check=True)
    return has
if __name__=='__main__':
    import json
    if sys.argv[1]=='-all':
        src,dst,tmpl=sys.argv[2:5];lp=os.path.join(dst,'pmf-log.json');log=json.load(open(lp)) if os.path.exists(lp) else {}
        import time;t0=time.time()
        for root,_,fs in os.walk(src):
            for f in sorted(fs):
                if not f.endswith('.pmf'):continue
                p=os.path.join(root,f);rel=os.path.relpath(p,src)
                if rel in log and not isinstance(log[rel],str): continue
                if time.time()-t0>160: break
                o=os.path.join(dst,rel[:-4]+'.mp4');os.makedirs(os.path.dirname(o),exist_ok=True)
                try: log[rel]=convert(p,o,tmpl)
                except Exception as e: log[rel]='ERR '+repr(e)
        os.makedirs(dst,exist_ok=True);json.dump(log,open(lp,'w'),indent=0)
        print(len(log),sum(1 for v in log.values() if isinstance(v,str)))
    else: print(convert(sys.argv[1],sys.argv[2],sys.argv[3]))
