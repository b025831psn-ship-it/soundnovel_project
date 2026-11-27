import sys,os,json,subprocess,tempfile
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from cpk import utf
def elements(path):
    d=open(path,'rb').read();_,rows=utf(d);out=[]
    se=[r for r in rows if r['name']=='SOUND_ELEMENT']
    cue=[r for r in rows if r['name']=='CUE']
    cues=utf(cue[0]['utf'])[1] if cue else []
    if not se: return cues,out
    for r in utf(se[0]['utf'])[1]:
        segs=[]
        if r['data'][:4]==b'@UTF':
            tn,rr=utf(r['data'])
            segs=[(x['data'],x.get('lpflg',0)) for x in rr]
        else: segs=[(r['data'],0)]
        out.append(dict(name=r['name'],fmt=r['fmt'],nch=r['nch'],rate=r['sfreq'],nsmpl=r['nsmpl'],segs=segs))
    return cues,out
def decode(seg,tmp):
    p=os.path.join(tmp,'s.adx');open(p,'wb').write(seg)
    w=os.path.join(tmp,'s.wav')
    subprocess.run(['ffmpeg','-v','error','-y']+([] if seg[:4]==b'RIFF' else ['-f','adx'])+['-i',p,w],check=True)
    return w
def convert(path,outdir):
    cues,els=elements(path);info=[]
    with tempfile.TemporaryDirectory() as tmp:
        for i,e in enumerate(els):
            wavs=[];lens=[]
            for j,(seg,lp) in enumerate(e['segs']):
                w=decode(seg,tmp);nw=os.path.join(tmp,'%d.wav'%j);os.rename(w,nw);wavs.append(nw)
                import wave
                n=wave.open(nw).getnframes()
                lens.append((n,lp))
            base=os.path.basename(path)[:-4]+('' if len(els)==1 else '_%d'%i)
            o=os.path.join(outdir,base+'.ogg')
            lst=os.path.join(tmp,'l.txt');open(lst,'w').write(''.join("file '%s'\n"%w for w in wavs))
            subprocess.run(['ffmpeg','-v','error','-y','-f','concat','-safe','0','-i',lst,'-c:a','libvorbis','-q:a','5',o],check=True)
            loopStart=sum(n for n,lp in lens if not lp) if any(lp for n,lp in lens) else None
            info.append(dict(file=base+'.ogg',element=e['name'],rate=e['rate'],ch=e['nch'],samples=e['nsmpl'],segments=lens,loopStart=loopStart))
    return dict(cues=[{k:v for k,v in c.items() if not isinstance(v,bytes)} for c in cues],elements=info)
if __name__=='__main__':
    print(json.dumps(convert(sys.argv[1],sys.argv[2]),ensure_ascii=False,indent=1))
