export class SceneLoader {
  constructor(assets,screen){this.assets=assets;this.screen=screen}
  resolve(request){let variant=Math.floor(request/1000),image=request%1000;if(image===200&&variant){image=201;variant--}return{image,variant}}
  async request(argument,ram){const request=argument+1000*ram.group;if((ram.slot===0x61&&argument===0x4e)||(ram.slot===0x63&&(argument===0x51||argument===0x54))){ram.pending=request;return}await this.load(request)}
  async load(request){const {image,variant}=this.resolve(request),[tiles,palette]=await Promise.all([this.assets.bin(`bg/${String(image).padStart(3,'0')}.bin`),this.assets.bin(`palette/${String(image).padStart(3,'0')}.bin`)]);this.screen.setBackground(tiles,palette,variant)}
}
export class Assets {constructor(base='port-data'){this.base=base.replace(/\/$/,'')}async bin(path){const r=await fetch(`${this.base}/${path}`);if(!r.ok)throw new Error(`${r.status} ${path}`);return new Uint8Array(await r.arrayBuffer())}}
