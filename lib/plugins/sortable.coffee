gPluginName = 'sortable'

###*
# jQuery plugin
###

SortablePlugin = (element, options) ->
  @$element = $(element)
  @settings = $.extend({}, options)
  @storage = null
  if 'storage' in @settings
    @storage = @settings.storage
  if options == 'destroy'
    @destroy()
  else
    @init()
  return

Sortable = ->
  @name = 'sortable'
  @contentType = 'sortable'
  @storage = null
  return

Sortable::constructor = Sortable

Sortable::init = ->
  PluginBase::init.call this, gPluginName
  return

Sortable::disable = ->
  PluginBase::disable.call this, gPluginName
  $('[data-au-record]').cmsInnSortable 'destroy'
  $('[data-au-sortable]').cmsInnSortable 'destroy'
  return

Sortable::enable = ->
  PluginBase::enable.call this, gPluginName
  $('[data-au-record]').cmsInnSortable storage: @storage
  $('[data-au-sortable]').cmsInnSortable storage: @storage
  return

Sortable::config = (options) ->
  PluginBase::config.call this, gPluginName
  return

CmsInnSortable = new Sortable

SortablePlugin::destroy = ->
  @$element.removeClass 'au-mark'
  @$element.sortable 'destroy'
  return

SortablePlugin::init = ->
  self = this
  if @$element.height() > 0
    @$element.addClass 'au-mark'
  @$element.sortable
    items: '[data-au-sort-order]'
    update: (event, ui) ->
      order = {}
      index = 0
      self.$element.children().each ->
        order[$(this).attr('data-au-sort-order')] = index++
        return
      $.each order, (item, o) ->
        self.storage.update { _id: item }, $set: sortOrder: o
        return
      return
  return

if Meteor.isClient
  (($) ->

    $.fn.cmsInnSortable = (options) ->
      @each ->
        $.data this, 'cmsInnSortable', new SortablePlugin(this, options)
        return

    return
  ) jQuery
