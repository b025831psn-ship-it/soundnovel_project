const HANDLERS = {
  0x01:'080036A8',0x02:'08003724',0x03:'080037BC',0x04:'08003930',
  0x0d:'08003CF0',0x0e:'08003DF0',0x0f:'08003E58',0x13:'080040A0',
  0x1a:'08003D30',0x21:'08003D70',0x22:'08003DB0',0x23:'080046D4',
  0x25:'08003F30',0x40:'080051B4',0x41:'08005264',0x56:'08005B1C',
  0x57:'08005BA8',0x5e:'08005DE0'
};
const widths={1:2,2:2,3:0,4:2,0x0d:1,0x0e:3,0x0f:3,0x13:3,0x1a:1,0x21:1,0x22:1,0x23:2,0x25:3,0x40:4,0x41:2,0x56:4,0x57:4,0x5e:5};
export class VM {
  constructor({banks={},bank=0,offset=0,scene=null,trace=null}={}) {
    this.banks=banks; this.bank=bank; this.offset=offset; this.scene=scene; this.trace=trace;
    this.frame=0; this.halted=false; this.waiting=false; this.unimplemented=new Set();
    this.ram={flags0d:new Uint8Array(256),flags1a:new Uint8Array(256),vars40:new Uint16Array(256),vars41:new Uint8Array(256),bits:new Uint8Array(0x4000),stack:[],group:0,slot:0xffff,pending:0};
  }
  u16(p){const b=this.banks[this.bank]; return (b[p]<<8)|b[p+1]}
  log(op,args){this.trace?.({frame:this.frame,bank:this.bank,offset:this.offset,opcode:op,args:[...args],group:this.ram.group,slot:this.ram.slot,pending:this.ram.pending})}
  step(){
    if(this.halted||this.waiting)return false; const b=this.banks[this.bank]; if(!b||this.offset>=b.length){this.halted=true;return false}
    const at=this.offset,op=b[at],n=widths[op]; if(n===undefined){this.unimplemented.add(op);this.halted=true;return false}
    const a=b.slice(at+1,at+1+n); this.log(op,a); this.offset+=1+n;
    switch(op){
      case 0x01:this.ram.stack.push({bank:this.bank,offset:this.offset});this.offset=(a[0]<<8)|a[1];break; // 080036A8 call
      case 0x02:this.offset=(a[0]<<8)|a[1];break; // 08003724 jump
      case 0x03:{const r=this.ram.stack.pop();if(r)Object.assign(this,r);else this.halted=true;break} // 080037BC return
      case 0x04:this.scene?.request((a[0]<<8)|a[1],this.ram);break; // 08003930 BG request
      case 0x0d:this.ram.flags0d[a[0]]=1;break; case 0x1a:this.ram.flags1a[a[0]]=1;break;
      case 0x0e:if(this.ram.flags0d[a[0]])this.offset=(a[1]<<8)|a[2];break;
      case 0x0f:if(!this.ram.flags0d[a[0]])this.offset=(a[1]<<8)|a[2];break;
      case 0x21:this.ram.bits[a[0]]|=1;break; case 0x22:this.ram.bits[a[0]]&=0xfe;break;
      case 0x23:this.ram.group=(31-a[0])>>3;this.ram.vars41[a[1]]=this.ram.group;break;
      case 0x25:if(!this.ram.bits[a[0]])this.offset=(a[1]<<8)|a[2];break;
      case 0x40:this.ram.vars40[a[0]]=(a[2]<<8)|a[3];break; case 0x41:this.ram.vars41[a[0]]=a[1];break;
      case 0x13:case 0x56:case 0x57:case 0x5e:break; // decoded, effect hooks follow after trace parity
    } return true;
  }
  vblank(budget=1024){this.frame++;for(let i=0;i<budget&&this.step();i++);}
}
export {HANDLERS};
