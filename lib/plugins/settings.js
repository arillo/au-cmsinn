SettingsPlugin = function(){}

SettingsPlugin.prototype.init = function(){}

SettingsPlugin.prototype.enable = function(){
    this.view = UI.renderWithData(Template.cmsinn_settings, {fields: this.fields}, document.body);
    this.$el = $('.js-cmsinn-settings');
};

SettingsPlugin.prototype.disable = function(){
    this.save();

    if(this.view != null){
        UI.remove(this.view);
    }
};

SettingsPlugin.prototype.config = function(options){
    this.fields = options.fields;
};

SettingsPlugin.prototype.save = function(){
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

SettingsPlugin.prototype.get = function(name){
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

CmsInnSettings = new SettingsPlugin();