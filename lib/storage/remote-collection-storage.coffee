if Meteor.isServer
  Meteor.methods
    '/au-cmsinn/storage/update': (options) ->
      #try{
      result = ContentCollection.update(options.selector, options.modifier, options.options)
      result
      #} catch (e){
      #    console.log(e);
      #}
    '/au-cmsinn/storage/insert': (options) ->
      #try{
      result = ContentCollection.insert(options.doc)
      result
      #} catch (e){
      #    console.log(e);
      #}
    '/au-cmsinn/storage/remove': (options) ->
      #try{
      result = ContentCollection.remove(options.selector)
      result
      #} catch (e){
      #    console.log(e);
      #}

###*
# Implementation that uses Meteor.apply()
###

RemoteCollectionStorageAdapter = ->
  @live = true
  @collection = ContentCollection
  return

RemoteCollectionStorageAdapter::constructor = RemoteCollectionStorageAdapter

RemoteCollectionStorageAdapter::update = (selector, modifier, options, callback) ->
  callOptions = 
    selector: selector
    modifier: modifier
    options: options
  Meteor.apply '/au-cmsinn/storage/update', [ callOptions ], callback
  return

RemoteCollectionStorageAdapter::insert = (doc, callback) ->
  callOptions = doc: doc
  Meteor.apply '/au-cmsinn/storage/insert', [ callOptions ], callback
  return

RemoteCollectionStorageAdapter::remove = (selector, options, callback) ->
  callOptions = 
    selector: selector
    options: options
  Meteor.apply '/au-cmsinn/storage/remove', [ callOptions ], callback
  return
