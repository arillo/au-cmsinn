/**
 * Base object for plugins
 */
PluginBase = function (storage){
    this.storage = storage;
};

// Storage adapter will be shared accross all child plugin instances
PluginBase.prototype.setStorage = function(storage){
    this.storage = storage;
};

/**
 * Init jQuery plugin 
 */
PluginBase.prototype.initjQueryPlugin = function($, uiPluginClass){
    if(Meteor.isClient){
        var self = this;
        $.fn[self.name] = function(options) {
            return this.each(function() {
                $.data(this, self.name, new uiPluginClass(this, options));
            });
        };
    }
};

PluginBase.prototype.init = function(pluginName){};

PluginBase.prototype.enable = function(pluginName){
    $('[data-plugin]').not('[data-plugin="versioning"]').addClass('is-disabled').on('click.pluginBase.aucmsinn', function(e){
        return false;
    });
};

PluginBase.prototype.disable = function(pluginName){
    $('[data-plugin]').not('[data-plugin="versioning"]').removeClass('is-disabled').off('click.pluginBase.aucmsinn');
};

PluginBase.prototype.config = function(pluginName){};

CmsInnPluginBase = new PluginBase({});