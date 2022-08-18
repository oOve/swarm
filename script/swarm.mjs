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
 const SWARM_SPEED_FLAG = "swarmSpeed";
 const ANIM_TYPE_FLAG = "animation";
 const ANIM_TYPE_CIRCULAR = "circular";
 const ANIM_TYPE_RAND_SQUARE = "random";

 const OVER_FLAG = "swarmOverPlayers";
 const SETTING_HP_REDUCE = "reduceSwarmWithHP";
 const SIGMA = 5;
 const GAMMA = 1000;
 import * as utils from "./utils.mjs"

function Lang(k){
   return game.i18n.localize("SWARM."+k);
 }
 
 let SWARMS = {};

 export default class Swarm{
    constructor( token, number ){
        this.t = 0;
        this.token = token;
        this.sprites = [];
        this.dest = [];
        this.speeds = [];
        this.ofsets = [];

        let layer = (token.document.getFlag(MOD_NAME, OVER_FLAG)?canvas.foreground:canvas.background);        
        this.createSprites(number, token, layer);
        
        this.tick = new PIXI.Ticker();
        let anim = token.document.getFlag(MOD_NAME, ANIM_TYPE_FLAG);
        let method = this.circular;
        switch(anim){
          case ANIM_TYPE_CIRCULAR:
            method = this.circular;
            break;
          case ANIM_TYPE_RAND_SQUARE:
            method = this.randSquare;
            break;
        }
        this.tick.add( method.bind(this) );
        this.tick.start();
    }    
    
    async createSprites( number, token, layer ){
        let use_random_image    = token.actor.data.token.randomImg;
        let wildcard_image_path = token.actor.data.token.img;

        let images = [];
        if (use_random_image){
          let res = await FilePicker.browse('data', wildcard_image_path, {wildcard:true});
          for (let f of res.files){
            images.push(f);
          }
        }else{
          images.push(token.document.data.img);
        }

        for(let i=0;i<number;++i){
            this.ofsets.push(Math.random()*97);
            let img = images[Math.floor(Math.random()*images.length)];
            let s = await PIXI.Sprite.from(img);
            s.anchor.set(.5);
            s.x = token.data.x;
            s.y = token.data.y;

            let scale = ()=>{
              let smax = Math.max(s.texture.width, s.texture.height);
              s.scale.x = token.data.scale * canvas.grid.size / smax;
              s.scale.y = token.data.scale * canvas.grid.size / smax;
              if (token.data.mirrorX) s.scale.x *= -1;
              if (token.data.mirrorY) s.scale.y *= -1;
            };
            if (s.texture.baseTexture.valid){
              scale();
            }else{
              s.texture.baseTexture.on('loaded', scale);
            }
            
            this.dest.push({x:token.x, y:token.y});
            this.sprites.push(s);
            let sf = token.document.getFlag(MOD_NAME, SWARM_SPEED_FLAG);
            if (sf===undefined) sf = 1;
            this.speeds.push( sf*.5 + sf * Math.random()*0.5 )
            layer.addChild(s);
        }
    }

    kill(percentage){
    }
      
    destroy(){
        for (let s of this.sprites){
            s.destroy();
        }
        this.tick.destroy();        
    }

    randSquare(ms){
      for (let i=0; i<this.sprites.length;++i){
        let s = this.sprites[i];
        let d = utils.vSub(this.dest[i], {x:s.x, y:s.y});
        let len = utils.vLen(d);
        if (len<SIGMA || len>GAMMA){
          let x = this.token.data.x + Math.random() * this.token.data.width  * canvas.grid.size;
          let y = this.token.data.y + Math.random() * this.token.data.height * canvas.grid.size;
          this.dest[i] = {x:x,y:y};
        }
      }
      this.move(ms);
    }


    circular(ms){
        this.t += ms;        
        let _rx = 1 * 0.5 * canvas.grid.size * this.token.data.width;
        let _ry = 1 * 0.5 * canvas.grid.size * this.token.data.height;

        for (let i=0; i<this.sprites.length;++i){
            
            let t = this.t * 0.02 + this.ofsets[i];
            let rY = 1 * (0.5 + 0.5 * ( 
                1.0 * Math.sin(    t * 0.3) + 
                0.3 * Math.sin(2 * t + 0.8) + 
                0.26* Math.sin(3 * t + 0.8)
                ));
            let x =    Math.cos(t*this.speeds[i]);
            let y = rY*Math.sin(t*this.speeds[i]);

            let ci = Math.cos(this.ofsets[i]);
            let si = Math.sin(this.ofsets[i]);
            let rx = _rx*(ci*x - si*y);
            let ry = _ry*(si*x + ci*y);

            this.dest[i] = {x:rx + this.token.center.x,
                            y:ry + this.token.center.y};
        }
        this.move(ms);
    }

    move(ms){
        for (let i=0; i<this.sprites.length;++i){
            let s = this.sprites[i];
            let d = utils.vSub( this.dest[i], {x:s.x, y:s.y} );

            let mv = utils.vNorm(d);
            mv = utils.vMult(mv, ms*this.speeds[i]*4);
            if ((mv.x**2+mv.y**2)>(d.x**2+d.y**2)){mv=d;}
            s.x += mv.x;
            s.y += mv.y;
            s.rotation = -Math.PI/2. + utils.vRad(d);
        }
    }
}


//Only in V10+
Hooks.on('canvasTearDown', (a,b)=>{
    for(let key of Object.keys(SWARMS)){
        SWARMS[key].destroy();
        delete SWARMS[key];
      }
});


Hooks.on('updateToken', (token, change, options, user_id)=>{
    if (!game.user.isGM) return; // Only at DMs client
    if (change?.flags?.swarm){   // If any swarm related flag was in this update
        deleteSwarmOnToken(token);
        if (token.data?.flags?.[MOD_NAME]?.[SWARM_FLAG]){
            createSwarmOnToken(canvas.tokens.get(token.id));
        }
    }

    if (change.hidden != undefined && token.data?.flags?.[MOD_NAME]?.[SWARM_FLAG]){
        if(change.hidden) deleteSwarmOnToken(token);
        else createSwarmOnToken(canvas.tokens.get(token.id));
    }
    

    
});


// TODO: Add HP interaction
Hooks.on('updateActor', (actor, change, options, user_id)=>{

    let val = change.data?.attributes?.hp?.value;
    if (val == undefined){
        val = change.system?.attributes?.hp?.value;
    }
    if (val != undefined){
      let tk = actor.token;
      let mx = actor.data.data.attributes.hp.max;
      let hp = 100*val/mx;
    }

});

function deleteSwarmOnToken(token){
    if (token.id in SWARMS){
        SWARMS[token.id].destroy();
        delete SWARMS[token.id];
    }
}

function createSwarmOnToken(token){
  SWARMS[token.id] = new Swarm(token, token.document.getFlag(MOD_NAME, SWARM_SIZE_FLAG));
  if (!game.user.isGM){
    token.alpha = 0;
  }
}

// Delete token
Hooks.on('deleteToken', (token, options, user_id)=>{
  if (token.id in SWARMS){
    SWARMS[token.id].destroy();
    delete SWARMS[token.id];
  }
})
// Create token
Hooks.on('createToken', (token, options, user_id)=>{
  //console.warn("Create Token", token, options);
  if (token.getFlag(MOD_NAME, SWARM_FLAG)===true){
    createSwarmOnToken(token.object);
  }
});
 
Hooks.on("canvasReady", ()=> {
    // Scene loaded.
    let swarm = canvas.tokens.placeables.filter( (t)=>{return t.document.getFlag(MOD_NAME,SWARM_FLAG);} ) 
    //console.error("canvasReady",swarm);
    for (let s of swarm){
        if (s.document.hidden===false)
            createSwarmOnToken(s);
    }
});

 
 
 // Settings:
 Hooks.once("init", () => {
    
    game.settings.register(MOD_NAME, SETTING_HP_REDUCE, {
        name: "Reduce swarm with HP",
        hint: "Reduce the swarm as HP decreases, requires support for your system",
        scope: 'world',
        config: true,
        type: Boolean,
        default: false
   });
  
 });
 


 /*
  █████  █████ █████
░░███  ░░███ ░░███ 
 ░███   ░███  ░███ 
 ░███   ░███  ░███ 
 ░███   ░███  ░███ 
 ░███   ░███  ░███ 
 ░░████████   █████
  ░░░░░░░░   ░░░░░  */
 
 
function createLabel(text){
  const label = document.createElement('label');
  label.textContent = text;
  return label;
}

function dropDownConfig(parent, app, flag_name, title, values, default_value=null)
{ 
  let flags = app.token.flags;
  if (flags === undefined) flags = app.token.data.flags;

  let cur = flags?.[MOD_NAME]?.[flag_name];
  //parent.append(createLabel(title));
  const input = document.createElement('select');
  input.name = 'flags.'+MOD_NAME+'.'+flag_name;
  input.style.width = "50px";
  
  for (let o of values){
    let opt = document.createElement('option');
    opt.innerText = o;
    if (cur===o) opt.classList.add('selected');
    input.append(opt);
  }
  input.value = cur;

  parent.append(input);
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
    createCheckBox(app, formFields, OVER_FLAG, "Over", "Check if the swarm should be placed over players." );
    textBoxConfig(formFields, app, SWARM_SIZE_FLAG, "Size", "number", 20, 20,1);
    textBoxConfig(formFields, app, SWARM_SPEED_FLAG, "Speed", "number", 1.0, 1.0, 0.1);
    dropDownConfig(formFields,app, ANIM_TYPE_FLAG, "anim", [ANIM_TYPE_CIRCULAR,ANIM_TYPE_RAND_SQUARE],ANIM_TYPE_CIRCULAR);

    // Add the form group to the bottom of the Identity tab
    html[0].querySelector("div[data-tab='character']").append(formGroup);
  
    // Set the apps height correctly
    app.setPosition();
  });
  