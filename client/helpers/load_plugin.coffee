Meteor.setTimeout ->
    Session.set('cms_active_plugin', null)
, 1000

UI.registerHelper 'loadPlugin', (options)->
    options.hash.pluginName is Session.get('cms_active_plugin')