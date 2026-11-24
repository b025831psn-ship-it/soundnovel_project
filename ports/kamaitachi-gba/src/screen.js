export class Screen {
  constructor(canvas){this.canvas=canvas;canvas.width=240;canvas.height=160;this.ctx=canvas.getContext('2d');this.image=this.ctx.createImageData(240,160)}
  setBackground(tiles,pal,variant=0){const factor=[15,13,11,6][variant]??15,colors=[];for(let i=0;i<256;i++){let c=pal[2*i]|pal[2*i+1]<<8;if(i<236&&c&0x7fff){const f=x=>Math.floor(x*factor/15);c=f(c&31)|(f(c>>5&31)<<5)|(f(c>>10&31)<<10)}colors.push([c&31,c>>5&31,c>>10&31])}for(let y=0;y<160;y++)for(let x=0;x<240;x++){const tx=x>>3,ty=y>>3,p=(ty*30+tx)*64+(y&7)*8+(x&7),c=colors[tiles[p]],q=4*(y*240+x);this.image.data[q]=c[0]*255/31;this.image.data[q+1]=c[1]*255/31;this.image.data[q+2]=c[2]*255/31;this.image.data[q+3]=255}this.ctx.putImageData(this.image,0,0)}
}
