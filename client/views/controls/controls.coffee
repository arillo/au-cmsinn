Template.cmsinn_controls.events
  'click .js-logout': (e, tmpl) ->
    Meteor.logout()
    return
  'click .js-plugin': (e, tmpl) ->
    e.preventDefault()
    el = undefined
    plugin = undefined
    el = $(e.currentTarget)
    plugin = el.data('plugin')
    if el.hasClass('is-disabled')
      return
    $('.js-plugin').addClass 'is-disabled'
    $('.js-plugin').removeClass 'current'
    # activate save button
    $('.js-save,.js-cancel').addClass 'draft'
    if plugin == @currentPlugin
      @currentPlugin = false
      CmsInn.disable()
      helpers.clearControls()
    else
      el.addClass 'current'
      el.removeClass 'is-disabled'
      CmsInn.enable plugin
      @currentPlugin = plugin
    return
  'click .js-save': (e, tmpl) ->
    CmsInn.plugins.versioning.enable()
    @currentPlugin = false
    helpers.clearControls()
    return
  'click .js-cancel': (e, tmpl) ->
    @currentPlugin = false
    helpers.clearControls()
    return
Template.cmsinn_controls.helpers currentLocale: ->
  CmsInn.plugins.label.getLanguage()

Template.cmsinn_controls.destroyed = ->
  # 69
  $('html').removeClass 'au-is-active'
  # 70
  return

Template.cmsinn_controls.rendered = ->
  $('html').addClass 'au-is-active'
  return

helpers = clearControls: ->
  CmsInn.disable()
  $('.js-plugin').removeClass 'current is-disabled'
  $('.js-save,.js-cancel').removeClass 'draft'
  return
Meteor.startup ->
  $('body').on 'click', '[data-au-locale]', (event) ->
    CmsInn.plugins.label.setLocale $(event.currentTarget).attr('data-au-locale')
    return
  $('body').on 'click', '[data-au-filter]', (event) ->
    CmsInn.plugins.record.setFilter $(event.currentTarget).attr('data-au-filter')
    return
  return

# ---
# generated by js2coffee 2.0.1