# ----------------------------------- Label Plugin UI bit --------------------------------------//

###*
# Plugin UI 
# This has to be easy to extend or replace
# Allow injecting UI object from outside through settings
###

#function LabelPluginUI(){
#
#}
#
#// Render UI HTML and return it
#LabelPluginUI.prototype.render = function(){
#
#}
#
#// Destroy UI
#LabelPluginUI.prototype.destroy = function(){
#
#}
#
#// Init UI
#LabelPluginUI.prototype.init = function(){
#
#}
# ----------------------------------- Label Plugin UI bit --------------------------------------//
# ----------------------------------- Label Plugin bit --------------------------------------//
window.$ = jQuery

gPluginName = 'label'
gLabelName = 'label'
gContentType = 'label'
gSelector = 'data-au-label'
contentDep = new (Tracker.Dependency)

###*
# Label plugin constructor
###

LabelPlugin = (name, contentType, selector, ui, storage) ->
  # Call base constructor to set storage
  PluginBase::constructor.call this, storage
  @selector = selector
  @ui = ui
  @name = name
  @contentType = contentType
  @language = 'en_US'
  @defaultEmptyString = ''
  return

LabelPlugin.prototype = CmsInnPluginBase
LabelPlugin::constructor = PluginBase

LabelPlugin::init = ->
  PluginBase::init.call this, gPluginName
  return

LabelPlugin::disable = ($) ->
  PluginBase::disable.call this, gPluginName
  $(@selector).hallo editable: false
  $('.hallolink-dialog').off().remove()
  $('.hallotoolbar').off().remove()
  $(@selector).hallo 'destroy'
  $(@selector).off 'hallodeactivated'
  $(@selector).off 'click'
  # save changed labels
  _.each @labelsToSave.normal, _.bind(((labelToSave) ->
    $(labelToSave.el).html ''
    @upsertRecordField.apply this, labelToSave.args
    return
  ), this)
  _.each @labelsToSave.selfContained, _.bind(((labelToSave) ->
    $(labelToSave.el).html ''
    @upsertRecord.apply this, labelToSave.args
    return
  ), this)
  return

LabelPlugin::enable = ($) ->
  PluginBase::enable.call this, gPluginName
  self = this
  halloPlugins = 
    'halloheadings': {}
    'halloformat': {}
    'hallolists': {}
    'halloreundo': {}
    'halloenhancedlink': {}
  halloPluginNames = _.keys(halloPlugins)

  $(@selector).hallo
    editable: true
    plugins: halloPlugins
  $(@selector).on 'click', (e) ->
    e.stopPropagation()
    elemHalloPluginNames = []
    elemHalloPlugins = $(e.currentTarget).data('hallo-plugins')
    $halloToolbar = $('.hallotoolbar')
    if elemHalloPlugins != null
      if elemHalloPlugins == 'all'
        elemHalloPluginNames = halloPluginNames
      else
        elemHalloPluginNames = _.filter(elemHalloPlugins.split(','), (item) ->
          ! !item
        )
        if !elemHalloPluginNames.length
          elemHalloPluginNames = []
    pluginsToShow = _.intersection(halloPluginNames, elemHalloPluginNames)
    pluginsToHide = _.difference(halloPluginNames, elemHalloPluginNames)
    _.each pluginsToShow, (plugin) ->
      $halloToolbar.find('.' + plugin).show()
      return
    _.each pluginsToHide, (plugin) ->
      $halloToolbar.find('.' + plugin).hide()
      return
    return
  @labelsToSave =
    normal: []
    selfContained: []
  $(@selector).on 'hallodeactivated', (e) ->
    newValue = $(e.currentTarget).html()
    parsedLabel = Utilities.parseAttr($(this).attr(gSelector))
    label = getRecordLabel('[' + parsedLabel.fieldId + ']', parsedLabel.recordId)
    if newValue == label
      return
    # If there is no record id, so it is self-contained record
    if parsedLabel[Utilities.CONST_RECORD_ID] == null
      self.labelsToSave.selfContained.push
        el: e.currentTarget
        args: [
          parsedLabel[Utilities.CONST_ID]
          newValue
        ]
    else
      self.labelsToSave.normal.push
        el: e.currentTarget
        args: [
          parsedLabel[Utilities.CONST_RECORD_ID]
          parsedLabel[Utilities.CONST_FIELD_ID]
          newValue
        ]
    return
  return

LabelPlugin::config = ->
  PluginBase::config.call this, gPluginName
  return

LabelPlugin::upsertRecord = (id, value, language) ->
  self = this
  if language == undefined
    language = @language
  updateObject = {}
  insertObject = {}
  updateObject[language] = value
  insertObject[language] = value
  @storage.update { _id: id }, { $set: updateObject }, {}, (err, docNum) ->
    if docNum == 0
      insertObject['_id'] = id
      insertObject['contentType'] = self.contentType
      self.storage.insert insertObject
    return
  contentDep.changed()
  return

LabelPlugin::upsertRecordField = (id, field, value, language) ->
  self = this
  if language == undefined
    language = @language
  updateObject = {}
  updateObject[field + '.' + language] = value
  self.storage.update { _id: id }, $set: updateObject
  contentDep.changed()
  return

LabelPlugin::getLanguage = ->
  @language

LabelPlugin::setLanguage = (lng) ->
  @language = lng
  contentDep.changed()
  return

LabelPlugin::setLocale = (id) ->
  locale = CmsInnLocale.get(id)
  if locale
    @language = locale
    contentDep.changed()
  return

LabelPlugin::getRecord = (label) ->
  contentDep.depend()
  currentLabel = @storage.collection.findOne(_id: label)
  if currentLabel
    result = currentLabel.get(@language)
    if _.isNull(result)
      return currentLabel.firstFieldWithValue()
    result
  else
    @defaultEmptyString + label

LabelPlugin::getRecordField = (recordId, field) ->
  contentDep.depend()
  record = @storage.collection.findOne(_id: recordId)
  if record
    result = record.get(field)
    if result and result[@language]
      return result[@language]
    if record.firstFieldWithValue(field)
      return record.firstFieldWithValue(field)
  @defaultEmptyString + field

CmsInnLabel = new LabelPlugin(gLabelName, gContentType, '[' + gSelector + ']')
# ----------------------------------- Label Plugin bit --------------------------------------//
# ----------------------------------- jQuery bit --------------------------------------//

getRecordLabel = (label, prefix) ->
  if prefix != undefined and typeof prefix == 'string'
    label = prefix + label
  parsedLabel = Utilities.parseAttr(label)
  if parsedLabel[Utilities.CONST_RECORD_ID] == null
    CmsInnLabel.getRecord parsedLabel[Utilities.CONST_ID]
  else
    CmsInnLabel.getRecordField parsedLabel[Utilities.CONST_RECORD_ID], parsedLabel[Utilities.CONST_FIELD_ID]

# Run this only on client
if Meteor.isClient
  if UI
    UI.registerHelper 'c', (label, prefix) ->
      contentDep.depend()
      new_label = getRecordLabel(label, prefix)
      if new_label == label.slice(1, -1) and !Utilities.isEditor(Meteor.userId())
        return ''
      new_label
    UI.registerHelper 'c_empty', (label, prefix) ->
      contentDep.depend()
      if Utilities.isEditor(Meteor.userId())
        return false
      new_label = getRecordLabel(label, prefix)
      if new_label == label.slice(1, -1)
        return true
      false
