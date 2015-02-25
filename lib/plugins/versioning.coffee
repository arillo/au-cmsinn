hooks = 
  'beforeInsert': (doc) ->
    if CmsInnVersioning.publishCall == false
      doc['isDraft'] = true
    return
  'beforeUpdate': (selector, modifier, options) ->
    if CmsInnVersioning.publishCall == false
      if not modifier.$addToSet? and not modifier.$pull?
        current = modifier['$set']
        modifier['$push'] = 'draft.__statement__': JSON.stringify(modifier)
        modifier['$set'] = {}
        _.each current, (value, key) ->
          if key != 'draft'
            modifier['$set']['draft.' + key] = value
          return
    return
  'beforePublish': (query, options, userId) ->
    query['isDraft'] = false
    if !options['fields']
      options['fields'] = {}
    options.fields.draft = 0
    # var superUser = Roles.userIsInRole(userId, CmsInnVersioning.adminRoles);
    superUser = Roles.userIsInRole(userId, [
      'admin'
      'editor'
    ])
    # if(CmsInnVersioning.insecure === true){
    #     superUser = true;
    # }
    if superUser
      delete query['isDraft']
      delete options.fields.draft
    return

gPluginName = 'versioning'

Version = ->
  @name = 'versioning'
  @storage = null
  @hooks = hooks
  @publishCall = false
  @adminRoles = []
  # this.insecure = false;
  return

Version::constructor = Version

Version::init = ->
  PluginBase::init.call this, gPluginName
  return

Version::disable = ->
  PluginBase::disable.call this, gPluginName
  return

Version::enable = ->
  PluginBase::enable.call this, gPluginName
  self = this
  self.publishAll()
  return

Version::publishAll = ->
  self = this
  self.publishCall = true
  cursor = self.storage.collection.find({ draft: $exists: true }, fields: draft: 1)
  cursor.forEach (item) ->
    _.each item['draft']['__statement__'], (val) ->
      update = JSON.parse(val)
      self.publishCall = true
      self.storage.update { _id: item._id }, update, {}, (err, docs) ->
        self.publishCall = false
        return
      return
    self.publishCall = true
    self.storage.update { _id: item._id }, { $set: 'draft': {} }, {}, (err, docs) ->
      self.publishCall = false
      return
    return
  self.publishCall = true
  self.storage.update { isDraft: true }, { $set: isDraft: false }, { multi: true }, (err, docs) ->
    self.publishCall = false
    return
  return

Version::config = (options) ->
  self = this
  if 'adminRoles' in options
    self.adminRoles = options.adminRoles
  # if('insecure' in options){
  #     self.insecure = true;
  # }
  return

@CmsInnVersioning = new Version
