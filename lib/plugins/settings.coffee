gPluginName = 'settings'

Settings = ->
  @name = 'settings'
  return

Settings::init = ->
  PluginBase::init.call this, gPluginName
  return

Settings::enable = ->
  PluginBase::enable.call this, gPluginName
  @view = UI.renderWithData(Template.cms_settings, { fields: @fields }, document.body)
  @$el = $('.js-cms_settings')
  return

Settings::disable = ->
  PluginBase::disable.call this, gPluginName
  if @view != null
    UI.remove @view
  return

Settings::config = (options) ->
  PluginBase::config.call this, gPluginName
  @fields = options.fields
  return

Settings::save = ->
  $fields = undefined
  data = undefined
  recordid = undefined
  $fields = @$el.find('.js-cms_settings-field')
  data = {}
  recordid = 'website_settings'
  $fields.each ->
    $el = undefined
    name = undefined
    value = undefined
    $el = $(this)
    name = $el.attr('name')
    value = $el.val()
    data[name] = value
    return
  if !@storage.collection.findOne(_id: recordid)
    data._id = recordid
    @storage.collection.insert data
  else
    @storage.collection.update { _id: recordid }, $set: data
  return

Settings::get = (name) ->
  settings = undefined
  settings = @storage.collection.findOne(_id: 'website_settings')
  if settings
    return settings[name]
  return

if Meteor.isClient
  UI.registerHelper 'websiteSetting', (name) ->
    CmsInnSettings.get name

@CmsInnSettings = new Settings
