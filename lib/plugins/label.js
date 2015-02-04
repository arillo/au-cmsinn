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
var gPluginName = 'label';
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

LabelPlugin.prototype.init = function(){
    PluginBase.prototype.init.call(this, gPluginName);
}

LabelPlugin.prototype.disable = function($){
    PluginBase.prototype.disable.call(this, gPluginName);

    $(this.selector).hallo({editable: false});
    $('.hallolink-dialog').off().remove();
    $('.hallotoolbar').off().remove();
    $(this.selector).hallo('destroy');
    $(this.selector).off('hallodeactivated');
    $(this.selector).off('click');

    // save changed labels
    _.each(this.labelsToSave.normal, _.bind(function(args){
        this.upsertRecordField.apply(this, args);
    }, this));

    _.each(this.labelsToSave.selfContained, _.bind(function(args){
        this.upsertRecord.apply(this, args);
    }, this));
};

LabelPlugin.prototype.enable = function($){
    PluginBase.prototype.enable.call(this, gPluginName);

    var self = this;

    var halloPlugins = {
        'halloformat': {},
        'halloheadings': {},
        'hallolists': {},
        'halloreundo': {},
        'hallolink': {}
    };

    var halloPluginNames = _.keys(halloPlugins);

    $(this.selector).hallo({
        editable: true,
        plugins: halloPlugins
    });

    $(this.selector).on('click', function(e){
        e.stopPropagation();
        var elemHalloPluginNames = [];
        var elemHalloPlugins = $(e.currentTarget).data('hallo-plugins');
        var $halloToolbar = $('.hallotoolbar');

        if(elemHalloPlugins != null){
            elemHalloPluginNames = _.filter(elemHalloPlugins.split(','), function(item){ return !!item; });
        
            if(!elemHalloPluginNames.length){
                elemHalloPluginNames = [];
            }
        } else {
            elemHalloPluginNames = halloPluginNames;
        }

        var pluginsToShow = _.intersection(halloPluginNames, elemHalloPluginNames);
        var pluginsToHide = _.difference(halloPluginNames, elemHalloPluginNames);

        _.each(pluginsToShow, function(plugin){ $halloToolbar.find('.' + plugin).show(); });
        _.each(pluginsToHide, function(plugin){ $halloToolbar.find('.' + plugin).hide(); });
    });

    this.labelsToSave = {
        normal: [],
        selfContained: []
    };
    
    $(this.selector).on('hallodeactivated', function (e) {
        var newValue = $(e.currentTarget).html();
        var parsedLabel = Utilities.parseAttr($(this).attr(gSelector));
        var label = getRecordLabel("["+parsedLabel.fieldId+"]", parsedLabel.recordId);

        if(newValue == label) return;

        // If there is no record id, so it is self-contained record
        if(parsedLabel[Utilities.CONST_RECORD_ID] === null){
            self.labelsToSave.selfContained.push([parsedLabel[Utilities.CONST_ID], newValue]);
        } else {
            self.labelsToSave.normal.push([parsedLabel[Utilities.CONST_RECORD_ID], parsedLabel[Utilities.CONST_FIELD_ID], newValue]);
        }
    });
};

LabelPlugin.prototype.config = function(){
    PluginBase.prototype.config.call(this, gPluginName);
}

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

var getRecordLabel = function(label, prefix){
    if(prefix !== undefined && typeof prefix === 'string'){
        label = prefix + label; 
    }
    var parsedLabel = Utilities.parseAttr(label);
    if(parsedLabel[Utilities.CONST_RECORD_ID] === null){
        return CmsInnLabel.getRecord(parsedLabel[Utilities.CONST_ID]);
    } else {
        return CmsInnLabel.getRecordField(parsedLabel[Utilities.CONST_RECORD_ID], parsedLabel[Utilities.CONST_FIELD_ID]);
    }
}
// Run this only on client
if(Meteor.isClient){

    if(UI) {

        UI.registerHelper('c', function (label, prefix) {
            contentDep.depend();
            return getRecordLabel(label, prefix);
        });

        UI.registerHelper('c_empty', function (label, prefix) {
            contentDep.depend();
            var label = getRecordLabel(label, prefix)
            if(label == " ") return true;
            return false;
        });
        
    } 
}
