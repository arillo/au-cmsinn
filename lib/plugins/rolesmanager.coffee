gPluginName = 'rolesmanager'

RolesManager = ->
  @name = 'rolesmanager'
  @roles = [
    'user'
    'editor'
    'admin'
  ]
  return

RolesManager::init = ->
  PluginBase::init.call this, gPluginName
  return

RolesManager::enable = ->
  PluginBase::enable.call this, gPluginName
  @view = UI.render(Template.cmsinn_rolesmanager, document.body)
  @$el = $('.js-cmsinn-rolesmanager')
  return

RolesManager::disable = ->
  PluginBase::disable.call this, gPluginName
  @save()
  if @view != null
    UI.remove @view
  return

RolesManager::config = (options) ->
  PluginBase::config.call this, gPluginName
  return

RolesManager::save = ->
  $roles = undefined
  $roles = @$el.find('.js-cmsinn-rolesmanager-role')
  $roles.each ->
    $el = undefined
    value = undefined
    userId = undefined
    $el = $(this)
    value = $el.val()
    userId = $el.data('userid')
    if userId and value
      Meteor.call 'saveUserRole', userId, value
    return
  return

@CmsInnRolesManager = new RolesManager
