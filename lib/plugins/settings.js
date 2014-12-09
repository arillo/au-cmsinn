SettingsPlugin = function(){}

SettingsPlugin.prototype.init = function(){
    console.log('settings plugin', 'init');
}

SettingsPlugin.prototype.enable = function(){
    console.log('settings plugin', 'enable');
    this.settingsView = UI.renderWithData(Template.cmsinn_settings, {fields: this.fields}, document.body);
}

SettingsPlugin.prototype.disable = function(){
    console.log('settings plugin', 'disable');
    if(this.settingsView != null){
        UI.remove(this.settingsView);
    }
}

SettingsPlugin.prototype.config = function(options){
    console.log('settings plugin', 'config', options);
    this.fields = options.fields;
}

CmsInnSettings = new SettingsPlugin();