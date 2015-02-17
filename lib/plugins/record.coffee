###*
# Default UI
###

RecordUI = 
  storage: null
  element: null
  init: (storage, element) ->
    @storage = storage
    @element = element
    @destroy()
    $('body').on 'change', '.js-cmsinn-selected-record', @mapRecordHandler
    $('body').on 'change', '.js-cmsinn-selected-parent-record', @addSubRecordHandler
    $('body').on 'click', '.js-cmsinn-add-new-record', @addRecordHandler
    $('body').on 'click', '.js-close-record', @closeWindow
    return
  closeWindow: ->
    RecordUI.element.poshytip 'destroy'
    return
  destroy: ->
    $('body').off 'change', '.js-cmsinn-selected-record', @mapRecordHandler
    $('body').off 'change', '.js-cmsinn-selected-parent-record', @addSubRecordHandler
    $('body').off 'click', '.js-cmsinn-add-new-record', @addRecordHandler
    $('body').off 'click', '.js-close-record', @closeWindow
    return
  addRecordHandler: ->
    CmsInnRecord.addRecord $(this).attr('data-id'), $(this).attr('data-field-id')
    return
  addSubRecordHandler: ->
    if $('option:selected', this).val() != 'none'
      CmsInnRecord.addSubRecord $('option:selected', this).val(), $(this).attr('data-field-id')
      $('option:selected', this).removeAttr 'selected'
    return
  mapRecordHandler: ->
    if $('option:selected', this).val() != 'none'
      CmsInnRecord.mapRecord $(this).attr('data-id'), $('option:selected', this).val(), $(this).attr('data-field-id'), $(this).attr('data-record-id')
      $('option:selected', this).removeAttr 'selected'
    return
  buildOptions: (level, parents) ->
    self = this
    select = contentType: CmsInnRecord.contentType
    if parents.length > 0
      select['_id'] = {}
      select['_id']['$in'] = parents
    else
      select['parents'] = []
    options = ''
    allRecords = @storage.collection.find(select)
    allRecords.forEach (record) ->
      title = Utilities.buildTitle(record, CmsInnLabel.language)
      if title == '' and record.children.length > 0
        title = 'Root'
      places = record.places or []
      options += '                 <option value="' + record._id + '">' + Array(level).join('-') + ' ' + title.substr(0, 100) + ' [' + places.join() + ']</option>             '
      if record.children.length > 0
        childLevel = level + 1
        options += RecordUI.buildOptions(childLevel, record.children)
      return
    options
  render: (element, placeId, fieldId, recordId, storage) ->
    @init storage, element
    # var addNewItemTpl = ' \
    #     <div class="au-form au-form-nav '+placeId+'"> \
    #         <div class="au-form_item"> \
    #             <select data-record-id="'+recordId+'" data-field-id="'+fieldId+'" data-id="'+placeId+'" class="au-form_input au-form_input-select js-cmsinn-selected-record"> \
    #                 <option value="none">Record to be displayed here</option> \
    #                 '+this.buildOptions(1, [])+' \
    #             </select> \
    #         </div> \
    #         <div class="au-form_item au-tip_item-actions"> \
    #             <div class="au-form_actions"> \
    #                 <button type="button" class="au-form_btn js-cmsinn-add-new-record" data-record-id="'+recordId+'" data-field-id="'+fieldId+'" data-id="'+placeId+'">Add new record</button> \
    #             </div> \
    #         </div> \
    #         <div class="au-form_item"> \
    #             <select data-record-id="'+recordId+'" data-field-id="'+fieldId+'" data-id="'+placeId+'" class="au-form_input au-form_input-select js-cmsinn-selected-parent-record"> \
    #                 <option value="none">Record for which you need to create sub record</option> \
    #                 '+this.buildOptions(1, [])+' \
    #             </select> \
    #         </div> \
    #         <div class="au-form_item au-tip_item-actions"> \
    #             <div class="au-form_actions"> \
    #                 <button type="button" class="au-form_btn js-close-record" data-id="'+placeId+'">Close</button> \
    #             </div> \
    #         </div> \
    #     </div> \
    # ';
    addNewItemTpl = '             <div class="au-form au-form-nav ' + placeId + '">                 <div class="au-form_item au-tip_item-actions">                     <div class="au-form_actions">                         <button type="button" class="au-form_btn js-cmsinn-add-new-record" data-record-id="' + recordId + '" data-field-id="' + fieldId + '" data-id="' + placeId + '">Add new record</button>                     </div>                 </div>                 <div class="au-form_item au-tip_item-actions">                     <div class="au-form_actions">                         <button type="button" class="au-form_btn js-close-record" data-id="' + placeId + '">Close</button>                     </div>                 </div>             </div>         '
    addNewItemTpl

###*
# Plugin Wrapper
#
###

gPluginName = 'record'
contentDep = new (Deps.Dependency)

###*
# jQuery plugin
###

RecordPlugin = (element, options) ->
  @$element = $(element)
  @settings = $.extend({}, options)
  @storage = null
  if 'storage' in @settings
    @storage = @settings.storage
  if 'ui' in @settings and typeof @settings.ui == 'object'
    @ui = @settings.ui
  if 'destroy' in options and options['destroy']
    @destroy()
  else
    @init()
  return

Record = ->
  @name = 'record'
  @storage = null
  @contentType = 'record'
  @ui = RecordUI
  @filters = {}
  return

Record::constructor = Record

Record::init = ->
  PluginBase::init.call this, gPluginName
  return

Record::disable = ->
  PluginBase::disable.call this, gPluginName
  $('[data-au-record]').cmsInnRecord
    destroy: true
    storage: @storage
    ui: @ui
  return

Record::enable = ->
  PluginBase::enable.call this, gPluginName
  $('[data-au-record]').cmsInnRecord
    storage: @storage
    ui: @ui
  return

Record::config = (options) ->
  PluginBase::config.call this, gPluginName
  if 'ui' in options and options.ui != null
    @ui = options.ui
  return

Record::setFilter = (options) ->
  filter = JSON.parse(options)
  if 'record' in filter
    @filters[filter['record']] = _.extend({ sort: sortOrder: 1 }, filter)
  contentDep.changed()
  return

Record::initFilter = (recordId, limit) ->
  if !(recordId in @filters)
    @filters[recordId] =
      sort: sortOrder: 1
      skip: 0
  if limit != undefined and limit >= 0
    @filters[recordId]['limit'] = limit
  else
    delete @filters[recordId]['limit']
  return

Record::query = (query, limit, parent) ->
  @initFilter parent, limit
  results = @storage.collection.find(query, @filters[parent])
  results

Record::queryOne = (query) ->
  results = @query(query, 1, 'root')
  try
    record = results.fetch()[0]
    if record
      @initFilter record._id, 1
    return record
  catch e
  return

Record::insert = (parentId, fieldId) ->
  self = this
  record = 
    contentType: CmsInnRecord.contentType
    parents: [ parentId ]
    children: []
    places: []
    types: []
    sortOrder: 0
  latest = @storage.collection.findOne({ parents: $in: [ parentId ] }, sort: sortOrder: -1)
  if latest
    record['sortOrder'] = ++latest.sortOrder
  @storage.insert record, (err, itemId) ->
    update = $addToSet: {}
    if typeof fieldId == 'string' and fieldId != '' and fieldId != 'null'
      update['$addToSet'][fieldId] = itemId
    else
      update['$addToSet']['children'] = itemId
    self.storage.update { _id: parentId }, update
    return
  return

Record::addRecord = (placeId, fieldId) ->
  self = this
  currentRootItem = @storage.collection.findOne(places: $in: [ placeId ])
  #$("[data-au-record="+placeId+"]").removeClass('empty-record');
  # If there is no root item - create new
  if !currentRootItem
    @storage.insert {
      contentType: CmsInnRecord.contentType
      places: [ placeId ]
      children: []
      parents: []
      types: []
    }, (err, rootId) ->
      self.insert rootId, fieldId
      return
  else
    self.insert currentRootItem._id, fieldId
  contentDep.changed()
  return

Record::addSubRecord = (parentId, fieldId) ->
  self = this
  parentRootItem = self.storage.collection.findOne(_id: parentId)
  if parentRootItem
    self.insert parentRootItem._id, fieldId
  return

Record::mapRecord = (placeId, recordId, fieldId, parentRecordId) ->
  self = this
  if fieldId != 'null' and fieldId != null and fieldId != undefined and fieldId.length > 0
    update = $addToSet: {}
    update['$addToSet'][fieldId] = recordId
    self.storage.update { _id: parentRecordId }, update
  else
    currentRootItem = self.storage.collection.findOne(places: $in: [ placeId ])
    if !currentRootItem
      self.storage.update { _id: recordId }, $addToSet: places: placeId
    else
      self.storage.update { _id: currentRootItem._id }, { $pull: places: placeId }, {}, (err, res) ->
        self.storage.update { _id: recordId }, $addToSet: places: placeId
        return
  return

CmsInnRecord = new Record

RecordPlugin::destroy = ->
  @$element.removeClass 'empty-record'
  @$element.removeClass 'au-mark'
  # this.$element.editable('destroy');
  @$element.poshytip 'destroy'
  @$element.off 'click'
  @ui.destroy()
  # this.$element.off('shown.bs.poshytip');
  return

RecordPlugin::init = ->
  self = this
  if @$element.height() == 0
    @$element.addClass 'empty-record'
  @$element.addClass 'au-mark'
  @$element.on 'click', (e) ->
    e.stopPropagation()
    # Destroy other poshytips
    $('[data-au-record]').each ->
      if this != self.$element
        $(this).poshytip 'destroy'
      return
    parsedAttribute = Utilities.parseAttr($(this).attr('data-au-record'))
    $(this).poshytip
      className: 'au-popover-tip'
      showOn: 'none'
      alignTo: 'target'
      alignX: 'center'
      keepInViewport: true
      fade: false
      slide: false
      content: self.ui.render($(this), parsedAttribute['id'], parsedAttribute['fieldId'], parsedAttribute['recordId'], self.storage)
    $(this).poshytip 'show'
    return
  return

if Meteor.isClient
  (($) ->

    $.fn.cmsInnRecord = (options) ->
      self = this
      @each ->
        $.data this, 'cmsInnRecord', new RecordPlugin(this, options)
        return

    return
  ) jQuery
  if UI
    UI.registerHelper 'recordByPlace', (prefix, placeId) ->
      contentDep.depend()
      prefix = if _.isNull(prefix) or _.isUndefined(prefix) then '' else prefix
      place = Utilities.normalizePrefix(prefix) + placeId
      CmsInnRecord.queryOne places: $in: [ place ]
    UI.registerHelper 'sorted', (items, parent, limit) ->
      contentDep.depend()
      items = if items == undefined then [] else items
      CmsInnRecord.query { _id: $in: items }, limit, parent
    #@todo: still not happy with this filter implementation
    UI.registerHelper 'paging', (prefix, placeId, limit) ->
      contentDep.depend()
      result = []
      prefix = if _.isNull(prefix) or _.isUndefined(prefix) then '' else prefix
      place = Utilities.normalizePrefix(prefix) + placeId
      parsedAttribute = Utilities.parseAttr(place)
      field = 'children'
      if parsedAttribute['fieldId'] != null
        field = parsedAttribute['fieldId']
      parent = CmsInnRecord.queryOne(places: $in: [ place ])
      if parent != undefined
        CmsInnRecord.filters[parent._id].limit = limit
        items = 0
        if field in parent and parent[field].length > 0
          items = parent[field].length
        pages = Math.ceil(items / limit)
        active = ''
        page = 0
        if CmsInnRecord.filters[parent._id].skip > 0
          page = CmsInnRecord.filters[parent._id].skip / CmsInnRecord.filters[parent._id].limit
        if pages > 1
          i = 0
          while i < pages
            active = if page == i then 'active' else ''
            result.push
              current: i + 1
              skip: limit * i
              limit: limit
              isActive: active
              forRecord: parent._id
            i++
      result
