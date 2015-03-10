###*
# Plugin Wrapper
#
###

gPluginName = 'record'
contentDep = new (Deps.Dependency)

Record = ->
  @name = 'record'
  @storage = null
  @contentType = 'record'
  @filters = {}
  return

Record::constructor = Record

Record::init = ->
  PluginBase::init.call this, gPluginName
  return

Record::disable = ->
  PluginBase::disable.call this, gPluginName
  
Record::enable = ->
  PluginBase::enable.call this, gPluginName
  
Record::config = (options) ->
  PluginBase::config.call this, gPluginName
  if options and options.ui?
    @ui = options.ui
  return

Record::setFilter = (options) ->
  filter = JSON.parse(options)
  if filter and filter.record?
    @filters[filter['record']] = _.extend({ sort: sortOrder: 1 }, filter)
  contentDep.changed()
  return

Record::initFilter = (recordId, limit) ->
  if !(@filters.recordId?)
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

CmsInnRecord = new Record

if Meteor.isClient
  UI.registerHelper 'recordByPlace', (prefix, placeId) ->
    contentDep.depend()
    prefix = if _.isNull(prefix) or _.isUndefined(prefix) then '' else prefix
    place = Utilities.normalizePrefix(prefix) + placeId
    CmsInnRecord.queryOne places: $in: [ place ]

  UI.registerHelper 'sorted', (items, parent, limit) ->
    contentDep.depend()
    items = if items == undefined then [] else items
    CmsInnRecord.query { _id: $in: items }, limit, parent

  UI.registerHelper 'sortedIndex', (items, parent, limit) ->
    contentDep.depend()
    items = if items == undefined then [] else items
    items = CmsInnRecord.query { _id: $in: items }, limit, parent
    items.map (item, index) ->
      item._index = index + 1
      item
