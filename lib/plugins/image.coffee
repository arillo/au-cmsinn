###*
# jQuery plugin
###

ImagePlugin = (element, options) ->
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

if Meteor.isServer
  gm = Npm.require('gm')
  Meteor.methods '/au-cmsinn/image/resize': (options) ->
    check options, Match.ObjectIncluding(size: String)
    image = null
    if options.recordId == null
      if CmsInnImage.storage.collection == null
        return true
      image = CmsInnImage.storage.collection.findOne(_id: options.id)
    else
      item = CmsInnImage.storage.collection.findOne(_id: options.recordId)
      if _.isObject(item)
        image = item.get(options.fieldId)
        if _.isObject(image)
          _g = _.pick(item, 'get')
          _.extend image, _g
    if _.isObject(image)
      if _.has(image.get('sizes'), options.size)
        return true
      regex = /^data:.+\/(.+);base64,(.*)$/
      # image.get('imageData')
      # check when new image or existing one
      imageData = image.get('imageData')
      if _.isNull(imageData)
        imageData = item[options.fieldId].imageData
      matches = imageData.match(regex)
      ext = matches[1]
      data = matches[2]
      buf = new Buffer(data, 'base64')
      updateImage = Meteor.bindEnvironment(((ext, buffer, options) ->
        sizeData = 'data:image/' + ext + ';base64,' + buffer.toString('base64')
        update = $set: {}
        # @FIX: try to delay sizes_available to deliver new image
        if options.recordId != null
          update['$set'][options.fieldId + '.sizes.' + options.size] = sizeData
          update['$set'][options.fieldId + '.sizes_available.' + options.size] = 1
          CmsInnImage.storage.update { _id: options.recordId }, update
        else
          update['$set']['sizes.' + options.size] = sizeData
          update['$set']['sizes_available.' + options.size] = sizeData
          CmsInnImage.storage.update { _id: options.id }, update
        return
      ), (e) ->
        throw e
        return
      )
      method = options.size.split('_')
      dimensions = method[1].split('x')
      gmm = method[0]
      # check gainst values
      # , "!" don't force a resize
      switch gmm
        when 'cropresize'
          # The '^' argument on the resize function will tell
          # GraphicsMagick to use the height and width as a minimum
          # instead of the default behavior, maximum.
          gm(buf).resize(dimensions[0], dimensions[1], '^').gravity('Center').crop(dimensions[0], dimensions[1]).quality(100).toBuffer (err, buffer) ->
            updateImage ext, buffer, options
            return
        when 'crop'
          gm(buf).crop(dimensions[0], dimensions[1]).gravity('Center').quality(100).toBuffer (err, buffer) ->
            updateImage ext, buffer, options
            return
        when 'scale'
          gm(buf).scale(dimensions[0], dimensions[1]).quality(100).toBuffer (err, buffer) ->
            updateImage ext, buffer, options
            return
        when 'resize'
          gm(buf).resize(dimensions[0], dimensions[1]).quality(100).toBuffer (err, buffer) ->
            updateImage ext, buffer, options
            return
        when 'original'
          gm(buf).quality(100).toBuffer (err, buffer) ->
            updateImage ext, buffer, options
            return
        else
          throw new (Meteor.error)('gm method not impkemented')
          break
    return
# special route to deliver images asynchronously
Router.route '/imageserver/:imageId/:prefix/:size', (->
  b = undefined
  headers = undefined
  image = undefined
  imageId = undefined
  prefix = undefined
  size = undefined
  imageId = @params.imageId
  prefix = @params.prefix
  size = @params.size
  if prefix != undefined and typeof prefix == 'string'
    imageId = prefix + imageId
  image = CmsInn.plugins.image.getSized(imageId, size)
  b = new Buffer(image.sizes[size].substr(image.sizes[size].lastIndexOf('base64,') + 7), 'base64')
  # console.log(image.sizes[size].substr(image.sizes[size].lastIndexOf('base64,')+7));
  headers =
    'Content-type': 'image/png'
    'Content-Length': b.length
  @response.writeHead 200, headers
  @response.end b
),
  name: 'imageserver'
  where: 'server'
gPluginName = 'image'

###*
# Plugin Wrapper
#
###

Image = ->
  @name = 'image'
  @hooks = 
    beforePublish: (query, options, userId) ->
      options['fields'] = {} if !options['fields']
      # @FIX, don't send imageData over the wire, any type
      if Utilities.isEditor(userId)
        options.fields['image.imageData'] = 0
        options.fields['image2.imageData'] = 0
        options.fields['image_xl.imageData'] = 0
      else
        options.fields['image.imageData'] = 0
        options.fields['image.sizes'] = 0
        options.fields['image2.imageData'] = 0
        options.fields['image2.sizes'] = 0
        options.fields['image_xl.imageData'] = 0
        options.fields['image_xl.sizes'] = 0
      return
  @storage = null
  @contentType = 'image'
  return

Image::constructor = Image

Image::init = ->
  PluginBase::init.call this, gPluginName
  return

Image::disable = ->
  PluginBase::disable.call this, gPluginName
  $('[data-au-image]').cmsInnImage
    destroy: true
    storage: @storage
  return

Image::enable = ->
  PluginBase::enable.call this, gPluginName
  $('[data-au-image]').cmsInnImage
    storage: @storage
    onAdded: ->
  return

Image::config = (options) ->
  PluginBase::config.call this, gPluginName
  return

Image::getSized = (imageId, size) ->
  parsedAttribute = Utilities.parseAttr(imageId)
  img = null
  if parsedAttribute['recordId'] == null
    img = @storage.collection.findOne(_id: parsedAttribute['id'])
  else
    item = @storage.collection.findOne(_id: parsedAttribute['recordId'])
    if _.isObject(item)
      img = item.get(parsedAttribute['fieldId'])
      if _.isObject(img)
        _g = _.pick(item, 'get')
        _.extend img, _g
  if _.isObject(img) and _.has(img.get('sizes'), size)
    img.imageData = img.get('sizes')[size]
    return img
  else
    options = 
      id: parsedAttribute['id']
      recordId: parsedAttribute['recordId']
      fieldId: parsedAttribute['fieldId']
      size: size
    Meteor.apply '/au-cmsinn/image/resize', [ options ]
  return

Image::getSizedAvailable = (imageId, size) ->
  parsedAttribute = Utilities.parseAttr(imageId)
  img = null
  # console.log(this.storage);
  if parsedAttribute['recordId'] == null
    img = @storage.collection.findOne(_id: parsedAttribute['id'])
    # console.log('img', img);
  else
    item = @storage.collection.findOne(_id: parsedAttribute['recordId'])
    # console.log('item', item);
    if _.isObject(item)
      img = item.get(parsedAttribute['fieldId'])
      if _.isObject(img)
        _g = _.pick(item, 'get')
        _.extend img, _g
  # console.log(img);
  if _.isObject(img) and _.isObject(img.sizes_available) and _.has(img.get('sizes_available'), size)
    return true
  false

Image::save = (imageId, file, imageData) ->
  `var updateObject`
  parsedAttribute = Utilities.parseAttr(imageId)
  if parsedAttribute['recordId'] != null
    updateObject = {}
    updateObject[parsedAttribute['fieldId'] + '.imageData'] = imageData
    updateObject[parsedAttribute['fieldId'] + '.name'] = file.name
    updateObject[parsedAttribute['fieldId'] + '.sizes'] = {}
    updateObject[parsedAttribute['fieldId'] + '.sizes_available'] = {}
    updateObject[parsedAttribute['fieldId'] + '.isDraft'] = false
    @storage.update { _id: parsedAttribute['recordId'] }, $set: updateObject
  else
    currentImage = @storage.collection.findOne(_id: parsedAttribute['id'])
    if currentImage
      updateObject = {}
      updateObject['imageData'] = imageData
      updateObject['name'] = file.name
      updateObject['sizes'] = {}
      updateObject['sizes_available'] = {}
      updateObject['isDraft'] = false
      @storage.update { _id: parsedAttribute['id'] }, $set: updateObject
    else
      @storage.insert
        _id: parsedAttribute['id']
        name: file.name
        imageData: imageData
        contentType: @contentType
        sizes: {}
        sizes_available: {}
        isDraft: false
  return

CmsInnImage = new Image

ImagePlugin::destroy = ->
  @$element.removeClass 'image-mark'
  @$element.removeClass 'image-drag-enter'
  @$element.removeClass 'image-drag-leave'
  @$element.removeClass 'image-drag-drop'
  @$element.off 'dragover'
  @$element.off 'dragleave'
  @$element.off 'dragenter'
  @$element.off 'drop'
  return

ImagePlugin::init = ->
  self = this
  imageId = @$element.attr('data-au-image')
  @$element.addClass 'image-mark'
  @$element.on 'dragover', (evt) ->
    evt.stopPropagation()
    evt.preventDefault()
    return
  @$element.on 'dragleave', (evt) ->
    evt.stopPropagation()
    evt.preventDefault()
    $(this).removeClass 'image-drag-enter'
    $(this).removeClass 'image-drag-leave'
    $(this).removeClass 'image-drag-drop'
    $(this).addClass 'image-mark'
    return
  @$element.on 'dragenter', (evt) ->
    evt.stopPropagation()
    evt.preventDefault()
    $(this).removeClass 'image-mark'
    $(this).removeClass 'image-drag-leave'
    $(this).removeClass 'image-drag-drop'
    $(this).addClass 'image-drag-enter'
    return
  @$element.on 'drop', (evt) ->
    evt.stopPropagation()
    evt.preventDefault()
    $(this).removeClass 'image-mark'
    $(this).removeClass 'image-drag-enter'
    $(this).removeClass 'image-drag-leave'
    $(this).addClass 'image-drag-drop'
    if evt.originalEvent
      files = evt.originalEvent.dataTransfer.files
      if files and files[0]
        reader = new FileReader

        reader.onload = (e) ->
          self.$element.attr 'src', e.target.result
          Notifications.success 'uploading image'
          CmsInnImage.save imageId, files[0], e.target.result
          return

        reader.readAsDataURL files[0]
    return
  return

if Meteor.isClient
  (($) ->

    $.fn.cmsInnImage = (options) ->
      @each ->
        $.data this, 'cmsInnImage', new ImagePlugin(this, options)
        return

    return
  ) jQuery
  if UI
    UI.registerHelper 'existImg', (prefix, imageId, size) ->
      if prefix != undefined and typeof prefix == 'string'
        imageId = prefix + imageId
      if Utilities.isEditor(Meteor.userId())
        # call getSized to create missing image size
        image = CmsInnImage.getSized(imageId, size)
        true
      else
        # return true if sizes_available for this size is true
        CmsInnImage.getSizedAvailable imageId, size
    UI.registerHelper 'loadImg', (prefix, imageId, size, placeholder) ->
      if Utilities.isEditor(Meteor.userId())
        if prefix != undefined and typeof prefix == 'string'
          imageId = prefix + imageId
        # check for existing size, otherwise show placeholder image
        image = CmsInnImage.getSized(imageId, size)
        if image != undefined
          image.imageData
        else
          if placeholder != undefined and typeof placeholder == 'string'
            return placeholder
          'http://placehold.it/' + size.split('_')[1]
      else
        '/imageserver/' + imageId + '/' + prefix + '/' + size
