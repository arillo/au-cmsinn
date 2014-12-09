// ----------------------------------- Label Plugin UI bit --------------------------------------//
/**
 * Plugin UI 
 * This has to be easy to extend or replace
 * Allow injecting UI object from outside through settings
 */
//function LabelPluginUI(){
//
//}
//
//// Render UI HTML and return it
//LabelPluginUI.prototype.render = function(){
//
//}
//
//// Destroy UI
//LabelPluginUI.prototype.destroy = function(){
//
//}
//
//// Init UI
//LabelPluginUI.prototype.init = function(){
//
//}
// ----------------------------------- Label Plugin UI bit --------------------------------------//

// ----------------------------------- Label Plugin bit --------------------------------------//
var gLabelName   = 'cmsInnLabel';
var gContentType = 'label';
var gSelector    = 'data-au-label';
var contentDep   = new Tracker.Dependency;

/**
 * Label plugin constructor
 */
LabelPlugin = function(name, contentType, selector, ui, storage){
    // Call base constructor to set storage
    PluginBase.prototype.constructor.call(this, storage);
    this.selector = selector;
    this.ui = ui;
    this.name = name;
    this.contentType = contentType;
    this.language = 'en_US';
    this.defaultEmptyString = '';
};

LabelPlugin.prototype = CmsInnPluginBase;
LabelPlugin.prototype.constructor = PluginBase;

LabelPlugin.prototype.disable = function($){
    // $(this.selector).editable('destroy');
    $(this.selector).hallo({editable: false});
    $(this.selector).off('hallodeactivated');
    $(this.selector).off('click');
    // $(this.selector).click(function() {
    //     $(this).destroy());  
    // });
};

// LabelPlugin.prototype.

LabelPlugin.prototype.enable = function($){
    var self = this;

    $(this.selector).hallo({
        plugins: {
            'halloformat': {},
            'halloheadings': {},
            'hallolists': {},
            'halloreundo': {},
            'hallolink': {},
            // 'halloimage': {}
        }
    });
    $(this.selector).on('hallodeactivated', function (e) {
        // console.log('hallodeactivated', this, e);
        var newValue = $(e.currentTarget).html();
        var parsedLabel = Utilities.parseAttr($(this).attr(gSelector));
        // If there is no record id, so it is self-contained record
        if(parsedLabel[Utilities.CONST_RECORD_ID] === null){
            self.upsertRecord(parsedLabel[Utilities.CONST_ID], newValue);
        } else {
            self.upsertRecordField(parsedLabel[Utilities.CONST_RECORD_ID], parsedLabel[Utilities.CONST_FIELD_ID], newValue)
        }
    });
    // $(this.selector).editable({
    //     container: 'body',
    //     display: false,
    //     toggle: 'click',
    //     mode: 'popover',
    //     placement: 'bottom',
    //     autotext: 'never',
    //     success: function(response, newValue) {
    //         var parsedLabel = Utilities.parseAttr($(this).attr(gSelector));
    //         // If there is no record id, so it is self-contained record
    //         if(parsedLabel[Utilities.CONST_RECORD_ID] === null){
    //             self.upsertRecord(parsedLabel[Utilities.CONST_ID], newValue);
    //         } else {
    //             self.upsertRecordField(parsedLabel[Utilities.CONST_RECORD_ID], parsedLabel[Utilities.CONST_FIELD_ID], newValue)
    //         }
    //     }
    // });  
    
    // $(this.selector).on('click', function(e) {
    //     e.stopPropagation();
    //     // e.stopImmediatePropagation();
    //     // $(this).editable('toggle');
    //     return false;
    // });

    // _.each($(this.selector), function(num){
    //     // var test = $(num).data('escape') === false ? false : true;
    //     // console.log(test);
    //     $(num).editable({
    //         escape: $(num).data('escape') === false ? false : true,
    //         clear: $(num).data('clear') === true ? true : false,
    //         display: false,
    //         toggle: 'dblclick',
    //         mode: 'inline',
    //         success: function(response, newValue) {
    //             var parsedLabel = Utilities.parseAttr($(this).attr(gSelector));

    //             // If there is no record id, so it is self-contained record
    //             if(parsedLabel[Utilities.CONST_RECORD_ID] === null){
    //                 self.upsertRecord(parsedLabel[Utilities.CONST_ID], newValue);
    //             } else {
    //                 self.upsertRecordField(parsedLabel[Utilities.CONST_RECORD_ID], parsedLabel[Utilities.CONST_FIELD_ID], newValue)
    //             }
    //         }
    //     });  
    // });

};

LabelPlugin.prototype.upsertRecord = function(id, value, language){
    var self = this;
    if(language === undefined){
        language = this.language;
    }
    var updateObject = {};
    var insertObject = {};
    updateObject[language] = value;
    insertObject[language] = value;
    this.storage.update({_id:id}, {$set: updateObject}, {}, function(err, docNum){
        if(docNum === 0){
            insertObject['_id'] = id;
            insertObject['contentType'] = self.contentType;
            self.storage.insert(insertObject);
        }
    });
    contentDep.changed();
};

LabelPlugin.prototype.upsertRecordField = function(id, field, value, language){
    var self = this;
    if(language === undefined){
        language = this.language;
    }
    var updateObject = {};
    updateObject[field+'.'+language] = value;
    self.storage.update({_id:id}, {$set: updateObject});
    contentDep.changed();
};

LabelPlugin.prototype.getLanguage = function(){
    return this.language;
};

LabelPlugin.prototype.setLanguage = function(lng){
    this.language = lng;
    contentDep.changed();
};

LabelPlugin.prototype.setLocale = function(id){
    var locale = CmsInnLocale.get(id);
    if(locale){
        this.language = locale;
        contentDep.changed();
    }
};

LabelPlugin.prototype.getRecord = function(label){
    contentDep.depend();

    var currentLabel = this.storage.collection.findOne({_id:label});

    if(currentLabel){
        var result = currentLabel.get(this.language);
        if(_.isNull(result)){
            return currentLabel.firstFieldWithValue();
        }
        return result;
    } else {
        return this.defaultEmptyString+label;
    }
};

LabelPlugin.prototype.getRecordField = function(recordId, field){
    contentDep.depend();
    var record = this.storage.collection.findOne({_id:recordId});

    if(record){
        var result = record.get(field);
        // if(_.isNull(result)){
        // }
        if(result && result[this.language]) return result[this.language];
        if(record.firstFieldWithValue(field)){
            return record.firstFieldWithValue(field);
        }
        // return "";
    } 
    // else {
    // console.log(field);
        return this.defaultEmptyString+field;
    // }
};

CmsInnLabel = new LabelPlugin(gLabelName, gContentType, '['+gSelector+']'/*, new LabelPluginUI()*/);

// ----------------------------------- Label Plugin bit --------------------------------------//

// ----------------------------------- jQuery bit --------------------------------------//

/**
 * Interface to UI through jQuery
 */
//function JqLabelPlugin(element, options){
//    this.$element = $(element);
//    this.settings = $.extend({}, options);
//    this.init();
//}

//JqLabelPlugin.prototype.init = function(){}

// Register your plugin with jQuery handler
// Run this only on client
if(Meteor.isClient){
    //CmsInnLabel.initjQueryPlugin(jQuery, JqLabelPlugin);

    if(UI) {

        UI.registerHelper('c', function (label, prefix) {
            contentDep.depend();
            if(prefix !== undefined && typeof prefix === 'string'){
                label = prefix + label; 
            }
            var parsedLabel = Utilities.parseAttr(label);
            if(parsedLabel[Utilities.CONST_RECORD_ID] === null){
                return CmsInnLabel.getRecord(parsedLabel[Utilities.CONST_ID]);
            } else {
                return CmsInnLabel.getRecordField(parsedLabel[Utilities.CONST_RECORD_ID], parsedLabel[Utilities.CONST_FIELD_ID]);
            }
        });

        UI.registerHelper('c_empty', function (label, prefix) {
            contentDep.depend();
            if(prefix !== undefined && typeof prefix === 'string'){
                label = prefix + label; 
            }
            var parsedLabel = Utilities.parseAttr(label);
            if(parsedLabel[Utilities.CONST_RECORD_ID] === null){
                if(CmsInnLabel.getRecord(parsedLabel[Utilities.CONST_ID]) == " ") return true;
            } else {
                if(CmsInnLabel.getRecordField(parsedLabel[Utilities.CONST_RECORD_ID], parsedLabel[Utilities.CONST_FIELD_ID]) == " ") return true;
            }
            return false;
        });
        
    } 
}
