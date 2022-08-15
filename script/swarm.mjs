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
 

function Lang(k){
   return game.i18n.localize("DESTRUCTIBLES."+k);
 }
 
 

 Hooks.on('updateActor', (actor, change, options, user_id)=>{ 
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
 
 