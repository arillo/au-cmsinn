###*
# Base object for plugins
###

@PluginBase = (storage) ->
  @storage = storage
  return

# Storage adapter will be shared accross all child plugin instances

PluginBase::setStorage = (storage) ->
  @storage = storage
  return

###*
# Init jQuery plugin 
###

# PluginBase.prototype.initjQueryPlugin = function($, uiPluginClass){
#     if(Meteor.isClient){
#         var self = this;
#         $.fn[self.name] = function(options) {
#             return this.each(function() {
#                 $.data(this, self.name, new uiPluginClass(this, options));
#             });
#         };
#     }
# };

PluginBase::init = (pluginName) ->

PluginBase::enable = (pluginName) ->

PluginBase::disable = (pluginName) ->

PluginBase::config = (pluginName) ->

@CmsInnPluginBase = new PluginBase({})
