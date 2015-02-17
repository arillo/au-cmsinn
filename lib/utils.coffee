@Log = new Logger('cms')
Logger.setLevel 'warn'
Log.info 'starting up...'

if Meteor.isServer
  allowEnv NODE_ENV: 1

node_env = process.env.NODE_ENV

if typeof node_env != 'undefined' and node_env == 'development'
  Logger.setLevel 'trace'

Utilities =
  CONST_RECORD_ID: 'recordId'
  CONST_FIELD_ID: 'fieldId'
  CONST_ID: 'id'

###*
# Normalize prefix
#
# @param {String} value 
###

Utilities.normalizePrefix = (value) ->
  value.replace(/\s+/g, '').replace /\W/g, ''

###*
# Parse attribute value and look for pattern RECORD_ID[FIELD]
# if not found remove all non-alphanumeric chars and return, 
# because it will be used as id
#
# @param {String} value string passed in data-au-* attribute.
###

Utilities.parseAttr = (value) ->
  res = value.split(/^((\w+)\[(\w+)\])$/ig)
  if res.length == 1
    return {
      recordId: null
      fieldId: null
      id: res[0].replace(/\s+/g, '').replace(/\W/g, '')
    }
  {
    recordId: res[2]
    fieldId: res[3]
    id: res[1]
  }

###*
# Find first string field in record
#
# @param {Object} record.
###

Utilities.firstField = (record) ->
  exclude = [
    '_id'
    'children'
    'contentType'
    'parents'
    'places'
    'types'
    'sortOrder'
    'isDraft'
  ]
  for field of record
    if exclude.indexOf(field) == -1
      if typeof record[field] == 'string' and record[field].length > 0
        return record[field]
  ''

###*
# Build title from record
#
# @param {Object} record.
# @param {String} language.
# 
# @return {String}
###

Utilities.buildTitle = (record, language) ->
  exclude = [
    '_id'
    'children'
    'contentType'
    'parents'
    'places'
    'types'
    'sortOrder'
    'isDraft'
  ]
  title = []
  for field of record
    if exclude.indexOf(field) == -1 and typeof record[field] == 'object' and language in record[field] and typeof record[field][language] == 'string' and record[field][language].length > 0
      title.push record[field][language]
  title.join()

if Meteor.isClient

  Utilities.isEditor = (userId) ->
    (Meteor.Device.isDesktop() or Meteor.Device.isTablet()) and Roles.userIsInRole(userId, [
      'admin'
      'editor'
    ])

  Utilities.isAdmin = (userId) ->
    (Meteor.Device.isDesktop() or Meteor.Device.isTablet()) and Roles.userIsInRole(userId, [ 'admin' ])

if Meteor.isServer

  Utilities.isEditor = (userId) ->
    Roles.userIsInRole userId, [
      'admin'
      'editor'
    ]

  Utilities.isAdmin = (userId) ->
    Roles.userIsInRole userId, [ 'admin' ]
