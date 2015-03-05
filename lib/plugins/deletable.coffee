gPluginName = 'deletable'

###*
# Helper functions
#
###

# function template(pathToImage){
#     var addNewItemTpl = ' \
#         <div id="trash" class="au-deletable-icon"></div>\
#     ';
#     return addNewItemTpl;
# }

###*
# Plugin Wrapper
#
###

###*
# jQuery plugin
###

DeletablePlugin = (element, options) ->
  @$element = $(element)
  @settings = $.extend({}, options)

  @storage = @settings.storage if @settings.storage
  
  if options is 'destroy' then @destroy() else @init()

Deletable = ->
  @storage = null
  @name = 'deletable'
  # this.trash = template();
  return

Deletable::constructor = Deletable

Deletable::init = ->
  PluginBase::init.call this, gPluginName
  return

Deletable::disable = ->
  PluginBase::disable.call this, gPluginName
  $('[data-au-deletable]').cmsInnDeletable 'destroy'
  return

Deletable::enable = ->
  PluginBase::enable.call this, gPluginName
  $('[data-au-deletable]').cmsInnDeletable storage: @storage
  return

Deletable::config = (options) ->
  PluginBase::config.call this, gPluginName
  # if(options and options.trash){
  #     if(typeof options.trash === 'function'){
  #         this.trash = options.trash();
  #     } else if(typeof options.trash === 'string'){
  #         this.trash = options.trash;
  #     }
  # }
  return

@CmsInnDeletable = new Deletable

DeletablePlugin::destroy = ->
  # console.log('destroy deletable', this.$element);
  @$element.removeClass 'au-mark-delete'
  @$element.off 'click'
  # this.$element.draggable("destroy");
  return

# DeletablePlugin.prototype.initTrash = function(){
#     var self = this;
#     $('body').append(this.settings.trash);
#     this.settings.trash.hide();
#     this.settings.trash.droppable({
#         drop: function(event, ui) {
#             var elementToDelete = $(ui.draggable).attr('data-au-deletable');
#             var parsedAttribute = Utilities.parseAttr(elementToDelete);
#             var itemId = parsedAttribute['id'];
#             if(parsedAttribute['recordId']){
#                 itemId = parsedAttribute['recordId'];
#             }
#             var item = self.storage.collection.findOne({_id: itemId});
#             if(item){
#                 // check if just a property is affected
#                 if(field = parsedAttribute.fieldId){
#                     var update = {};
#                     update[field] = null
#                     self.storage.update({ _id:itemId }, { $set: update });
#                 } else {
#                     // first delete item from parents then the item itself
#                     var parents = self.storage.collection.find({parents:{$in:item['parents']}});
#                     $.each(item['parents'], function(key, id){
#                         var pull = {
#                             $pull : {children:itemId}
#                         };
#                         if(parsedAttribute['fieldId']){
#                             pull['$pull'][parsedAttribute['fieldId']] = itemId;
#                         }
#                         self.storage.update({_id:id}, pull);
#                     })
#                     self.storage.remove({
#                         _id: itemId
#                     });
#                 }
#             }
#         }
#     });
# };

DeletablePlugin::deleteItem = (elementToDelete) ->
  if confirm('Are you sure you want to delete the element: ' + elementToDelete + ' ?') == true
    parsedAttribute = Utilities.parseAttr(elementToDelete)
    itemId = parsedAttribute['id']
    if parsedAttribute['recordId']
      itemId = parsedAttribute['recordId']
    self = this
    item = self.storage.collection.findOne(_id: itemId)
    if item
      # check if just a property is affected
      if field = parsedAttribute.fieldId
        update = {}
        update[field] = 0
        self.storage.update { _id: itemId }, $unset: update
      else
        # first delete item from parents then the item itself
        parents = self.storage.collection.find(parents: $in: item['parents'])
        $.each item['parents'], (key, id) ->
          pull = $pull: children: itemId
          if parsedAttribute['fieldId']
            pull['$pull'][parsedAttribute['fieldId']] = itemId
          self.storage.update { _id: id }, pull
          return
        self.storage.remove _id: itemId
  else
  return

DeletablePlugin::init = ->
  self = this
  @$element.addClass 'au-mark-delete'
  @$element.on 'click', (e) ->
    e.preventDefault()
    e.stopPropagation()
    self.deleteItem $(e.currentTarget).attr('data-au-deletable')
    return
  # this.$element.draggable({
  #     start: function() {
  #         self.initTrash();
  #         self.settings.trash.fadeIn(500);
  #     },
  #     stop: function(){
  #         self.settings.trash.fadeOut(500);
  #     },
  #     cursor: 'move',
  #     helper: 'clone',
  #     revert: "invalid",
  # });
  return

if Meteor.isClient
  (($) ->

    $.fn.cmsInnDeletable = (options) ->
      self = this
      @each ->
        $.data this, 'cmsInnDeletable', new DeletablePlugin(this, options)
        return

    return
  ) jQuery
