Content = (document) ->
  _.extend this, document
  return

Content.prototype =
  constructor: Content
  get: (name) ->
    if _.has(this, 'draft') and _.isObject(@draft) and _.has(@draft, name)
      return @draft[name]
    else if _.has(this, name)
      return @[name]
    null
  findField: (contentType) ->
    fields = this
    if _.has(this, 'draft') and _.isObject(@draft) and !_.isEmpty(@draft)
      fields = @draft
    for field of fields
      if _.has(fields[field], 'contentType') and fields[field]['contentType'] == contentType
        fields[field]['_id'] = @_id
        return fields[field]
    null
  firstFieldWithValue: (inField) ->
    `var field`
    exclude = [
      '_id'
      'children'
      'contentType'
      'parents'
      'places'
      'types'
      'sortOrder'
      'isDraft'
      'draft'
    ]
    lookup = {}
    if _.isUndefined(inField)
      for field of this
        if @hasOwnProperty(field)
          if _.indexOf(exclude, field, true) == -1
            if _.isString(@get(field)) and @get(field) != ''
              return @get(field)
    else if _.has(this, inField)
      for field of @[inField]
        if @[inField].hasOwnProperty(field)
          if _.indexOf(exclude, field, true) == -1
            if _.isString(@[inField][field]) and @[inField][field] != ''
              return @[inField][field]
    ''
@ContentCollection = new (Meteor.Collection)('au-cmsinn-content', transform: (document) ->
  new Content(document)
)

canEdit = ->
  user = undefined
  roles = undefined
  user = Meteor.user()
  if user
    roles = user.roles
    return roles.indexOf('admin') != -1 or roles.indexOf('editor') != -1
  false

if Meteor.isServer
  ContentCollection.allow
    insert: (userId, doc) ->
      canEdit()
    update: (userId, doc, fields, modifier) ->
      canEdit()
    remove: (userId, doc) ->
      canEdit()
if Meteor.isClient
  # make the collection available for the client
  window.ContentCollection = ContentCollection
