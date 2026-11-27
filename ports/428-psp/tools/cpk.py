import sys,struct,os,subprocess,json
TY={0:'>B',1:'>b',2:'>H',3:'>h',4:'>I',5:'>i',6:'>Q',7:'>q',8:'>f'}
def utf(buf):
    assert buf[:4]==b'@UTF',buf[:4]
    b=8
    rows_off=struct.unpack('>H',buf[10:12])[0]; str_off,data_off,name_off=struct.unpack('>III',buf[12:24])
    ncol,rowlen,nrow=struct.unpack('>HHI',buf[24:32])
    def s(o):
        o+=b+str_off; e=buf.index(b'\0',o); return buf[o:e].decode('cp932','replace')
    cols=[];p=32
    for i in range(ncol):
        fl=buf[p];no=struct.unpack('>I',buf[p+1:p+5])[0];p+=5
        st=fl&0xf0;ty=fl&0x0f;const=None
        if st in(0x30,0x70):
            const,p=val(buf,p,ty,s,b+data_off)
        cols.append((s(no),st,ty,const))
    rows=[];p=b+rows_off
    for r in range(nrow):
        row={}
        for name,st,ty,const in cols:
            if st==0x50: row[name],p=val(buf,p,ty,s,b+data_off)
            elif st in(0x30,0x70): row[name]=const
            else: row[name]=None
        rows.append(row)
    return s(name_off),rows
def val(buf,p,ty,s,dbase):
    if ty in TY:
        f=TY[ty];n=struct.calcsize(f);return struct.unpack(f,buf[p:p+n])[0],p+n
    if ty==0xa: return s(struct.unpack('>I',buf[p:p+4])[0]),p+4
    if ty==0xb:
        o,n=struct.unpack('>II',buf[p:p+8]);return buf[dbase+o:dbase+o+n],p+8
    raise Exception('type %x'%ty)
def chunk(f,off):
    f.seek(off);h=f.read(16);n=struct.unpack('<Q',h[8:16])[0]
    return h[:4],f.read(n)
def main(path,outdir=None,listonly=False):
    f=open(path,'rb')
    tag,body=chunk(f,0);_,hdr=utf(body);hdr=hdr[0]
    co=hdr.get('ContentOffset');to=hdr.get('TocOffset');io=hdr.get('ItocOffset')
    files=[]
    if to:
        _,b=chunk(f,to);_,toc=utf(b)
        add=min(x for x in (co,to) if x)
        for r in toc:
            files.append(dict(name=(r['DirName']+'/' if r.get('DirName') else '')+r['FileName'],off=r['FileOffset']+add,size=r['FileSize'],xsize=r['ExtractSize'],id=r.get('ID')))
    elif io:
        _,b=chunk(f,io);_,it=utf(b);it=it[0];al=hdr['Align']
        ents={}
        for k in('DataL','DataH'):
            if it.get(k):
                _,rs=utf(it[k])
                for r in rs: ents[r['ID']]=(r['FileSize'],r['ExtractSize'])
        off=co
        for i in sorted(ents):
            sz,xs=ents[i];files.append(dict(name='%05d.bin'%i,off=off,size=sz,xsize=xs,id=i))
            off+=sz;off=(off+al-1)//al*al
    if listonly:
        print(json.dumps({k:(v if not isinstance(v,bytes) else len(v)) for k,v in hdr.items()},ensure_ascii=False))
        for x in files: print(x['id'],x['off'],x['size'],x['xsize'],x['name'])
        return files
    for x in files:
        p=os.path.join(outdir,x['name']);os.makedirs(os.path.dirname(p),exist_ok=True)
        f.seek(x['off']);d=f.read(x['size'])
        if d[:8]==b'CRILAYLA':
            open(p+'.lz','wb').write(d);subprocess.check_call([os.path.dirname(os.path.abspath(__file__))+'/crilayla',p+'.lz',p]);os.remove(p+'.lz')
        else: open(p,'wb').write(d)
    return files
if __name__=='__main__':
    if sys.argv[2]=='-l': main(sys.argv[1],listonly=True)
    else: main(sys.argv[1],sys.argv[2])
