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
    },
    closeWindow : function(e){
        NavigationUI.element.poshytip('destroy');
    },
    updateRecord: function(e){
        if(e.keyCode && e.keyCode != 13) return;

        var template = $('.js-cmsinn-nav-page-type option:selected').val();
        var uri = $('.js-cmsinn-nav-item-uri').val();

        CmsInnNavigation.updateRecord(
            NavigationUI.currentRecord.id,
            template,
            uri
        );
        NavigationUI.element.poshytip('destroy');
    },
    updateRecordField: function(e){
        if(e.keyCode && e.keyCode != 13) return;

        var template = $('.js-cmsinn-nav-page-type option:selected').val();
        var uri = $('.js-cmsinn-nav-item-uri').val();

        CmsInnNavigation.updateRecordField(
            NavigationUI.currentRecord.recordId,
            NavigationUI.currentRecord.fieldId,
            template,
            uri
        );
        NavigationUI.element.poshytip('destroy');
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
            var selectedString = selected === item.type ? 'selected' : '';
            options += ' \
                <option value="'+item.type+'" '+selectedString+'>'+item.type+'</option> \
            ';
        });
        return options;
    },
    render : function(id, fieldId, recordId, storage, element){
        //selectedTemplate, uri, pageTypes
        this.init(id, fieldId, recordId, storage, element);
        var tpl = ' \
            <div class="au-form au-form-nav"> \
                <div class="au-form_item"> \
                    <select class="au-form_input au-form_input-select js-cmsinn-nav-page-type"> \
                        <option value="">None</option> \
                        '+this.buildOptions(CmsInnNavigation.pageTypes, this.currentRecord.get('template'))+' \
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
var contentDep = new Deps.Dependency;
Navigation = function(){
    this.storage = null;
    this.contentType = 'navigation';
    this.ui = NavigationUI;
    this.pageTypes = [];
    this.defaultTemplate = '__home';
}

Navigation.prototype.constructor = Navigation;

Navigation.prototype.disable = function(){
    $("[data-au-nav]").cmsInnNav({
        destroy: true,
        storage: this.storage,
        ui: this.ui
    });
}

Navigation.prototype.enable = function(){
    $("[data-au-nav]").cmsInnNav({
        storage: this.storage,
        ui: this.ui
    });
}

Navigation.prototype.getRecord = function(recordId){
    var item = this.storage.collection.findOne({
        _id: recordId,
        contentType: this.contentType
    });

    if(_.isObject(item)){
        return item;
    }
}

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
}

Navigation.prototype.updateRecordField =function(recordId, field, template, uri){
    var updateObject = {};
    updateObject[field+'.uri'] = uri;
    updateObject[field+'.template'] = template;
    updateObject[field+'.contentType'] = this.contentType;
    this.storage.update({_id: recordId}, {$set : updateObject});
}

Navigation.prototype.updateRecord = function(id, template, uri){
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
            });
        }
        contentDep.changed();
    });
}

Navigation.prototype.config = function(options){

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
}

Navigation.prototype.buildRoute = function(id, record){
    contentDep.changed();
    Router.route(record.get('uri'), {
        name : id,
        template: record.get('template'),
        data : function(){
            return {
                route: this.route,
                params: this.params,
                path : this.path
            };
        },
        action: function(){
            // @FIX
            var data = this.data();
            if($('#'+data._id).length>0){
                return this.render(data.template , { to: data._id});
            } else {
                return this.render(data.template);
            }
        }
    });
    // Router.route(id, {
    //     path : record.get('uri'),
    //     template: record.get('template'),
    //     data : function(){
    //         return {
    //             route: this.route,
    //             params: this.params,
    //             path : this.path
    //         };
    //     },
    //     render: function(){
    //         this.render(this.template, { to: this._id})
    //     }
    // });
}

Navigation.prototype.init = function(){
    var self = this;
    var items = [];
    if(self.storage !== null){
        // items = self.storage.collection.find({contentType: {$in:[this.contentType, CmsInnRecord.contentType]}});
        // get only navigation records
        items = self.storage.collection.find({'link.contentType': {$in:[this.contentType]}});
    }

    //@todo: I have to get back and revisit "record" type loading
    var addedHomeRoute = false;
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
            Router.route(uri, {
                name : lookup._id,
                template: lookup.get('template'),
                data : function(){
                    return {
                        _id: lookup._id,
                        template: lookup.get('template'),
                        route: this.route,
                        params: this.params,
                        path : this.path
                    };
                },
                action: function(){
                    // @FIX
                    var data = this.data();
                    if($('#'+data._id).length>0){
                        return this.render(data.template , { to: data._id});
                    } else {
                        return this.render(data.template);
                    }
                }
            });
            // Router.route(lookup._id, {
            //     path : lookup.get('uri'),
            //     template: lookup.get('template'),
            //     data : function(){
            //         return {
            //             route: this.route,
            //             params: this.params,
            //             path : this.path
            //         };
            //     }
            // });
        }
    });
    console.log('added routes');

    // Add default route, because in service.js where we toggle between loading and normal templates
    // tpl is not loaded if there is no routes and on initial load there is no routes
    // @todo: find a reason why it is like that \
    if(addedHomeRoute === false || items.count() == 0){
        Router.route('__default', {
            path : '/',
            template: self.defaultTemplate,
            data : function(){
                return {
                    route: this.route,
                    params: this.params,
                    path : this.path
                };
            },
            action: function(){
                // @FIX
                var data = this.data();
                if($('#'+data._id).length>0){
                    return this.render(data.template , { to: data._id});
                } else {
                    return this.render(data.template);
                }
            }
        });
    }

}

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
}

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
}

if(Meteor.isClient){
    (function($) {
        $.fn.cmsInnNav = function(options) {
            return this.each(function() {
                $.data(this, 'cmsInnNav', new NavigationPlugin(this, options));
            });
        };
    }(jQuery));

    if(UI){
        UI.registerHelper('nav', function (navId, action, prefix) {
            switch(action){
                case "href":
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
                    if(record){
                        // CmsInnNavigation.buildRoute(parsedLabel['id'], record);
                        return record.uri;
                    }
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