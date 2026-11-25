import os,sys,json,struct,subprocess
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
import csb2ogg
src,dst=sys.argv[1],sys.argv[2]
lp=os.path.join(dst,'audio-log.json')
log=json.load(open(lp)) if os.path.exists(lp) else {}
import time;t0=time.time()
def at3info(p):
    d=open(p,'rb').read(8192);i=12;r={}
    while i<len(d)-8:
        cid=d[i:i+4];sz=struct.unpack('<I',d[i+4:i+8])[0];b=d[i+8:i+8+sz]
        if cid==b'fact': r['fact']=list(struct.unpack('<%dI'%(sz//4),b))
        if cid==b'smpl':
            n=struct.unpack('<I',b[28:32])[0]
            if n: r['loop']=list(struct.unpack('<II',b[36+8:36+16]))
        if cid==b'data':break
        i+=8+sz+(sz&1)
    return r
for root,_,fs in os.walk(src):
    for f in sorted(fs):
        p=os.path.join(root,f);rel=os.path.relpath(p,src)
        if rel in log and not isinstance(log[rel],str): continue
        if time.time()-t0>140: break
        od=os.path.join(dst,os.path.dirname(rel));os.makedirs(od,exist_ok=True)
        try:
            if f.endswith('.at3'):
                o=os.path.join(od,f[:-4]+'.ogg')
                if not os.path.exists(o): subprocess.run(['ffmpeg','-v','error','-y','-i',p,'-c:a','libvorbis','-q:a','6',o],check=True)
                log[rel]=at3info(p)
            elif f.endswith('.csb'):
                log[rel]=csb2ogg.convert(p,od)
        except Exception as e: log[rel]='ERR '+repr(e)
        if len(log)%20==0: json.dump(log,open(lp,'w'),ensure_ascii=False)
os.makedirs(dst,exist_ok=True);json.dump(log,open(lp,'w'),ensure_ascii=False,indent=0)
print(len(log),sum(1 for v in log.values() if isinstance(v,str)))
