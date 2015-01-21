var gPluginName = 'settings';

Settings = function(){};

Settings.prototype.init = function(){
    PluginBase.prototype.init.call(this, gPluginName);
};

Settings.prototype.enable = function(){
    PluginBase.prototype.enable.call(this, gPluginName);

    this.view = UI.renderWithData(Template.cmsinn_settings, {fields: this.fields}, document.body);
    this.$el = $('.js-cmsinn-settings');
};

Settings.prototype.disable = function(){
    PluginBase.prototype.disable.call(this, gPluginName);

    this.save();

    if(this.view != null){
        UI.remove(this.view);
    }
};

Settings.prototype.config = function(options){
    PluginBase.prototype.config.call(this, gPluginName);

    this.fields = options.fields;
};

Settings.prototype.save = function(){
    var $fields, data, recordid;
    $fields = this.$el.find('.js-cmsinn-settings-field');
    data = {};
    recordid = 'website_settings';

    $fields.each(function(){
        var $el, name, value;
        $el = $(this);
        name = $el.attr('name');
        value = $el.val();
        data[name] = value;
    });

    if(!this.storage.collection.findOne({ _id: recordid })){
        data._id = recordid;
        this.storage.collection.insert(data);
    } else {
        this.storage.collection.update({ _id: recordid }, { $set: data });
    }
};

Settings.prototype.get = function(name){
    var settings;
    settings = this.storage.collection.findOne({ _id: 'website_settings' });
    
    if(settings){
        return settings[name];
    }
};

if(Meteor.isClient){
    UI.registerHelper('websiteSetting', function(name){
        return CmsInnSettings.get(name);
    });
}

CmsInnSettings = new Settings();