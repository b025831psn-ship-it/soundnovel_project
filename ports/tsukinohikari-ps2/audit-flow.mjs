import fs from 'node:fs';
import {Scenario} from './scenario.mjs';
import assert from 'node:assert/strict';
const folder=process.argv[2];let checked=0;
for(const file of fs.readdirSync(folder).filter(f=>/^S\d\d\.json$/.test(f))){
 const rows=JSON.parse(fs.readFileSync(folder+'/'+file,'utf8'));
 for(const row of rows) for(const [index,item] of row.items.entries()){
   if(item.opcode!==4 && item.opcode!==5) continue;
   const game=new Scenario(rows);
   game.state.page=row.page;
   game.state.item=index;
   const bytes=Uint8Array.from(item.args.match(/../g), x=>parseInt(x,16));
   if(item.opcode===4){
     game.state.item++;
     const event=game.branch(bytes,row.items);
     if(event?.kind==='choice'){
       for(let i=0;i<event.options.length;i++){
         const resumed=new Scenario(rows,game.state);
         resumed.choose(i);
         assert.equal(resumed.state.page,event.options[i].target);
       }
     }
   } else game.next();
   checked++;
 }
}
console.log(checked);
