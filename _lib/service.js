if(Meteor.isServer){
    jQuery = {};
}

// var subs = new SubsManager();

/**
 * Storage public interface used by AuCmsInn internally
 *
 * @param adapter specialized implementation
 */
Storage = function (adapter) {
    this.adapter = adapter;
    this.collection = this.adapter.collection;
    this.hooks = {
        'beforeInsert': [],
        'beforeUpdate': [],
        'beforePublish': []
    };
};

Storage.prototype.constructor = Storage;

Storage.prototype.update = function (selector, modifier, options, callback) {
    // Run pre-update hooks 
    _.each(this.hooks.beforeUpdate, function (hook) {
        hook(selector, modifier, options);
    });
    this.adapter.update(selector, modifier, options, callback);
};

Storage.prototype.insert = function (doc, callback) {
    // Run pre-insert hooks
    _.each(this.hooks.beforeInsert, function (hook) {
        hook(doc);
    });
    this.adapter.insert(doc, callback);
};

Storage.prototype.remove = function (selector, options, callback) {
    this.adapter.remove(selector, options, callback);
};

Storage.prototype.beforeInsert = function (callback) {
    this.hooks.beforeInsert.push(callback);
};

Storage.prototype.beforeUpdate = function (callback) {
    this.hooks.beforeUpdate.push(callback);
};

Storage.prototype.beforePublish = function (callback) {
    this.hooks.beforePublish.push(callback);
};

/**
 * Main package
 *
 * @param plugins what plugins should be loaded
 */
AuCmsInn = function (plugins, jQuery) {
    this.subsciptionName = 'au-cmsinn-content';
    this.jquery = jQuery;

    // root key used in settings 
    this.settingsKey = 'au-cmsinn';
    this.plugins = plugins;

    // currently loaded plugin
    this.currentPlugin = null;
    this.options = {
        storageAdapter: new RemoteCollectionStorageAdapter(),
        plugins: {}
    };

    // on init subscribe to data
    // if (Meteor.isClient) {
    //     this.subscribe();
    // }
};

AuCmsInn.prototype.constructor = AuCmsInn;

/**
 * Configuration is loaded on client and server
 * difference is that on server we also publish data
 *
 * We init plugins here, set storage, configure router
 * and set settings
 */
AuCmsInn.prototype.configure = function (options) {
    var self = this;
    options = options || {};

    this.options = this.options || {};
    _.extend(this.options, options);

    this.storage = new Storage(this.options.storageAdapter);
    Log.debug('storage collection count:', this.storage.collection.find().count());

    // Each plugin can define hooks and those will be loaded here
    _.each(self.plugins, function (options, item) {
        if (typeof self.plugins[item].hooks === 'object') {
            if ('beforeInsert' in self.plugins[item].hooks) {
                self.storage.beforeInsert(self.plugins[item].hooks['beforeInsert']);
            }

            if ('beforeUpdate' in self.plugins[item].hooks) {
                self.storage.beforeUpdate(self.plugins[item].hooks['beforeUpdate']);
            }

            if ('beforePublish' in self.plugins[item].hooks) {
                self.storage.beforePublish(self.plugins[item].hooks['beforePublish']);
            }
        }
    });

    // Log.debug('Router.configure', this.options);
    // Router.configure(this.options);

    _.each(self.plugins, function (options, item) {
        self.plugins[item].storage = self.storage;
    });


    // // Set different template to be shown while data is being loaded
    // if (this.options.loadingTemplate) {
    //     Router.configure({
    //         loadingTemplate: this.options.loadingTemplate
    //     });
    // }
    // // Set not found template
    // if (this.options.notFoundTemplate) {
    //     Router.configure({
    //         notFoundTemplate: this.options.notFoundTemplate
    //     });
    // }
    
    // We got dependency here for router

    // Settings defined in settings.json will be loaded here
    // and passed to corresponding plugin
    _.each(this.plugins, function (plugin, item) {

        //  REMARK: check if intended to access via public on client?
        if(Meteor.isClient){
            if (_.isObject(Meteor.settings) && _.isObject(Meteor.settings.public) && _.isObject(Meteor.settings.public[self.settingsKey]) && _.has(Meteor.settings.public[self.settingsKey], item)) {
                if (!_.has(self.options.plugins, item)) {
                    self.options.plugins[item] = {};
                }
                _.extend(self.options.plugins[item], Meteor.settings.public[self.settingsKey][item]);
            }
        } else {
            if (_.isObject(Meteor.settings) && _.isObject(Meteor.settings[self.settingsKey]) && _.has(Meteor.settings[self.settingsKey], item)) {
                if (!_.has(self.options.plugins, item)) {
                    self.options.plugins[item] = {};
                }
                _.extend(self.options.plugins[item], Meteor.settings[self.settingsKey][item]);
            }
        }

        if (_.isUndefined(self.options.plugins[item])) {
            self.options.plugins[item] = {};
        }
        Log.debug(plugin.name, self.options.plugins[item]);
        plugin.config(self.options.plugins[item]);
    });

    if (Meteor.isClient) {
        this.subscribe();
    }

    // publish after configuration is done, because we are waitting for roles
    // that will define who can see what
    if (Meteor.isServer) {
        Log.debug('server publish');
        this.publish();
    }
};

// When we subscribe to data change layout to main one
AuCmsInn.prototype.onStarted = function () {
    if (this.options && this.options.layoutTemplate) {
        Router.configure({
            layoutTemplate: this.options.layoutTemplate
        });
    }
};

// We init plugins when we got data
// for example navigation plugin needs to load routes into router 
// that comes from db
AuCmsInn.prototype.subscribe = function () {
    var self = this;
    Router.configure({
        autoStart: false
    });

    var init = function () {
        _.each(self.plugins, function (options, item) {
            if (self.plugins[item].init != undefined) {
                self.plugins[item].init();
            }
        });

        self.onStarted();

        // When everything is loaded start router
        Router.start();
    };

    // we start Router manually because we have to load routes first
    // subs.subscribe(this.subsciptionName, init);
    Log.debug('subscribe', this.subsciptionName);
    Meteor.subscribe(this.subsciptionName, init);
};

// Execute hooks before publishing
AuCmsInn.prototype.publish = function () {
    var self = this;
    Meteor.publish(this.subsciptionName, function () {
        var that = this;
        var query = {};
        var options = {};
        _.each(self.storage.hooks.beforePublish, function (hook) {
            hook(query, options, that.userId);
        });
        
        Log.info('publish', self.subsciptionName, this.connection.id);
        // Log.debug(query, options);

        return self.storage.collection.find(query, options);
    });
};

// Toggle plugins and execute enable() method on plugin
AuCmsInn.prototype.enable = function (plugin) {
    this.currentPlugin = this.plugins[plugin];
    this.currentPlugin.enable(this.jquery);
};

// Disable
AuCmsInn.prototype.disable = function () {
    if (this.currentPlugin) {
        this.currentPlugin.disable(this.jquery);
        this.currentPlugin = null;
    }
};

/**
 * Initialiaze
 */
CmsInn = new AuCmsInn({
    label: CmsInnLabel,
    navigation: CmsInnNavigation,
    image: CmsInnImage,
    record: CmsInnRecord,
    locale: CmsInnLocale,
    sortable: CmsInnSortable,
    deletable: CmsInnDeletable,
    versioning: CmsInnVersioning,
    rolesmanager: CmsInnRolesManager,
    settings: CmsInnSettings
}, jQuery);

Log.debug(CmsInn);