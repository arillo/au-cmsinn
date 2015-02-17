/**
 * Default UI
 */
var NavigationUI = {
    storage : null,
    currentRecord: {template: '', uri: '', id: null, recordId: null, fieldId: null},
    element : null,
    init: function(id, fieldId, recordId, storage, element){
        this.destroy();
        this.storage = storage;
        this.element = element;
        var rec = null;
        if(recordId === null){
            rec = CmsInnNavigation.getRecord(id);
        } else {
            rec = CmsInnNavigation.getRecordField(recordId, fieldId);
        }

        if(_.isObject(rec)){
            _.extend(this.currentRecord, rec);
        }

        if(!_.has(this.currentRecord, 'get')){
            this.currentRecord['get'] = function(){
                return '';
            }
        }

        this.currentRecord['id'] = id;
        this.currentRecord['recordId'] = recordId;
        this.currentRecord['fieldId'] = fieldId;

        $('body').on('click', '.js-close-nav', this.closeWindow);

        if(recordId === null){
            $('body').on('click', '.js-save-nav', this.updateRecord);
            $('body').on('keydown', '.js-cmsinn-nav-item-uri', this.updateRecord);
        } else {
            $('body').on('click', '.js-save-nav', this.updateRecordField);
            $('body').on('keydown', '.js-cmsinn-nav-item-uri', this.updateRecordField);
        }

        $('body').on('change', '.js-cmsinn-nav-page-type', this.updateRouteField);
    },
    closeWindow : function(e){
        NavigationUI.element.poshytip('destroy');
    },
    updateRecord: function(e){
        if(e.keyCode && e.keyCode != 13) return;

        var template = $('.js-cmsinn-nav-page-type option:selected').val();
        var uri = $('.js-cmsinn-nav-item-uri').val();

        var success = CmsInnNavigation.updateRecord(
            NavigationUI.currentRecord.id,
            template,
            uri
        );

        if(!success){
            alert('a page with URL ' + uri + ' already exists, please choose another one');
        } else {
            NavigationUI.element.poshytip('destroy');
        }
    },
    updateRecordField: function(e){
        if(e.keyCode && e.keyCode != 13) return;

        var template = $('.js-cmsinn-nav-page-type option:selected').val();
        var uri = $('.js-cmsinn-nav-item-uri').val();

        var success = CmsInnNavigation.updateRecordField(
            NavigationUI.currentRecord.recordId,
            NavigationUI.currentRecord.fieldId,
            template,
            uri
        );

        if(!success){
            alert('a page with URL ' + uri + ' already exists, please choose another one');
        } else {
            NavigationUI.element.poshytip('destroy');
        }
    },
    updateRouteField: function(e){
        var $target, $uri, defaultRoute;

        $target = $(e.currentTarget);
        $uri = $('.js-cmsinn-nav-item-uri');

        //if(_.isEmpty($uri.val())){
        defaultRoute = $target.find('option:selected').data('defaultroute');
        
        if(defaultRoute){
            $uri.val(defaultRoute);
        }
        //}
    },
    destroy : function(){
        // Take both down :)
        this.currentRecord = {template: '', uri: '', id: null, recordId: null, fieldId: null};
        $('body').off('click', '.js-save-nav', this.updateRecord);
        $('body').off('click', '.js-save-nav', this.updateRecordField);
        $('body').off('click', '.js-close-nav', this.closeWindow);
        $('body').off('keydown', '.js-cmsinn-nav-item-uri', this.updateRecord);
        $('body').off('keydown', '.js-cmsinn-nav-item-uri', this.updateRecordField);
    },
    buildOptions: function(types, selected){
        var options = '';
        
        _.each(types, function(item){
            var isSelected, isSingleton, instanceExists, selectedString;

            isSelected = (selected === item.type);
            isSingleton = !!item.singleton;
            instanceExists = CmsInnNavigation.isDuplicatePageTypeInstance(item.type);
            
            selectedString = isSelected ? 'selected' : '';

            if(!isSelected && isSingleton && instanceExists){
                return;
            }

            options += ' \
                <option value="'+item.type+'" '+selectedString+' data-defaultroute="' + item.defaultRoute + '">'+item.type+'</option> \
            ';
        });

        return options;
    },
    render : function(id, fieldId, recordId, storage, element){
        //selectedTemplate, uri, pageTypes
        this.init(id, fieldId, recordId, storage, element);

        var sortedPageTypes = _.sortBy(CmsInnNavigation.pageTypes, function(pageType){
            return pageType.type;
        });

        var tpl = ' \
            <div class="au-form au-form-nav"> \
                <div class="au-form_item"> \
                    <select class="au-form_input au-form_input-select js-cmsinn-nav-page-type"> \
                        <option value="">None</option> \
                        '+this.buildOptions(sortedPageTypes, this.currentRecord.get('template'))+' \
                    </select> \
                </div> \
                <div class="au-form_item"> \
                    <label class="au-form_label">URL</label> \
                    <input type="text" class="au-form_input au-form_input-text js-cmsinn-nav-item-uri" value="'+this.currentRecord.get('uri')+'"> \
                </div> \
                <div class="au-form_item au-tip_item-actions"> \
                    <div class="au-form_actions"> \
                        <button class="au-form_btn js-save-nav">Save</button> \
                        <button class="au-form_btn js-close-nav">Close</button> \
                    </div> \
                </div> \
            </div> \
        ';

        return tpl;
    }
};

/**
 * Plugin Wrapper
 **/
var gPluginName = 'navigation';
var contentDep = new Deps.Dependency;

Navigation = function(){
    this.name = "navigation";
    this.storage = null;
    this.contentType = 'navigation';
    this.ui = NavigationUI;
    this.pageTypes = [];
    this.defaultTemplate = '__home';
    this.routes = [];
};

Navigation.prototype.constructor = Navigation;

Navigation.prototype.init = function(){
    PluginBase.prototype.init.call(this, gPluginName);
};

Navigation.prototype.disable = function(){
    PluginBase.prototype.disable.call(this, gPluginName);

    $("[data-au-nav]").cmsInnNav({
        destroy: true,
        storage: this.storage,
        ui: this.ui
    });
};

Navigation.prototype.enable = function(){
    PluginBase.prototype.enable.call(this, gPluginName);

    $("[data-au-nav]").cmsInnNav({
        storage: this.storage,
        ui: this.ui
    });
};

Navigation.prototype.config = function(options){
    PluginBase.prototype.config.call(this, gPluginName);

    if('pageTypes' in options){
        var self = this;
        _.each(options.pageTypes, function(type){
            if(_.where(self.pageTypes, type).length == 0){
                self.pageTypes.push(type);
            } else {
                throw new Meteor.Error("Page type with such name ["+type.type+"] already exists!");
            }
        });
    }

    if('defaultTemplate' in options){
        this.defaultTemplate = options.defaultTemplate;
    }
};

Navigation.prototype.getRecord = function(recordId){
    var item = this.storage.collection.findOne({
        _id: recordId,
        contentType: this.contentType
    });

    if(_.isObject(item)){
        return item;
    }
};

Navigation.prototype.getRecordField = function(recordId, field){
    var record = this.storage.collection.findOne({_id:recordId});

    if(_.isObject(record)){
        // @todo: rly ? hell no, has to be revisited
        var fieldResult = record.get(field);
        if(_.isObject(fieldResult)){
            var _g = _.pick(record, 'get');
            _.extend(fieldResult, _g);

            return fieldResult;
        }

    }
};

Navigation.prototype.isDuplicateRoute = function(uri){
    return !!this.storage.collection.findOne({ 'link.uri': uri });
};

Navigation.prototype.isDuplicatePageTypeInstance = function(pageType){
    return !!this.storage.collection.findOne({ $or: [ { 'draft.link.template': pageType }, { 'link.template': pageType } ] });
};

Navigation.prototype.updateRecordField = function(recordId, field, template, uri){
    if(this.isDuplicateRoute(uri)){
        return false;
    }
    
    var updateObject = {};
    updateObject[field+'.uri'] = uri;
    updateObject[field+'.template'] = template;
    updateObject[field+'.contentType'] = this.contentType;
    
    this.storage.update({_id: recordId}, {$set : updateObject}, function(err, docNum){
        if(!err){
            console.log('Navigation updateRecordField success');
        }
    });
    
    // TODO: check on updateRecord only
    this.buildRoute(recordId, template, uri);

    return true;
};

Navigation.prototype.updateRecord = function(id, template, uri){
    if(this.isDuplicateRoute(uri)){
        return false;
    }

    var self = this;
    this.storage.update({_id:id}, {
        $set : {
            uri: uri,
            template: template
        }
    }, {}, function(err, docNum){
        if(docNum === 0){
            self.storage.insert({
                _id: id,
                uri: uri,
                template: template,
                contentType: self.contentType
            }, function(err){
                if(!err){
                    console.log('Navigation updateRecord success');
                }
            });
        }
        contentDep.changed();
    });

    return true;
};

Navigation.prototype.buildRoute = function(id, template, uri){
    contentDep.changed();

    // var self = this;
    // var items = [];
    // if(self.storage !== null){
    //     items = self.storage.collection.find({'link.contentType': {$in:[this.contentType]}});
    // }
    // var found = _.find(items.fetch(), function(item){
    //     return item._id+"[link]" == id;
    // });

    var found = _.find(this.routes, function(record){
        return record._id == id;
    });

    if(!found){
        var route = {
            _id: id,
            uri: uri,
            template: template
        };

        this.routes.push(route);

        try{
            Router.plugin('aucmsinn', { routes: [route] });
        } catch(e) {
            alert(e.message);
        }

        // console.log('BUILD ROUTE', this.routes);
    } else {
        // TODO: check if better way
        location.reload();
    }
};

Navigation.prototype.init = function(){
    var self = this;
    var items = [];
    if(self.storage !== null){
        // items = self.storage.collection.find({contentType: {$in:[this.contentType, CmsInnRecord.contentType]}});
        // get only navigation records
        items = self.storage.collection.find({'link.contentType': {$in:[this.contentType]}});
    }

    // var routes = [];
    //@todo: I have to get back and revisit "record" type loading
    var addedHomeRoute = false;
    var parents = {};
    var parent = {};
    items.forEach(function(nav){
        var lookup = nav;
        if(nav.get('contentType') === CmsInnRecord.contentType){
            lookup = nav.findField(self.contentType);
            if(_.isObject(lookup)){
                var _g = _.pick(nav, 'get');
                _.extend(lookup, _g);
            }
        }
        if(_.isObject(lookup)){
            var uri = lookup.get('uri');
            if(uri === '/'){
                addedHomeRoute = true;
            }

            if(parents[lookup._id]){
                parent = parents[lookup._id];
            } else {
                parent = self.storage.collection.findOne({_id: {$in: nav.parents}});
            }
            self.routes.push({
                _id: lookup._id,
                uri: uri,
                template: lookup.get('template'),
                places: parent.places
            });
        }
    });

    // Add default route, because in service.js where we toggle between loading and normal templates
    // tpl is not loaded if there is no routes and on initial load there is no routes
    // @todo: find a reason why it is like that \
    if(addedHomeRoute === false || items.count() == 0){
        this.routes.push({
            _id: '__default',
            uri: '/',
            template: self.defaultTemplate
        });
    }
    
    // send routes to aucmsinn Router.plugin
    Router.plugin('aucmsinn', { routes: this.routes });
};

CmsInnNavigation = new Navigation();

/**
 * jQuery plugin
 */
function NavigationPlugin(element, options){
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

NavigationPlugin.prototype.destroy = function(){
    this.ui.destroy();
    this.$element.removeClass('au-mark');
    this.$element.poshytip('destroy');
    this.$element.off('click');
};

NavigationPlugin.prototype.init = function(){
    var self = this;
    this.$element.addClass('au-mark');

    this.$element.on('click', function(){
        // Destroy other poshytips
        $("[data-au-nav]").each(function(){
            if(this != self.$element){
                $(this).poshytip('destroy');
            }
        });

        var parsedAttribute = Utilities.parseAttr($(this).attr('data-au-nav'));

        $(this).poshytip({
            className: 'au-popover-tip',
            showOn: 'none',
            alignTo: 'target',
            alignX: 'center',
            keepInViewport: true,
            fade: true,
            slide: false,
            content : self.ui.render(
                parsedAttribute['id'], parsedAttribute['fieldId'], parsedAttribute['recordId'], self.storage, self.$element
            )
        });

        $(this).poshytip('show');
    });
};

if(Meteor.isClient){
    (function($) {
        $.fn.cmsInnNav = function(options) {
            return this.each(function() {
                $.data(this, 'cmsInnNav', new NavigationPlugin(this, options));
            });
        };
    }(jQuery));

    var getNavRecord = function (navId, prefix) {
        if(prefix !== undefined && typeof prefix === 'string'){
            navId = prefix + navId;
        }
        var parsedLabel = Utilities.parseAttr(navId);
        var record = null;
        if(parsedLabel['recordId'] === null){
            record = CmsInnNavigation.getRecord(parsedLabel['id']);
        } else {
            record = CmsInnNavigation.getRecordField(parsedLabel['recordId'], parsedLabel['fieldId']);
        }
        if(record) return record;
        return null;
    };

    if(UI){
        UI.registerHelper('nav', function (navId, action, prefix) {
            switch(action){
                case "href":
                    if(record = getNavRecord(navId, prefix)){
                        return record.uri;
                    }
                break;
                case 'target':
                    if(record = getNavRecord(navId, prefix)){
                        if(record.uri.substr(0,4) == 'http') return "_blank";
                    }
                    return "";
                break;
                case "isActive":
                    // @FIX
                    var route = Router.current().route
                    if(route){
                        return route.getName() == navId ? "current" : "";
                    } else {
                        return "";
                    }
                break;
            }
        });
    }
}