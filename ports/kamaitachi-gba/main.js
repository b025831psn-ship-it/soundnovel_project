import{Screen}from'./src/screen.js';import{Assets,SceneLoader}from'./src/scene.js';import{GBAInput}from'./src/input.js';import{VM}from'./src/vm.js';
const screen=new Screen(document.querySelector('#screen')),assets=new Assets('./port-data'),scene=new SceneLoader(assets,screen),input=new GBAInput();
const vm=new VM({scene});window.kamaitachi={vm,screen,assets,input};let last=0,acc=0;function loop(now){acc+=Math.min(100,now-last);last=now;while(acc>=1000/60){vm.vblank();acc-=1000/60}requestAnimationFrame(loop)}requestAnimationFrame(t=>{last=t;requestAnimationFrame(loop)});
