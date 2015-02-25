/**
 * Default UI
 */
var RecordUI = {
    storage : null,
    element : null,
    init: function(storage, element){
        this.storage = storage;
        this.element = element;
        this.destroy();

        $('body').on('change', '.js-cmsinn-selected-record', this.mapRecordHandler);
        $('body').on('change', '.js-cmsinn-selected-parent-record', this.addSubRecordHandler);
        $('body').on('click', '.js-cmsinn-add-new-record', this.addRecordHandler);
        $('body').on('click', '.js-close-record', this.closeWindow);
    },
    closeWindow : function(){
        RecordUI.element.poshytip('destroy');
    },
    destroy : function(){
        $('body').off('change', '.js-cmsinn-selected-record', this.mapRecordHandler);
        $('body').off('change', '.js-cmsinn-selected-parent-record', this.addSubRecordHandler);
        $('body').off('click', '.js-cmsinn-add-new-record', this.addRecordHandler);
        $('body').off('click', '.js-close-record', this.closeWindow);
    },
    addRecordHandler : function(){
        CmsInnRecord.addRecord(
            $(this).attr('data-id'),
            $(this).attr('data-field-id')
        );
    },
    addSubRecordHandler : function(){
        if($("option:selected", this).val() != 'none'){
            CmsInnRecord.addSubRecord(
                $("option:selected", this).val(),
                $(this).attr('data-field-id')
            );
            $("option:selected", this).removeAttr('selected');
        }
    },
    mapRecordHandler : function(){
        if($("option:selected", this).val() != 'none'){
            CmsInnRecord.mapRecord(
                $(this).attr('data-id'),
                $("option:selected", this).val(),
                $(this).attr('data-field-id'),
                $(this).attr('data-record-id')
            );
            $("option:selected", this).removeAttr('selected');
        }
    },
    buildOptions : function(level, parents){
        var self = this;
        var select = {
            contentType: CmsInnRecord.contentType
        };

        if(parents.length > 0){
            select['_id'] = {};
            select['_id']['$in'] = parents;
        } else {
            select['parents'] = [];
        }

        var options = '';

        var allRecords = this.storage.collection.find(select);

        allRecords.forEach(function(record){
            var title = Utilities.buildTitle(record, CmsInnLabel.language);

            if(title === '' && record.children.length > 0){
                title = 'Root';
            }

            var places = record.places || [];

            options += ' \
                <option value="'+record._id+'">'+Array(level).join('-')+' '+title.substr(0, 100)+' ['+places.join()+']</option> \
            ';
            if(record.children.length > 0){
                var childLevel = level + 1;
                options += RecordUI.buildOptions(childLevel, record.children);
            }
        });
        return options;
    },
    render : function(element, placeId, fieldId, recordId, storage){
        this.init(storage, element);

        // var addNewItemTpl = ' \
        //     <div class="au-form au-form-nav '+placeId+'"> \
        //         <div class="au-form_item"> \
        //             <select data-record-id="'+recordId+'" data-field-id="'+fieldId+'" data-id="'+placeId+'" class="au-form_input au-form_input-select js-cmsinn-selected-record"> \
        //                 <option value="none">Record to be displayed here</option> \
        //                 '+this.buildOptions(1, [])+' \
        //             </select> \
        //         </div> \
        //         <div class="au-form_item au-tip_item-actions"> \
        //             <div class="au-form_actions"> \
        //                 <button type="button" class="au-form_btn js-cmsinn-add-new-record" data-record-id="'+recordId+'" data-field-id="'+fieldId+'" data-id="'+placeId+'">Add new record</button> \
        //             </div> \
        //         </div> \
        //         <div class="au-form_item"> \
        //             <select data-record-id="'+recordId+'" data-field-id="'+fieldId+'" data-id="'+placeId+'" class="au-form_input au-form_input-select js-cmsinn-selected-parent-record"> \
        //                 <option value="none">Record for which you need to create sub record</option> \
        //                 '+this.buildOptions(1, [])+' \
        //             </select> \
        //         </div> \
        //         <div class="au-form_item au-tip_item-actions"> \
        //             <div class="au-form_actions"> \
        //                 <button type="button" class="au-form_btn js-close-record" data-id="'+placeId+'">Close</button> \
        //             </div> \
        //         </div> \
        //     </div> \
        // ';

        var addNewItemTpl = ' \
            <div class="au-form au-form-nav '+placeId+'"> \
                <div class="au-form_item au-tip_item-actions"> \
                    <div class="au-form_actions"> \
                        <button type="button" class="au-form_btn js-cmsinn-add-new-record" data-record-id="'+recordId+'" data-field-id="'+fieldId+'" data-id="'+placeId+'">Add new record</button> \
                    </div> \
                </div> \
                <div class="au-form_item au-tip_item-actions"> \
                    <div class="au-form_actions"> \
                        <button type="button" class="au-form_btn js-close-record" data-id="'+placeId+'">Close</button> \
                    </div> \
                </div> \
            </div> \
        ';

        return addNewItemTpl;
    }
};

/**
 * Plugin Wrapper
 **/
var gPluginName = 'record';
var contentDep = new Deps.Dependency;

Record = function(){
    this.name = "record";
    this.storage = null;
    this.contentType = 'record';
    this.ui = RecordUI;
    this.filters = {};
};

Record.prototype.constructor = Record;

Record.prototype.init = function(){
    PluginBase.prototype.init.call(this, gPluginName);
};

Record.prototype.disable = function(){
    PluginBase.prototype.disable.call(this, gPluginName);

    $("[data-au-record]").cmsInnRecord({
        destroy: true,
        storage: this.storage,
        ui: this.ui
    });
};

Record.prototype.enable = function(){
    PluginBase.prototype.enable.call(this, gPluginName);

    $("[data-au-record]").cmsInnRecord({
        storage: this.storage,
        ui: this.ui
    });
};

Record.prototype.config = function(options){
    PluginBase.prototype.config.call(this, gPluginName);

    if('ui' in options && options.ui !== null){
        this.ui = options.ui;
    }
};

Record.prototype.setFilter = function(options){
    var filter = JSON.parse(options);
    if('record' in filter){
        this.filters[filter['record']] = _.extend({sort:{sortOrder:1}}, filter);
    }
    contentDep.changed();
};

Record.prototype.initFilter = function(recordId, limit){
    if(!(recordId in this.filters)){
        this.filters[recordId] = {
            sort:{sortOrder:1},
            skip : 0
        };
    }

    if(limit != undefined && limit >= 0){
        this.filters[recordId]['limit'] = limit;
    } else {
        delete this.filters[recordId]['limit'];
    }
};

Record.prototype.query = function(query, limit, parent){
    this.initFilter(parent, limit);
    var results = this.storage.collection.find(query, this.filters[parent]);
    return results;
};

Record.prototype.queryOne = function(query){
    var results = this.query(query, 1, 'root');
    try{
        var record = results.fetch()[0];
        if(record){
            this.initFilter(record._id, 1);
        }
        return record;
    } catch(e){}
};

Record.prototype.insert = function (parentId, fieldId){
    var self = this;
    var record = {
        contentType: CmsInnRecord.contentType,
        parents:[parentId],
        children:[],
        places:[],
        types:[],
        sortOrder: 0
    };

    var latest = this.storage.collection.findOne({parents:{$in:[parentId]}}, {sort:{sortOrder:-1}});
    if(latest){
        record['sortOrder'] = ++latest.sortOrder;
    }

    this.storage.insert(record, function(err, itemId){
        var update = {
            $addToSet:{}
        };
        if(typeof fieldId === 'string' && fieldId != '' && fieldId != 'null'){
            update['$addToSet'][fieldId] = itemId;
        } else {
            update['$addToSet']['children'] = itemId;
        }
        self.storage.update({_id:parentId}, update);
    });
};

Record.prototype.addRecord = function(placeId, fieldId){
    var self = this;
    var currentRootItem = this.storage.collection.findOne({places:{$in:[placeId]}});
    //$("[data-au-record="+placeId+"]").removeClass('empty-record');
    // If there is no root item - create new
    if(!currentRootItem){
        this.storage.insert({
            contentType: CmsInnRecord.contentType,
            places : [placeId],
            children: [],
            parents: [],
            types: []
        }, function(err, rootId){
            self.insert(rootId, fieldId);
        });
    } else {
        self.insert(currentRootItem._id, fieldId);
    }
    contentDep.changed();
};

Record.prototype.addSubRecord = function(parentId, fieldId){
    var self = this;
    var parentRootItem = self.storage.collection.findOne({_id:parentId});
    if(parentRootItem){
        self.insert(parentRootItem._id, fieldId);
    }
};

Record.prototype.mapRecord = function(placeId, recordId, fieldId, parentRecordId){
    var self = this;

    if(fieldId !== 'null' && fieldId !== null && fieldId !== undefined && fieldId.length > 0){
        var update = {
            $addToSet : {}
        };
        update['$addToSet'][fieldId] = recordId;
        self.storage.update({_id:parentRecordId}, update);
    } else {
        var currentRootItem = self.storage.collection.findOne({places:{$in:[placeId]}});
        if(!currentRootItem){
            self.storage.update({_id:recordId}, {$addToSet:{places:placeId}});
        } else {
            self.storage.update({_id:currentRootItem._id}, {$pull:{places:placeId}}, {}, function(err, res){
                self.storage.update({_id:recordId}, {$addToSet:{places:placeId}});
            });
        }
    }
};

CmsInnRecord = new Record();

/**
 * jQuery plugin
 */
function RecordPlugin(element, options){
    this.$element = $(element);
    this.settings = $.extend({

    }, options);
    this.storage = null;

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

RecordPlugin.prototype.destroy = function(){
    this.$element.removeClass('empty-record');
    this.$element.removeClass('au-mark');
    // this.$element.editable('destroy');
    this.$element.poshytip('destroy');
    this.$element.off('click');
    this.ui.destroy();
    // this.$element.off('shown.bs.poshytip');
};

RecordPlugin.prototype.init = function(){
    var self = this;

    if(this.$element.height() === 0) {
        this.$element.addClass('empty-record');
    }
    this.$element.addClass('au-mark');

    this.$element.on('click', function(e){
        e.stopPropagation();

        // Destroy other poshytips
        $("[data-au-record]").each(function(){
            if(this != self.$element){
                $(this).poshytip('destroy');
            }
        });

        var parsedAttribute = Utilities.parseAttr($(this).attr('data-au-record'));

        $(this).poshytip({
            className: 'au-popover-tip',
            showOn: 'none',
            alignTo: 'target',
            alignX: 'center',
            keepInViewport: true,
            fade: false,
            slide: false,
            content : self.ui.render(
                $(this), parsedAttribute['id'], parsedAttribute['fieldId'], parsedAttribute['recordId'], self.storage
            )
        });
        $(this).poshytip('show');
    });
};

if(Meteor.isClient){
    (function($) {
        $.fn.cmsInnRecord = function(options) {
            var self = this;
            return this.each(function() {
                $.data(this, 'cmsInnRecord', new RecordPlugin(this, options));
            });
        };
    }(jQuery));

    if(UI){
        UI.registerHelper('recordByPlace', function (prefix, placeId) {
            contentDep.depend();
            prefix = _.isNull(prefix) || _.isUndefined(prefix) ? '' : prefix;
            var place = Utilities.normalizePrefix(prefix)+placeId;

            return CmsInnRecord.queryOne({places:{$in:[place]}});
        });

        UI.registerHelper('sorted', function (items, parent, limit) {
            contentDep.depend();
            items = items === undefined ? [] : items;
            return CmsInnRecord.query({_id:{$in:items}}, limit, parent);
        });

        //@todo: still not happy with this filter implementation
        UI.registerHelper('paging', function (prefix, placeId, limit) {
            contentDep.depend();
            var result = [];
            prefix = _.isNull(prefix) || _.isUndefined(prefix) ? '' : prefix;
            var place = Utilities.normalizePrefix(prefix)+placeId;

            var parsedAttribute = Utilities.parseAttr(place);
            var field = 'children';
            if(parsedAttribute['fieldId'] !== null){
                field = parsedAttribute['fieldId'];
            }

            var parent = CmsInnRecord.queryOne({places:{$in:[place]}});

            if(parent != undefined){
                CmsInnRecord.filters[parent._id].limit = limit;
                var items = 0
                if(field in parent && parent[field].length > 0){
                    items = parent[field].length;
                }

                var pages = Math.ceil(items / limit);
                var active = '';
                var page = 0;
                if (CmsInnRecord.filters[parent._id].skip > 0){
                    page = (CmsInnRecord.filters[parent._id].skip / CmsInnRecord.filters[parent._id].limit);
                }

                if(pages > 1){
                    for(var i=0; i<pages; i++){
                        active = page == i ? 'active': '';

                        result.push(
                            {
                                current: i+1,
                                skip: limit*i,
                                limit: limit,
                                isActive: active,
                                forRecord: parent._id
                            }
                        );
                    }
                }

            }
            return result;
        });
    }
}