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
 const SWARM_FLAG = "isSwarm";
 const SWARM_SIZE_FLAG = "swarmSize";
 const SIGMA = 5;
 import * as utils from "./utils.mjs"

function Lang(k){
   return game.i18n.localize("DESTRUCTIBLES."+k);
 }
 
 let SWARMS = [];

 export default class Swarm{
    constructor( token, number ){
        this.token = token;
        let size = token.size
        this.sprites = [];
        this.dest = [];
        this.speeds = [];
        for(let i=0;i<number;++i){
            let s = PIXI.Sprite.from(token.texture.baseTexture);
            s.anchor.set(.5);
            s.x = token.x;
            s.y = token.y;
            let ratio = s.width/s.height;
            s.width = 0.25 * token.data.width * token.data.scale * canvas.grid.size * ratio;
            s.height= 0.25 * token.data.height * token.data.scale * canvas.grid.size;
            this.dest.push({x:token.x, y:token.y});
            this.sprites.push(s);
            this.speeds.push( 0.4 + Math.random()*0.5 )
            canvas.background.addChild(s);
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
            let d = utils.vSub(p2, p1);
            let dist2 = d.x**2+d.y**2;
            if (dist2 < SIGMA){
                let x = this.token.x + Math.random() * this.token.data.width  * canvas.grid.size;
                let y = this.token.y + Math.random() * this.token.data.height * canvas.grid.size;
                p2 = {x:x,y:y};
                d = utils.vSub(p2,p1);
                this.dest[i] = p2;
            }
            d = utils.vNorm(d);
            s.x += ms * this.speeds[i] * Math.PI * d.x;
            s.y += ms * this.speeds[i] * Math.PI * d.y;
            s.rotation = Math.PI/2. + utils.vRad(d);
        }
    }
  }
  



 
 Hooks.once("canvasReady", ()=> {
    // Scene loaded.
    let swarm = canvas.tokens.placeables.filter( (t)=>{return t.document.getFlag(MOD_NAME,SWARM_FLAG);} ) 

    for (let s of swarm){
        SWARMS.push(new Swarm(s, s.document.getFlag(MOD_NAME, SWARM_SIZE_FLAG)));
    }

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
 
 
 
function createLabel(text){
  const label = document.createElement('label');
  label.textContent = text;
  return label;
}

function textBoxConfig(parent, app, flag_name, title, type="number",
                       placeholder=null, default_value=null, step=null)
{ 
  let flags = app.token.flags;
  if (flags === undefined) flags = app.token.data.flags;

  parent.append(createLabel(title));
  const input = document.createElement('input');
  input.name = 'flags.'+MOD_NAME+'.'+flag_name;
  input.type = type;  
  if(step) input.step = step;
  if(placeholder) input.placeholder = placeholder;

  if(flags?.[MOD_NAME]?.[flag_name]){
    input.value=flags?.[MOD_NAME]?.[flag_name];
  }
  else if(default_value!=null){
    input.value = default_value;
  }
  parent.append(input);
}

 
 function createCheckBox(app, fields, data_name, title, hint){  
    const label = document.createElement('label');
    label.textContent = title; 
    const input = document.createElement("input");
    input.name = 'flags.'+MOD_NAME+'.' + data_name;
    input.type = "checkbox";
    input.title = hint;
    
    if (app.token.getFlag(MOD_NAME, data_name)){
      input.checked = "true";
    }
  
    fields.append(label);
    fields.append(input);
  }
  
  
  // Hook into the token config render
  Hooks.on("renderTokenConfig", (app, html) => {
    if (!game.user.isGM) return;
  
    // Create a new form group
    const formGroup = document.createElement("div");
    formGroup.classList.add("form-group");
    formGroup.classList.add("slim");
  
    // Create a label for this setting
    const label = document.createElement("label");
    label.textContent = "Swarm";
    formGroup.prepend(label);
  
    // Create a form fields container
    const formFields = document.createElement("div");
    formFields.classList.add("form-fields");
    formGroup.append(formFields);
  
    createCheckBox(app, formFields, SWARM_FLAG, "Swarm", '');
    textBoxConfig(formFields, app, SWARM_SIZE_FLAG, "Size", "number", 20, 20,1);
    
    // Add the form group to the bottom of the Identity tab
    html[0].querySelector("div[data-tab='character']").append(formGroup);
  
    // Set the apps height correctly
    app.setPosition();
  });
  