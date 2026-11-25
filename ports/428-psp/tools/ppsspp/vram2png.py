import sys,struct
from PIL import Image
d=open(sys.argv[1],'rb').read(); out=sys.argv[2]; fmt=sys.argv[3] if len(sys.argv)>3 else '5551'
ims=[]
for off in (0,0x44000):
  im=Image.new('RGB',(480,272));px=im.load()
  for y in range(272):
    row=struct.unpack_from('<512H',d,off+y*1024)
    for x in range(480):
      v=row[x]
      px[x,y]=((v&31)<<3,((v>>5)&31)<<3,((v>>10)&31)<<3) if fmt=='5551' else ((v&31)<<3,((v>>5)&63)<<2,((v>>11)&31)<<3)
  ims.append(im)
W=Image.new('RGB',(960,272)); W.paste(ims[0],(0,0)); W.paste(ims[1],(480,0)); W.save(out)
