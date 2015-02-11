if(Meteor.isServer){
    var gm = Npm.require('gm');
    Meteor.methods({
        '/au-cmsinn/image/resize' : function(options){
            check(options, Match.ObjectIncluding({
                size: String
            }));

            var image = null;
            if(options.recordId === null){
                if(CmsInnImage.storage.collection === null){
                    return true;
                }
                image = CmsInnImage.storage.collection.findOne({
                    _id: options.id
                });
            } else {
                var item = CmsInnImage.storage.collection.findOne({_id:options.recordId});

                if(_.isObject(item)){
                    image = item.get(options.fieldId);
                    if(_.isObject(image)){
                         var _g = _.pick(item, 'get');
                        _.extend(image, _g);
                    }
                }
            }

            if(_.isObject(image)){
                if(_.has(image.get('sizes'), options.size)){
                    return true;
                }

                var regex = /^data:.+\/(.+);base64,(.*)$/;

                // image.get('imageData')
                // check when new image or existing one
                var imageData = image.get('imageData');
                if(_.isNull(imageData)) imageData = item[options.fieldId].imageData;

                var matches = imageData.match(regex);
                var ext = matches[1];
                var data = matches[2];
                var buf = new Buffer(data, 'base64');

                var updateImage = Meteor.bindEnvironment(function(ext, buffer, options){
                    var sizeData = 'data:image/'+ext+';base64,'+buffer.toString('base64');
                    var update = {$set:{}};

                    // @FIX: try to delay sizes_available to deliver new image
                    if(options.recordId !== null){
                        update['$set'][options.fieldId+'.sizes.'+options.size] = sizeData;
                        update['$set'][options.fieldId+'.sizes_available.'+options.size] = 1;
                        CmsInnImage.storage.update({_id:options.recordId}, update);
                    } else {
                        update['$set']['sizes.'+options.size] = sizeData;
                        update['$set']['sizes_available.'+options.size] = sizeData;
                        CmsInnImage.storage.update({_id:options.id}, update);
                    }

                }, function(e){
                    throw e;
                });

                var method = options.size.split("_");
                var dimensions = method[1].split("x");
                var gmm = method[0];
                // check gainst values
                // , "!" don't force a resize
                switch(gmm){
                    case 'cropresize':
                        // The '^' argument on the resize function will tell
                        // GraphicsMagick to use the height and width as a minimum
                        // instead of the default behavior, maximum.
                        gm(buf)
                            .resize(dimensions[0], dimensions[1], '^')
                            .gravity('Center')
                            .crop(dimensions[0], dimensions[1])
                            .quality(100)
                            .toBuffer(function (err, buffer) {
                                updateImage(ext, buffer, options);
                            });
                    break;
                    case 'crop':
                        gm(buf).crop(dimensions[0], dimensions[1]).gravity('Center').quality(100).toBuffer(function (err, buffer) {
                            updateImage(ext, buffer, options);
                        });
                    break;
                    case 'scale':
                        gm(buf).scale(dimensions[0], dimensions[1]).quality(100).toBuffer(function (err, buffer) {
                            updateImage(ext, buffer, options);
                        });
                    break;
                    case 'resize':
                        gm(buf).resize(dimensions[0], dimensions[1]).quality(100).toBuffer(function (err, buffer) {
                            updateImage(ext, buffer, options);
                        });
                    break;
                    case 'original':
                        gm(buf).quality(100).toBuffer(function (err, buffer) {
                            updateImage(ext, buffer, options);
                        });
                    break;
                    default:
                        throw new Meteor.error('gm method not impkemented')
                    break;
                }

            }
        },
    });
}

// special route to deliver images asynchronously
Router.route('/imageserver/:imageId/:prefix/:size', function() {
  var b, headers, image, imageId, prefix, size;
  imageId = this.params.imageId;
  prefix = this.params.prefix;
  size = this.params.size;
  if (prefix !== void 0 && typeof prefix === 'string') {
    imageId = prefix + imageId;
  }
  image = CmsInn.plugins.image.getSized(imageId, size);
  b = new Buffer(image.sizes[size].substr(image.sizes[size].lastIndexOf('base64,')+7), 'base64');
  // console.log(image.sizes[size].substr(image.sizes[size].lastIndexOf('base64,')+7));
  headers = {
    'Content-type': 'image/png',
    'Content-Length': b.length
  };
  this.response.writeHead(200, headers);
  return this.response.end(b);
}, {
  name: 'imageserver',
  where: 'server'
});


var gPluginName = 'image';

/**
 * Plugin Wrapper
 **/
Image = function(){
    this.hooks = {
        beforePublish: function(query, options, userId){
            if(!options['fields']){
                options['fields'] = {}
            }
            // @FIX, don't send imageData over the wire, any type
            if(Utilities.isEditor(userId)){
                options.fields['image.imageData'] = 0;
                options.fields['image2.imageData'] = 0;
                options.fields['image_xl.imageData'] = 0;
            } else {
                options.fields['image.imageData'] = 0;
                options.fields['image.sizes'] = 0;
                options.fields['image2.imageData'] = 0;
                options.fields['image2.sizes'] = 0;
                options.fields['image_xl.imageData'] = 0;
                options.fields['image_xl.sizes'] = 0;
            }
        }
    }
    this.storage = null;
    this.contentType = 'image';
};

Image.prototype.constructor = Image;

Image.prototype.init = function(){
    PluginBase.prototype.init.call(this, gPluginName);
};

Image.prototype.disable = function(){
    PluginBase.prototype.disable.call(this, gPluginName);

    $("[data-au-image]").cmsInnImage({
        destroy: true,
        storage: this.storage
    });
};

Image.prototype.enable = function(){
    PluginBase.prototype.enable.call(this, gPluginName);

    $("[data-au-image]").cmsInnImage({
        storage: this.storage,
        onAdded: function(){}
    });
};

Image.prototype.config = function(options){
    PluginBase.prototype.config.call(this, gPluginName);
};

Image.prototype.getSized = function(imageId, size){
    var parsedAttribute = Utilities.parseAttr(imageId);
    var img = null;

    if(parsedAttribute['recordId'] === null){
        img = this.storage.collection.findOne({
            _id: parsedAttribute['id']
        });
    } else {
        var item = this.storage.collection.findOne({_id:parsedAttribute['recordId']});

        if(_.isObject(item)){
            img = item.get(parsedAttribute['fieldId']);

            if(_.isObject(img)){
                var _g = _.pick(item, 'get');
                _.extend(img, _g);
            }
        }
    }

    if(_.isObject(img) && _.has(img.get('sizes'), size)){
        img.imageData = img.get('sizes')[size];
        return img;
    } else {
        var options = {
            id: parsedAttribute['id'],
            recordId: parsedAttribute['recordId'],
            fieldId: parsedAttribute['fieldId'],
            size: size
        };

        Meteor.apply('/au-cmsinn/image/resize', [options]);
    }
};

Image.prototype.getSizedAvailable = function(imageId, size){
    var parsedAttribute = Utilities.parseAttr(imageId);
    var img = null;

    console.log(this.storage);

    if(parsedAttribute['recordId'] === null){
        img = this.storage.collection.findOne({
            _id: parsedAttribute['id']
        });
        console.log('img', img);
    } else {
        var item = this.storage.collection.findOne({_id:parsedAttribute['recordId']});

        console.log('item', item);

        if(_.isObject(item)){
            img = item.get(parsedAttribute['fieldId']);

            if(_.isObject(img)){
                var _g = _.pick(item, 'get');
                _.extend(img, _g);
            }
        }
    }
    console.log(img);
    if(_.isObject(img) && _.has(img.get('sizes_available'), size)){
        return true;
    }
    return false;
};


Image.prototype.save = function(imageId, file, imageData){
    var parsedAttribute = Utilities.parseAttr(imageId);

    if(parsedAttribute['recordId'] !== null){
        var updateObject = {};
        updateObject[parsedAttribute['fieldId']+'.imageData'] = imageData;
        updateObject[parsedAttribute['fieldId']+'.name'] = file.name;
        updateObject[parsedAttribute['fieldId']+'.sizes'] = {};
        updateObject[parsedAttribute['fieldId']+'.sizes_available'] = {};
        updateObject[parsedAttribute['fieldId']+'.isDraft'] = false;

        this.storage.update({_id: parsedAttribute['recordId']}, {$set : updateObject});
    } else {
        var currentImage = this.storage.collection.findOne({_id:parsedAttribute['id']});

        if(currentImage){
            var updateObject = {};
            updateObject['imageData'] = imageData;
            updateObject['name'] = file.name;
            updateObject['sizes'] = {};
            updateObject['sizes_available'] = {};
            updateObject['isDraft'] = false;
            this.storage.update({_id: parsedAttribute['id']}, {$set : updateObject});
        } else {
            this.storage.insert({
                _id: parsedAttribute['id'],
                name: file.name,
                imageData: imageData,
                contentType: this.contentType,
                sizes : {},
                sizes_available : {},
                isDraft: false
            });
        }
    }
};

CmsInnImage = new Image();

/**
 * jQuery plugin
 */
function ImagePlugin(element, options){
    this.$element = $(element);
    this.settings = $.extend({

    }, options);

    if('storage' in this.settings){
        this.storage = this.settings.storage;
    }

    if(('ui' in this.settings) && typeof this.settings.ui === 'object'){
        this.ui = this.settings.ui;
    }

    if('destroy' in options && options['destroy']){
        this.destroy();
    } else {
        this.init();
    }
}

ImagePlugin.prototype.destroy = function(){
    this.$element.removeClass('image-mark');
    this.$element.removeClass('image-drag-enter');
    this.$element.removeClass('image-drag-leave');
    this.$element.removeClass('image-drag-drop');
    this.$element.off('dragover');
    this.$element.off('dragleave');
    this.$element.off('dragenter');
    this.$element.off('drop');
};

ImagePlugin.prototype.init = function(){
    var self = this;
    var imageId = this.$element.attr('data-au-image');
    this.$element.addClass('image-mark');

    this.$element.on('dragover', function (evt){
        evt.stopPropagation();
        evt.preventDefault();
    });

    this.$element.on('dragleave', function (evt){
        evt.stopPropagation();
        evt.preventDefault();
        $(this).removeClass('image-drag-enter');
        $(this).removeClass('image-drag-leave');
        $(this).removeClass('image-drag-drop');
        $(this).addClass('image-mark');
    });

    this.$element.on('dragenter', function (evt){
        evt.stopPropagation();
        evt.preventDefault();
        $(this).removeClass('image-mark');
        $(this).removeClass('image-drag-leave');
        $(this).removeClass('image-drag-drop');
        $(this).addClass('image-drag-enter');
    });

    this.$element.on('drop', function (evt) {
        evt.stopPropagation();
        evt.preventDefault();
        $(this).removeClass('image-mark');
        $(this).removeClass('image-drag-enter');
        $(this).removeClass('image-drag-leave');
        $(this).addClass('image-drag-drop');

        if(evt.originalEvent){
            var files = evt.originalEvent.dataTransfer.files;

            if (files && files[0]) {
                var reader = new FileReader();
                reader.onload = function(e) {
                    self.$element.attr('src', e.target.result);
                    Notifications.success('uploading image');
                    CmsInnImage.save(imageId, files[0], e.target.result);
                }
                reader.readAsDataURL(files[0]);
            }
        }
    });
};

if(Meteor.isClient){
    (function($) {
        $.fn.cmsInnImage = function(options) {
            return this.each(function() {
                $.data(this, 'cmsInnImage', new ImagePlugin(this, options));
            });
        };
    }(jQuery));

    if(UI){

        UI.registerHelper('existImg', function (prefix, imageId, size) {
            if(prefix !== undefined && typeof prefix === 'string'){
                imageId = prefix + imageId;
            }
            if(Utilities.isEditor(Meteor.userId())){
                // call getSized to create missing image size
                var image = CmsInnImage.getSized(imageId, size);
                return true;
            } else {
                // return true if sizes_available for this size is true
                return CmsInnImage.getSizedAvailable(imageId, size);
            }
        });

        UI.registerHelper('loadImg', function (prefix, imageId, size, placeholder) {
            if(Utilities.isEditor(Meteor.userId())){
                if(prefix !== undefined && typeof prefix === 'string'){
                    imageId = prefix + imageId;
                }
                // check for existing size, otherwise show placeholder image
                var image = CmsInnImage.getSized(imageId, size);
                if(image != undefined){
                    return image.imageData;
                } else {
                    if(placeholder !== undefined && typeof placeholder === 'string'){
                        return placeholder;
                    }
                    return 'http://placehold.it/'+size.split("_")[1];
                }
            } else {
                return '/imageserver/'+imageId+'/'+prefix+'/'+size;
            }
        });
    }
}