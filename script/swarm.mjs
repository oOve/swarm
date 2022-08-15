/*
▓█████▄  ██▀███           ▒█████  
▒██▀ ██▌▓██ ▒ ██▒        ▒██▒  ██▒
░██   █▌▓██ ░▄█ ▒        ▒██░  ██▒
░▓█▄   ▌▒██▀▀█▄          ▒██   ██░
░▒████▓ ░██▓ ▒██▒ ██▓    ░ ████▓▒░
 ▒▒▓  ▒ ░ ▒▓ ░▒▓░ ▒▓▒    ░ ▒░▒░▒░ 
 ░ ▒  ▒   ░▒ ░ ▒░ ░▒       ░ ▒ ▒░ 
 ░ ░  ░   ░░   ░  ░      ░ ░ ░ ▒  
   ░       ░       ░         ░ ░  
 ░                 ░              
 */
 const MOD_NAME = "swarm";
 const SIGMA = 5;
 import * as utils from "./utils.mjs"

function Lang(k){
   return game.i18n.localize("DESTRUCTIBLES."+k);
 }
 
 

 export default class Swarm{
    constructor( token, number ){
        this.token = token;
        let size = token.size
        this.sprites = [];
        this.dest = [];
        for(let i=0;i<number;++i){
            let s = PIXI.Sprite.from(token.img);
            s.anchor.set(.5);
            s.x = token.x;
            s.y = token.y;
            this.dest.push({x:token.x, y:token.y});
            this.sprites.push();
            canvas.foreground.addChild(s);
        }
        this.tick = new PIXI.Ticker();
        this.tick.add( this.refresh.bind(this) );
        this.tick.start();
    }   
      
    destroy(){
        for (let s of this.sprites){
            s.destroy();
        }
        this.tick.destroy();        
    }
  
    refresh(ms){
        for (let i=0; i<this.sprites.length;++i){
            let s = this.sprites[i];
            let p1 = {x:s.x, y:s.y};
            let p2 = this.dest[i];            
            let d = utils.vSub(p2-p1);
            let dist2 = d.x**2+d.y**2;
            if (dist2 < SIGMA){

            }
        }
    }
  }
  



 
 Hooks.once("canvasReady", ()=> {
    // Scene loaded.

 });
 
 
 // Settings:
 Hooks.once("init", () => {
    /*
    game.settings.register(MOD_NAME, SUPPRESS_OVERLAY, {
        name: "Suppress Overlay Icons",
        hint: "Prevent overlay icons on all Destructibles",
        scope: 'world',
        config: true,
        type: Boolean,
        default: false
   });
   */ 
 });
 
 
 
 // Hook into the token config render
 Hooks.on("renderTokenConfig", (app, html) => {

 
   // Add the form group to the bottom of the Identity tab
   //html[0].querySelector("div[data-tab='appearance']").append(formGroup);
   //html[0].querySelector('footer button').addEventListener("click", onSubmitHook.bind({app:app, html:html}));
   //let update_token_button = html[0].querySelector('footer>button:not(.assign-token)');
   //update_token_button.addEventListener("click", onSubmitHook.bind({app:app, html:html}));
 
   // Set the apps height correctly
   //app.setPosition();
 });
 
 