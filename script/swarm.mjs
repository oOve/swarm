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
const SWARM_IMAGE_FLAG = "swarmImage";

const ANIM_TYPE_FLAG = "animation";
const ANIM_TYPE_CIRCULAR = "circular";
const ANIM_TYPE_RAND_SQUARE = "random";
const ANIM_TYPE_SPIRAL = "spiral";
const ANIM_TYPE_SKITTER = "skitter";
const ANIM_TYPE_STOPNMOVE = "move_stop_move";
const ANIM_TYPE_FORMATION_SQUARE = "formation";
const ANIM_TYPES = [ANIM_TYPE_CIRCULAR, ANIM_TYPE_RAND_SQUARE, ANIM_TYPE_SPIRAL,ANIM_TYPE_SKITTER, ANIM_TYPE_STOPNMOVE, ANIM_TYPE_FORMATION_SQUARE];

const OVER_FLAG = "swarmOverPlayers";
const SETTING_HP_REDUCE = "reduceSwarmWithHP";
const SETTING_FADE_TIME = "fadeTime";
const SETTING_STOP_TIME = "stopTime";
const theta = 0.01;
const SIGMA = 5;
const GAMMA = 1000;
import * as utils from "./utils.mjs"

function Lang(k){
    return game.i18n.localize("SWARM."+k);
}


let swarm_socket;
Hooks.once("socketlib.ready", () => {
  // socketlib is activated, lets register our function moveAsGM
	swarm_socket = socketlib.registerModule(MOD_NAME);	
	swarm_socket.register("wildcards", wildcards);
});

async function wildcards(token_id){
  let tk = canvas.tokens.get(token_id);
  if(tk){
    return await tk.actor.getTokenImages();
  }
  else{
    return [];
  }
}

function getHealthEstimate(token){
  switch (game.system.id){
    case 'pf1':
    case 'pf2e':
    case 'dnd5e':
      return token.actor.data.data.attributes.hp.value / token.actor.data.data.attributes.hp.max;
    
    default:
      console.warn("No health estimate implemented for system", game.system.id);
  }
  
  
}

 
let SWARMS = {};
// TODO: Remove debug accessor
window.SWARMS = SWARMS;

export default class Swarm{
    constructor( token, number ){
        this.t = 0;
        this.number = number;
        this.token  = token;
        this.sprites= [];
        this.dest   = [];
        this.speeds = [];
        this.ofsets = [];
        this.waiting= [];
        this.layer = new PIXI.Container();

        // this.randomRotation = true;        
        this.faded  = token.document.hidden;
        this.visible= (this.faded)?0:number;

        
        this.layer.elevation = (token.document.getFlag(MOD_NAME, OVER_FLAG)?10000:0);
        this.layer.sort = 120; // Above tiles at 100
        canvas.primary.addChild(this.layer);
                
        this.created = false;
        //this.createSprites(number, token, this.layer);
        
        this.tick = new PIXI.Ticker();
        let anim = token.document.getFlag(MOD_NAME, ANIM_TYPE_FLAG);
        this.set_destinations = this.circular;
        switch(anim){
          case ANIM_TYPE_CIRCULAR:
            this.set_destinations = this.circular;
            break;
          case ANIM_TYPE_RAND_SQUARE:
            this.set_destinations = this.randSquare;
            break;
          case ANIM_TYPE_SPIRAL:
            this.set_destinations = this.spiral;
            break;
          case ANIM_TYPE_SKITTER:
            this.set_destinations = this.skitter;
            break;
          case ANIM_TYPE_STOPNMOVE:
            this.set_destinations = this.stopMoveStop;
            break;
          case ANIM_TYPE_FORMATION_SQUARE:
            this.set_destinations = this.formSquare;
            // this.randomRotation = false;
            break;
        }
        this.tick.add( this.anim.bind(this) );
        this.tick.start();
    }
    
    async createSprites( number, token, layer ){
        let use_random_image    = token.actor.prototypeToken.randomImg;
        let hidden = token.document.hidden;

        let images = [];
        if (use_random_image){            
            images = await swarm_socket.executeAsGM("wildcards",token.id);                
        }else{
          images.push(token.document.texture.src);
        }

        for(let i=0;i<number;++i){
            // waiting times, only used for stop-move
            this.waiting.push(0);
            // Random offset
            this.ofsets.push(Math.random()*97);
            // Pick an image from the list at random
            let img = images[Math.floor(Math.random()*images.length)];
            let s = PIXI.Sprite.from(img);
            s.anchor.set(.5);
            
            // Sprites initial position, a random position within this tokens area
            s.x = token.x + Math.random()*token.w;
            s.y = token.y + Math.random()*token.h;
            // Hiden initially?
            s.alpha = (hidden)?0:1;

            // A callback to get correct aspect ratio, and to start the video
            let scale = ()=>{              
                // Get the largest dimention, and scale around that
                let smax = Math.max(s.texture.width, s.texture.height);
                s.scale.x = token.document.texture.scaleX * canvas.grid.size / smax;
                s.scale.y = token.document.texture.scaleY * canvas.grid.size / smax;
                
                // Check if the texture selected is a video, and potentially start it
                let src = s.texture.baseTexture.resource.source;
                src.loop = true;
                src.muted = true; // Autostarting videos must explicitly be muted (chrome restriction)
                if (src.play) src.play();
            };
            if (s.texture.baseTexture.valid){
              scale();
            }else{
              s.texture.baseTexture.on('loaded', scale);
            }            
            // Set the initial destination to its initial position
            this.dest.push({x:s.x, y:s.y});
            this.sprites.push(s);
            let sf = token.document.getFlag(MOD_NAME, SWARM_SPEED_FLAG);
            if (sf===undefined) sf = 1;
            // Add 50% of the speed as variability on each sprites speed
            this.speeds.push( sf*.5 + sf * Math.random()*0.5 )
            // Add this sprite to the correct layer
            layer.addChild(s);
        }
    }

    /**
     * The main animation callback for this swarm
     * @param {Number} t Time fraction of the current fps
     */
    anim(t){
        if (!this.created){
          this.createSprites(this.number, this.token, this.layer);
          this.created=true;
        }

        t = Math.min(t,2.0);// Cap frame skip to two frames
        // Milliseconds elapsed, as calculated using the "time" fraction and current fps
        let ms = t*1000*(1.0/this.tick.FPS);
        let fd = game.settings.get(MOD_NAME, SETTING_FADE_TIME);
        // step, corresponding to the module setting "fade time", also, prevent division by zero
        let step = (fd==0)?(this.number):(ms*this.number)/(fd*1000);

        if (this.faded && (this.visible>0)){ 
            // We should be faded/hidden, and we still have critters visible
            this.visible -= step;
            this.sprites.forEach((s,i)=>{s.alpha = (i>=this.visible)?0:1});
        }
        if (!this.faded && (this.visible<this.number)){ 
            // We should be visible, and we still have critters hidden
            this.visible += step;
            this.sprites.forEach((s,i)=>{s.alpha = (i>this.visible)?0:1});
        }
        // Calling the animation specific method, set_destination
        this.set_destinations(ms);
        // Calling the generic move method
        this.move(ms);
        // Keep rotation
        // if (!this.randomRotation){
        //     this.rotation(this.token.document.rotation);
        // }
    }

    hide(hidden){
        this.faded = hidden;
    }

    // TODO: HP interaction    
    kill(percentage){
    }
      
    destroy(){
        for (let s of this.sprites){
            s.destroy();
        }
        this.tick.destroy();        
        this.layer.destroy();
    }

    skitter(ms) {
        this.stopMoveStop(ms);

        let pcs = canvas.tokens.placeables.filter(t=>t.actor.hasPlayerOwner);
        let pcp = pcs.map(t=>t.center);
        let occ = pcs.map(t=>(.55*t.w)**2);

        if (pcs.length>0){
            for (let i=0; i<this.sprites.length;++i){
                let s = this.sprites[i];
                let sp = {x:s.x, y:s.y};
                let dists2 = pcp.map(p=>{return (s.x-p.x)**2+ (s.y-p.y)**2});
                let smallest = utils.argMin(dists2);
                if (dists2[smallest]<occ[smallest]){
                    // We are "inside" a player
                    let out = utils.vSub(sp,pcp[smallest]);
                    if ((out.x**2+out.y**2) > theta){
                        let shortest_direction_out_normed = utils.vNorm(out);
                        let distance_left_out = 0.1 + Math.sqrt(occ[smallest]) - Math.sqrt(dists2[smallest]);
                        this.dest[i] = utils.vAdd(sp, utils.vMult(shortest_direction_out_normed, 1.5*distance_left_out));
                    }
                }
            }
        }
    }

    stopMoveStop(ms){
      for (let i=0; i<this.sprites.length;++i){
        let s = this.sprites[i];
        let d = utils.vSub(this.dest[i], {x:s.x, y:s.y});
        if (d.x**2+d.y**2 < SIGMA){
          if (this.waiting[i]<=0){
            let x = this.token.x + Math.random() * this.token.w;
            let y = this.token.y + Math.random() * this.token.h;
            this.dest[i] = {x:x,y:y};
            this.waiting[i] = Math.random()*game.settings.get(MOD_NAME, SETTING_STOP_TIME)*1000;
          }
          else{
            this.waiting[i]-=ms;
          }
        }
      }

    }

    formSquare(ms){
      //Calculate length and width
      let a = Math.ceil(Math.sqrt(this.sprites.length));  //Number of rows
      let b = Math.ceil(this.sprites.length / a);  //Vertical number
      let c = a - (a * b - this.sprites.length);  //last row
      let angle = this.token.document.rotation * (Math.PI / 180);
      let center = this.token.center;

      for (let i=0; i<this.sprites.length;++i){
        let s = this.sprites[i];
        // Calculate the coordinate position in a square matrix
        let x = this.token.x + (this.token.w / a) * ((i - c) % a + 0.5);
        let y = this.token.y + (this.token.h / b) * (Math.floor((i - c) / a) + 1.5);
        // separate treatment for the first row
        if (c > 0 && i < c){
            x = this.token.x + (this.token.w / c) * (i % c + 0.5);
        }

        //Rotate the square matrix following the token direction
        let x3 = (x - center.x) * Math.cos(angle) - (y - center.y) * Math.sin(angle) + center.x;
        let y3 = (x - center.x) * Math.sin(angle) + (y - center.y) * Math.cos(angle) + center.y;
        x = x3;
        y = y3;

        //Turn to the direction of the token when it is close enough to where it should be in the square.
        let d = utils.vSub({x:x,y:y}, {x:s.x, y:s.y});
        let len = utils.vLen(d);
        if(len<SIGMA){
            s.rotation = angle;
        }else{
            this.dest[i] = {x:x,y:y};
        }
      }
    }
    
    randSquare(ms){
      for (let i=0; i<this.sprites.length;++i){
        let s = this.sprites[i];
        let d = utils.vSub(this.dest[i], {x:s.x, y:s.y});
        let len = utils.vLen(d);
        if (len<SIGMA || len>GAMMA){
          let x = this.token.x + Math.random() * this.token.w;
          let y = this.token.y + Math.random() * this.token.h;
          this.dest[i] = {x:x,y:y};
        }
      }
    }
    spiral(ms){
        this.t += ms/30;
        let rx =  0.5 * this.token.w;
        let ry =  0.5 * this.token.h;
        for (let i=0; i<this.sprites.length;++i){
            let t = this.speeds[i] * this.t*0.02 + this.ofsets[i];
            let x = Math.cos(t);
            let y = 0.4*Math.sin(t);

            let ci = Math.cos(t/(2*Math.E));
            let si = Math.sin(t/(2*Math.E));
            this.dest[i] = {x: rx*(ci*x - si*y) + this.token.center.x,
                            y: ry*(si*x + ci*y) + this.token.center.y };
        }
    }
    circular(ms){
        this.t += ms/30;        
        let _rx = 1 * 0.5 * this.token.w;
        let _ry = 1 * 0.5 * this.token.h;

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
    }

    move(ms){
        for (let i=0; i<this.sprites.length;++i){
            let s = this.sprites[i];
            let d = utils.vSub( this.dest[i], {x:s.x, y:s.y} );
            
            if ((d.x**2+d.y**2) > theta){
                let mv = utils.vNorm(d);
                mv = utils.vMult(mv, 0.05*ms*this.speeds[i]*4);
                if ((mv.x**2+mv.y**2)>(d.x**2+d.y**2)){mv=d;}
                s.x += mv.x;
                s.y += mv.y;
                s.rotation = -Math.PI/2. + utils.vRad(d);
            }
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
function hideSwarmOnToken(token, hide){
    if (token.id in SWARMS){
        SWARMS[token.id].hide(hide);
    }
}



Hooks.on('updateToken', (token, change, options, user_id)=>{
    if (change?.flags?.swarm){   // If any swarm related flag was in this update
        deleteSwarmOnToken(token);
        if (token.flags?.[MOD_NAME]?.[SWARM_FLAG]){
            createSwarmOnToken(canvas.tokens.get(token.id));
        }
    }

    if (change.hidden != undefined && token.flags?.[MOD_NAME]?.[SWARM_FLAG]){
        hideSwarmOnToken(token, change.hidden);
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
        createSwarmOnToken(s);
    }
});

 
 
 // Settings:
 Hooks.once("init", () => {
  
    /*
    game.settings.register(MOD_NAME, SETTING_HP_REDUCE, {
        name: "Reduce swarm with HP",
        hint: "Reduce the swarm as HP decreases, requires support for your system",
        scope: 'world',
        config: true,
        type: Boolean,
        default: false
   });
   */
    game.settings.register(MOD_NAME, SETTING_FADE_TIME, {
        name: "Fade time",
        hint: "How long, in seconds, the fade in/out should take",
        scope: 'world',
        config: true,
        type: Number,
        default: 2.0
    });
    game.settings.register(MOD_NAME, SETTING_STOP_TIME, {
      name: "Stop time",
      hint: "How long, in seconds, the stop in the stop move animation",
      scope: 'world',
      config: true,
      type: Number,
      default: 5.0
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
 function imageSelector( app, flag_name, title ){
  let data_path = 'flags.'+MOD_NAME+'.'+flag_name;
  
  let flags = app.token.flags;
  if (flags === undefined) flags = app.token.data.flags;
  
  let grp = document.createElement('div');
  grp.classList.add('form-group');
  let label = document.createElement('label');
  label.innerText = title;  
  let fields = document.createElement('div');
  fields.classList.add('form-fields');
  
  const button = document.createElement("button");
  button.classList.add("file-picker");
  button.type = "button";
  button.title = "Browse Files";
  button.tabindex = "-1";
  button.dataset.target = data_path;
  button['data-type'] = "imagevideo";
  button['data-target'] = data_path;
 
  button.onclick = app._activateFilePicker.bind(app);
  
  let bi = document.createElement('i');
  bi.classList.add('fas');
  bi.classList.add('fa-file-import');
  bi.classList.add('fa-fw');
  

  const inpt = document.createElement("input");  
  inpt.name = data_path;
  inpt.classList.add("image");
  inpt.type = "text";
  inpt.title = title;
  inpt.placeholder = "path/image.png";
  // Insert the flags current value into the input box  
  if (flags?.[MOD_NAME]?.[flag_name]){
    inpt.value=flags?.[MOD_NAME]?.[flag_name];
  }
  
  button.append(bi);

  grp.append(label);
  grp.append(fields);
  
  fields.append(button);
  fields.append(inpt);
  return grp;
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
  
    createCheckBox(app, formFields, SWARM_FLAG, "", '');
    createCheckBox(app, formFields, OVER_FLAG, "Over", "Check if the swarm should be placed over players." );
    textBoxConfig(formFields, app, SWARM_SIZE_FLAG, "Count", "number", 20, 20,1);
    textBoxConfig(formFields, app, SWARM_SPEED_FLAG, "Speed", "number", 1.0, 1.0, 0.1);
    dropDownConfig(formFields,app, ANIM_TYPE_FLAG, "anim", ANIM_TYPES, ANIM_TYPE_CIRCULAR);

    // Add the form group to the bottom of the Identity tab
    html[0].querySelector("div[data-tab='character']").append(formGroup);


    // Add difference swarm image
    //const swarmImage = imageSelector(app, SWARM_IMAGE_FLAG, "Token for Swarm mobs");
    // And add the token image selectors to the 'apperance' tab
    //html[0].querySelector("div[data-tab='appearance']").append(swarmImage);
  
    // Set the apps height correctly
    app.setPosition();
  });
  