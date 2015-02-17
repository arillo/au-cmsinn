###*
# Default UI
###

NavigationUI = 
  storage: null
  currentRecord:
    template: ''
    uri: ''
    id: null
    recordId: null
    fieldId: null
  element: null
  init: (id, fieldId, recordId, storage, element) ->
    @destroy()
    @storage = storage
    @element = element
    rec = null
    if recordId == null
      rec = CmsInnNavigation.getRecord(id)
    else
      rec = CmsInnNavigation.getRecordField(recordId, fieldId)
    if _.isObject(rec)
      _.extend @currentRecord, rec
    if !_.has(@currentRecord, 'get')

      @currentRecord['get'] = ->
        ''

    @currentRecord['id'] = id
    @currentRecord['recordId'] = recordId
    @currentRecord['fieldId'] = fieldId
    $('body').on 'click', '.js-close-nav', @closeWindow
    if recordId == null
      $('body').on 'click', '.js-save-nav', @updateRecord
      $('body').on 'keydown', '.js-cmsinn-nav-item-uri', @updateRecord
    else
      $('body').on 'click', '.js-save-nav', @updateRecordField
      $('body').on 'keydown', '.js-cmsinn-nav-item-uri', @updateRecordField
    $('body').on 'change', '.js-cmsinn-nav-page-type', @updateRouteField
    return
  closeWindow: (e) ->
    NavigationUI.element.poshytip 'destroy'
    return
  updateRecord: (e) ->
    if e.keyCode and e.keyCode != 13
      return
    template = $('.js-cmsinn-nav-page-type option:selected').val()
    uri = $('.js-cmsinn-nav-item-uri').val()
    success = CmsInnNavigation.updateRecord(NavigationUI.currentRecord.id, template, uri)
    if !success
      alert 'a page with URL ' + uri + ' already exists, please choose another one'
    else
      NavigationUI.element.poshytip 'destroy'
    return
  updateRecordField: (e) ->
    if e.keyCode and e.keyCode != 13
      return
    template = $('.js-cmsinn-nav-page-type option:selected').val()
    uri = $('.js-cmsinn-nav-item-uri').val()
    success = CmsInnNavigation.updateRecordField(NavigationUI.currentRecord.recordId, NavigationUI.currentRecord.fieldId, template, uri)
    if !success
      alert 'a page with URL ' + uri + ' already exists, please choose another one'
    else
      NavigationUI.element.poshytip 'destroy'
    return
  updateRouteField: (e) ->
    $target = undefined
    $uri = undefined
    defaultRoute = undefined
    $target = $(e.currentTarget)
    $uri = $('.js-cmsinn-nav-item-uri')
    #if(_.isEmpty($uri.val())){
    defaultRoute = $target.find('option:selected').data('defaultroute')
    if defaultRoute
      $uri.val defaultRoute
    #}
    return
  destroy: ->
    # Take both down :)
    @currentRecord =
      template: ''
      uri: ''
      id: null
      recordId: null
      fieldId: null
    $('body').off 'click', '.js-save-nav', @updateRecord
    $('body').off 'click', '.js-save-nav', @updateRecordField
    $('body').off 'click', '.js-close-nav', @closeWindow
    $('body').off 'keydown', '.js-cmsinn-nav-item-uri', @updateRecord
    $('body').off 'keydown', '.js-cmsinn-nav-item-uri', @updateRecordField
    return
  buildOptions: (types, selected) ->
    options = ''
    _.each types, (item) ->
      isSelected = undefined
      isSingleton = undefined
      instanceExists = undefined
      selectedString = undefined
      isSelected = selected == item.type
      isSingleton = ! !item.singleton
      instanceExists = CmsInnNavigation.isDuplicatePageTypeInstance(item.type)
      selectedString = if isSelected then 'selected' else ''
      if !isSelected and isSingleton and instanceExists
        return
      options += '                 <option value="' + item.type + '" ' + selectedString + ' data-defaultroute="' + item.defaultRoute + '">' + item.type + '</option>             '
      return
    options
  render: (id, fieldId, recordId, storage, element) ->
    #selectedTemplate, uri, pageTypes
    @init id, fieldId, recordId, storage, element
    sortedPageTypes = _.sortBy(CmsInnNavigation.pageTypes, (pageType) ->
      pageType.type
    )
    tpl = '             <div class="au-form au-form-nav">                 <div class="au-form_item">                     <select class="au-form_input au-form_input-select js-cmsinn-nav-page-type">                         <option value="">None</option>                         ' + @buildOptions(sortedPageTypes, @currentRecord.get('template')) + '                     </select>                 </div>                 <div class="au-form_item">                     <label class="au-form_label">URL</label>                     <input type="text" class="au-form_input au-form_input-text js-cmsinn-nav-item-uri" value="' + @currentRecord.get('uri') + '">                 </div>                 <div class="au-form_item au-tip_item-actions">                     <div class="au-form_actions">                         <button class="au-form_btn js-save-nav">Save</button>                         <button class="au-form_btn js-close-nav">Close</button>                     </div>                 </div>             </div>         '
    tpl

###*
# Plugin Wrapper
#
###

gPluginName = 'navigation'
contentDep = new (Deps.Dependency)

###*
# jQuery plugin
###

NavigationPlugin = (element, options) ->
  @$element = $(element)
  @settings = $.extend({}, options)
  if 'storage' in @settings
    @storage = @settings.storage
  if 'ui' in @settings and typeof @settings.ui == 'object'
    @ui = @settings.ui
  if 'destroy' in options and options['destroy']
    @destroy()
  else
    @init()
  return

Navigation = ->
  @name = 'navigation'
  @storage = null
  @contentType = 'navigation'
  @ui = NavigationUI
  @pageTypes = []
  @defaultTemplate = '__home'
  @routes = []
  return

Navigation::constructor = Navigation

Navigation::init = ->
  PluginBase::init.call this, gPluginName
  return

Navigation::disable = ->
  PluginBase::disable.call this, gPluginName
  $('[data-au-nav]').cmsInnNav
    destroy: true
    storage: @storage
    ui: @ui
  return

Navigation::enable = ->
  PluginBase::enable.call this, gPluginName
  $('[data-au-nav]').cmsInnNav
    storage: @storage
    ui: @ui
  return

Navigation::config = (options) ->
  PluginBase::config.call this, gPluginName
  if 'pageTypes' in options
    self = this
    _.each options.pageTypes, (type) ->
      if _.where(self.pageTypes, type).length == 0
        self.pageTypes.push type
      else
        throw new (Meteor.Error)('Page type with such name [' + type.type + '] already exists!')
      return
  if 'defaultTemplate' in options
    @defaultTemplate = options.defaultTemplate
  return

Navigation::getRecord = (recordId) ->
  item = @storage.collection.findOne(
    _id: recordId
    contentType: @contentType)
  if _.isObject(item)
    return item
  return

Navigation::getRecordField = (recordId, field) ->
  record = @storage.collection.findOne(_id: recordId)
  if _.isObject(record)
    # @todo: rly ? hell no, has to be revisited
    fieldResult = record.get(field)
    if _.isObject(fieldResult)
      _g = _.pick(record, 'get')
      _.extend fieldResult, _g
      return fieldResult
  return

Navigation::isDuplicateRoute = (uri) ->
  ! !@storage.collection.findOne('link.uri': uri)

Navigation::isDuplicatePageTypeInstance = (pageType) ->
  ! !@storage.collection.findOne($or: [
    { 'draft.link.template': pageType }
    { 'link.template': pageType }
  ])

Navigation::updateRecordField = (recordId, field, template, uri) ->
  if @isDuplicateRoute(uri)
    return false
  updateObject = {}
  updateObject[field + '.uri'] = uri
  updateObject[field + '.template'] = template
  updateObject[field + '.contentType'] = @contentType
  @storage.update { _id: recordId }, { $set: updateObject }, (err, docNum) ->
    if !err
      console.log 'Navigation updateRecordField success'
    return
  # TODO: check on updateRecord only
  @buildRoute recordId, template, uri
  true

Navigation::updateRecord = (id, template, uri) ->
  if @isDuplicateRoute(uri)
    return false
  self = this
  @storage.update { _id: id }, { $set:
    uri: uri
    template: template }, {}, (err, docNum) ->
    if docNum == 0
      self.storage.insert {
        _id: id
        uri: uri
        template: template
        contentType: self.contentType
      }, (err) ->
        if !err
          console.log 'Navigation updateRecord success'
        return
    contentDep.changed()
    return
  true

Navigation::buildRoute = (id, template, uri) ->
  contentDep.changed()
  # var self = this;
  # var items = [];
  # if(self.storage !== null){
  #     items = self.storage.collection.find({'link.contentType': {$in:[this.contentType]}});
  # }
  # var found = _.find(items.fetch(), function(item){
  #     return item._id+"[link]" == id;
  # });
  found = _.find(@routes, (record) ->
    record._id == id
  )
  if !found
    route = 
      _id: id
      uri: uri
      template: template
    @routes.push route
    try
      Router.plugin 'aucmsinn', routes: [ route ]
    catch e
      alert e.message
    # console.log('BUILD ROUTE', this.routes);
  else
    # TODO: check if better way
    location.reload()
  return

Navigation::init = ->
  self = this
  items = []
  if self.storage != null
    # items = self.storage.collection.find({contentType: {$in:[this.contentType, CmsInnRecord.contentType]}});
    # get only navigation records
    items = self.storage.collection.find('link.contentType': $in: [ @contentType ])
  # var routes = [];
  #@todo: I have to get back and revisit "record" type loading
  addedHomeRoute = false
  parents = {}
  parent = {}
  items.forEach (nav) ->
    lookup = nav
    if nav.get('contentType') == CmsInnRecord.contentType
      lookup = nav.findField(self.contentType)
      if _.isObject(lookup)
        _g = _.pick(nav, 'get')
        _.extend lookup, _g
    if _.isObject(lookup)
      uri = lookup.get('uri')
      if uri == '/'
        addedHomeRoute = true
      if parents[lookup._id]
        parent = parents[lookup._id]
      else
        parent = self.storage.collection.findOne(_id: $in: nav.parents)
      self.routes.push
        _id: lookup._id
        uri: uri
        template: lookup.get('template')
        places: parent.places
    return
  # Add default route, because in service.js where we toggle between loading and normal templates
  # tpl is not loaded if there is no routes and on initial load there is no routes
  # @todo: find a reason why it is like that \
  if addedHomeRoute == false or items.count() == 0
    @routes.push
      _id: '__default'
      uri: '/'
      template: self.defaultTemplate
  # send routes to aucmsinn Router.plugin
  Router.plugin 'aucmsinn', routes: @routes
  return

CmsInnNavigation = new Navigation

NavigationPlugin::destroy = ->
  @ui.destroy()
  @$element.removeClass 'au-mark'
  @$element.poshytip 'destroy'
  @$element.off 'click'
  return

NavigationPlugin::init = ->
  self = this
  @$element.addClass 'au-mark'
  @$element.on 'click', ->
    # Destroy other poshytips
    $('[data-au-nav]').each ->
      if this != self.$element
        $(this).poshytip 'destroy'
      return
    parsedAttribute = Utilities.parseAttr($(this).attr('data-au-nav'))
    $(this).poshytip
      className: 'au-popover-tip'
      showOn: 'none'
      alignTo: 'target'
      alignX: 'center'
      keepInViewport: true
      fade: true
      slide: false
      content: self.ui.render(parsedAttribute['id'], parsedAttribute['fieldId'], parsedAttribute['recordId'], self.storage, self.$element)
    $(this).poshytip 'show'
    return
  return

if Meteor.isClient
  (($) ->

    $.fn.cmsInnNav = (options) ->
      @each ->
        $.data this, 'cmsInnNav', new NavigationPlugin(this, options)
        return

    return
  ) jQuery

  getNavRecord = (navId, prefix) ->
    if prefix != undefined and typeof prefix == 'string'
      navId = prefix + navId
    parsedLabel = Utilities.parseAttr(navId)
    record = null
    if parsedLabel['recordId'] == null
      record = CmsInnNavigation.getRecord(parsedLabel['id'])
    else
      record = CmsInnNavigation.getRecordField(parsedLabel['recordId'], parsedLabel['fieldId'])
    if record
      return record
    null

  if UI
    UI.registerHelper 'nav', (navId, action, prefix) ->
      switch action
        when 'href'
          if record = getNavRecord(navId, prefix)
            return record.uri
        when 'target'
          if record = getNavRecord(navId, prefix)
            if record.uri.substr(0, 4) == 'http'
              return '_blank'
          return ''
        when 'isActive'
          # @FIX
          route = Router.current().route
          if route
            return if route.getName() == navId then 'current' else ''
          else
            return ''
      return
