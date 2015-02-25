if Meteor.isServer
  jQuery = {}
# var subs = new SubsManager();

###*
# Storage public interface used by AuCmsInn internally
#
# @param adapter specialized implementation
###

Storage = (adapter) ->
  @adapter = adapter
  @collection = @adapter.collection
  @hooks =
    'beforeInsert': []
    'beforeUpdate': []
    'beforePublish': []
  return

Storage::constructor = Storage

Storage::update = (selector, modifier, options, callback) ->
  # Run pre-update hooks 
  _.each @hooks.beforeUpdate, (hook) ->
    hook selector, modifier, options
    return
  @adapter.update selector, modifier, options, callback
  return

Storage::insert = (doc, callback) ->
  # Run pre-insert hooks
  _.each @hooks.beforeInsert, (hook) ->
    hook doc
    return
  @adapter.insert doc, callback
  return

Storage::remove = (selector, options, callback) ->
  @adapter.remove selector, options, callback
  return

Storage::beforeInsert = (callback) ->
  @hooks.beforeInsert.push callback
  return

Storage::beforeUpdate = (callback) ->
  @hooks.beforeUpdate.push callback
  return

Storage::beforePublish = (callback) ->
  @hooks.beforePublish.push callback
  return

###*
# Main package
#
# @param plugins what plugins should be loaded
###

AuCmsInn = (plugins, jQuery) ->
  @subsciptionName = 'au-cmsinn-content'
  @jquery = jQuery
  # root key used in settings 
  @settingsKey = 'au-cmsinn'
  @plugins = plugins
  # currently loaded plugin
  @currentPlugin = null
  @options =
    storageAdapter: new RemoteCollectionStorageAdapter
    plugins: {}
  # on init subscribe to data
  # if (Meteor.isClient) {
  #     this.subscribe();
  # }
  return

AuCmsInn::constructor = AuCmsInn

###*
# Configuration is loaded on client and server
# difference is that on server we also publish data
#
# We init plugins here, set storage, configure router
# and set settings
###

AuCmsInn::configure = (options) ->
  self = this
  options = options or {}
  @options = @options or {}
  _.extend @options, options
  @storage = new Storage(@options.storageAdapter)
  Log.debug 'storage collection count:', @storage.collection.find().count()
  # Each plugin can define hooks and those will be loaded here
  _.each self.plugins, (options, item) ->
    if typeof self.plugins[item].hooks == 'object'
      if self.plugins[item].hooks.beforeInsert
        self.storage.beforeInsert self.plugins[item].hooks['beforeInsert']
      if self.plugins[item].hooks.beforeUpdate
        self.storage.beforeUpdate self.plugins[item].hooks['beforeUpdate']
      if self.plugins[item].hooks.beforePublish
        self.storage.beforePublish self.plugins[item].hooks['beforePublish']
    return
  # Log.debug('Router.configure', this.options);
  # Router.configure(this.options);
  _.each self.plugins, (options, item) ->
    self.plugins[item].storage = self.storage
    return
  # // Set different template to be shown while data is being loaded
  # if (this.options.loadingTemplate) {
  #     Router.configure({
  #         loadingTemplate: this.options.loadingTemplate
  #     });
  # }
  # // Set not found template
  # if (this.options.notFoundTemplate) {
  #     Router.configure({
  #         notFoundTemplate: this.options.notFoundTemplate
  #     });
  # }
  # We got dependency here for router
  # Settings defined in settings.json will be loaded here
  # and passed to corresponding plugin
  _.each @plugins, (plugin, item) ->
    #  REMARK: check if intended to access via public on client?
    if Meteor.isClient
      if _.isObject(Meteor.settings) and _.isObject(Meteor.settings.public) and _.isObject(Meteor.settings.public[self.settingsKey]) and _.has(Meteor.settings.public[self.settingsKey], item)
        if !_.has(self.options.plugins, item)
          self.options.plugins[item] = {}
        _.extend self.options.plugins[item], Meteor.settings.public[self.settingsKey][item]
    else
      if _.isObject(Meteor.settings) and _.isObject(Meteor.settings[self.settingsKey]) and _.has(Meteor.settings[self.settingsKey], item)
        if !_.has(self.options.plugins, item)
          self.options.plugins[item] = {}
        _.extend self.options.plugins[item], Meteor.settings[self.settingsKey][item]
    if _.isUndefined(self.options.plugins[item])
      self.options.plugins[item] = {}
    Log.debug plugin.name, self.options.plugins[item]
    plugin.config self.options.plugins[item]
    return
  if Meteor.isClient
    @subscribe()
  # publish after configuration is done, because we are waitting for roles
  # that will define who can see what
  if Meteor.isServer
    Log.debug 'server publish'
    @publish()
  return

# When we subscribe to data change layout to main one

AuCmsInn::onStarted = ->
  if @options and @options.layoutTemplate
    Router.configure layoutTemplate: @options.layoutTemplate
  return

# We init plugins when we got data
# for example navigation plugin needs to load routes into router 
# that comes from db

AuCmsInn::subscribe = ->
  self = this
  Router.configure autoStart: false

  init = ->
    _.each self.plugins, (options, item) ->
      if self.plugins[item].init != undefined
        self.plugins[item].init()
      return
    self.onStarted()
    # When everything is loaded start router
    Router.start()
    return

  # we start Router manually because we have to load routes first
  # subs.subscribe(this.subsciptionName, init);
  Log.debug 'subscribe', @subsciptionName
  Meteor.subscribe @subsciptionName, init
  return

# Execute hooks before publishing

AuCmsInn::publish = ->
  self = this
  Meteor.publish @subsciptionName, ->
    that = this
    query = {}
    options = {}
    _.each self.storage.hooks.beforePublish, (hook) ->
      hook query, options, that.userId
      return
    Log.info 'publish', self.subsciptionName, @connection.id
    # Log.debug(query, options);
    self.storage.collection.find query, options
  return

# Toggle plugins and execute enable() method on plugin

AuCmsInn::enable = (plugin) ->
  @currentPlugin = @plugins[plugin]
  @currentPlugin.enable @jquery
  return

# Disable

AuCmsInn::disable = ->
  if @currentPlugin
    @currentPlugin.disable @jquery
    @currentPlugin = null
  return

###*
# Initialiaze
###

CmsInn = new AuCmsInn({
  label: CmsInnLabel
  navigation: CmsInnNavigation
  image: CmsInnImage
  record: CmsInnRecord
  locale: CmsInnLocale
  sortable: CmsInnSortable
  deletable: CmsInnDeletable
  versioning: CmsInnVersioning
  rolesmanager: CmsInnRolesManager
  settings: CmsInnSettings
}, jQuery)
Log.debug CmsInn
