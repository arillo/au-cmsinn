var gPluginName = 'rolesmanager';

RolesManager = function(){
    this.name = "rolesmanager";
    this.roles = [
        'user',
        'editor',
        'admin'
    ];
};

RolesManager.prototype.init = function(){
    PluginBase.prototype.init.call(this, gPluginName);
};

RolesManager.prototype.enable = function(){
    PluginBase.prototype.enable.call(this, gPluginName);

    this.view = UI.render(Template.cmsinn_rolesmanager, document.body);
    this.$el = $('.js-cmsinn-rolesmanager');
};

RolesManager.prototype.disable = function(){
    PluginBase.prototype.disable.call(this, gPluginName);

    this.save();

    if(this.view != null){
        UI.remove(this.view);
    }
};

RolesManager.prototype.config = function(options){
    PluginBase.prototype.config.call(this, gPluginName);
};

RolesManager.prototype.save = function(){
    var $roles;

    $roles = this.$el.find('.js-cmsinn-rolesmanager-role');

    $roles.each(function(){
        var $el, value, userId;

        $el = $(this);
        value = $el.val();
        userId = $el.data('userid');

        if(userId && value){
            Meteor.call('saveUserRole', userId, value);
        }
    });
};

CmsInnRolesManager = new RolesManager();