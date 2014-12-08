SettingsPlugin = function(){}

SettingsPlugin.prototype.init = function(){
    console.log('settings plugin', 'init');
}
SettingsPlugin.prototype.enable = function(){
    console.log('settings plugin', 'enable');
    this.settingsView = UI.render(Template.cmsinn_settings, document.body);
}
SettingsPlugin.prototype.disable = function(){
    console.log('settings plugin', 'disable');
    if(this.settingsView != null){
        UI.remove(this.settingsView);
    }
}
SettingsPlugin.prototype.config = function(){
    console.log('settings plugin', 'config');
}

CmsInnSettings = new SettingsPlugin();