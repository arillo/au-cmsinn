var gPluginName = 'deletable';

/**
 * Helper functions
 **/
// function template(pathToImage){
//     var addNewItemTpl = ' \
//         <div id="trash" class="au-deletable-icon"></div>\
//     ';
//     return addNewItemTpl;
// }

/**
 * Plugin Wrapper
 **/
Deletable = function(){
    this.storage = null;
    this.name = "deletable";
    // this.trash = template();
};

Deletable.prototype.constructor = Deletable;

Deletable.prototype.init = function(){
    PluginBase.prototype.init.call(this, gPluginName);
};

Deletable.prototype.disable = function(){
    PluginBase.prototype.disable.call(this, gPluginName);

    $("[data-au-deletable]").cmsInnDeletable('destroy');
};

Deletable.prototype.enable = function(){
    PluginBase.prototype.enable.call(this, gPluginName);

    $("[data-au-deletable]").cmsInnDeletable({
        storage: this.storage
        // ,trash : $(this.trash)
    });
};

Deletable.prototype.config = function(options){
    PluginBase.prototype.config.call(this, gPluginName);

    // if('trash' in options){
    //     if(typeof options.trash === 'function'){
    //         this.trash = options.trash();
    //     } else if(typeof options.trash === 'string'){
    //         this.trash = options.trash;
    //     }
    // }
};

CmsInnDeletable = new Deletable();

/**
 * jQuery plugin
 */
function DeletablePlugin(element, options){
    this.$element = $(element);
    this.settings = $.extend({

    }, options);
    this.storage = null;

    if('storage' in this.settings){
        this.storage = this.settings.storage;
    }

    if(options === 'destroy'){
        this.destroy();
    } else {
        this.init();
    }
}

DeletablePlugin.prototype.destroy = function(){
    // console.log('destroy deletable', this.$element);
    this.$element.removeClass('au-mark-delete');
    this.$element.off('click');
    // this.$element.draggable("destroy");
};

// DeletablePlugin.prototype.initTrash = function(){
//     var self = this;
//     $('body').append(this.settings.trash);
//     this.settings.trash.hide();

//     this.settings.trash.droppable({
//         drop: function(event, ui) {
//             var elementToDelete = $(ui.draggable).attr('data-au-deletable');
//             var parsedAttribute = Utilities.parseAttr(elementToDelete);

//             var itemId = parsedAttribute['id'];

//             if(parsedAttribute['recordId']){
//                 itemId = parsedAttribute['recordId'];
//             }

//             var item = self.storage.collection.findOne({_id: itemId});
//             if(item){
                
//                 // check if just a property is affected
//                 if(field = parsedAttribute.fieldId){
//                     var update = {};
//                     update[field] = null
//                     self.storage.update({ _id:itemId }, { $set: update });
//                 } else {
//                     // first delete item from parents then the item itself
//                     var parents = self.storage.collection.find({parents:{$in:item['parents']}});

//                     $.each(item['parents'], function(key, id){
//                         var pull = {
//                             $pull : {children:itemId}
//                         };
//                         if(parsedAttribute['fieldId']){
//                             pull['$pull'][parsedAttribute['fieldId']] = itemId;
//                         }
//                         self.storage.update({_id:id}, pull);
//                     })

//                     self.storage.remove({
//                         _id: itemId
//                     });
//                 }
//             }
//         }
//     });
// };

DeletablePlugin.prototype.deleteItem = function(elementToDelete){
    if (confirm("Are you sure you want to delete the element: "+elementToDelete+" ?") == true) {
        var parsedAttribute = Utilities.parseAttr(elementToDelete);

        var itemId = parsedAttribute['id'];

        if(parsedAttribute['recordId']){
            itemId = parsedAttribute['recordId'];
        }

        var self = this;
        var item = self.storage.collection.findOne({_id: itemId});
        if(item){
            
            // check if just a property is affected
            if(field = parsedAttribute.fieldId){
                var update = {};
                update[field] = 0
                self.storage.update({ _id:itemId }, { $unset: update });
            } else {
                // first delete item from parents then the item itself
                var parents = self.storage.collection.find({parents:{$in:item['parents']}});

                $.each(item['parents'], function(key, id){
                    var pull = {
                        $pull : {children:itemId}
                    };
                    if(parsedAttribute['fieldId']){
                        pull['$pull'][parsedAttribute['fieldId']] = itemId;
                    }
                    self.storage.update({_id:id}, pull);
                })

                self.storage.remove({
                    _id: itemId
                });
            }
        }
    } else {

    }
}
DeletablePlugin.prototype.init = function(){
    var self = this;
    this.$element.addClass('au-mark-delete');
    this.$element.on('click', function(e){
        e.preventDefault();
        e.stopPropagation();
        self.deleteItem($(e.currentTarget).attr('data-au-deletable'));
    });

    // this.$element.draggable({
    //     start: function() {
    //         self.initTrash();
    //         self.settings.trash.fadeIn(500);
    //     },
    //     stop: function(){
    //         self.settings.trash.fadeOut(500);
    //     },
    //     cursor: 'move',
    //     helper: 'clone',
    //     revert: "invalid",
    // });
};

if(Meteor.isClient){
    (function($) {
        $.fn.cmsInnDeletable = function(options) {
            var self = this;
            return this.each(function() {
                $.data(this, 'cmsInnDeletable', new DeletablePlugin(this, options));
            });
        };
    }(jQuery));
}