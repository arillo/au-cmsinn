var helpers = {
    clearControls: function(){
        CmsInn.disable();
        $('.js-plugin').removeClass('current is-disabled');
        $('.js-save,.js-cancel').removeClass('draft');
    }
}
Template.cmsinn_controls.events({
    'click .js-logout': function(e,tmpl){
        Meteor.logout();
    },
    'click .js-plugin': function(e,tmpl){
        e.preventDefault();
        var el, plugin;
        el = $(e.currentTarget);
        plugin = el.data('plugin');

        if(el.hasClass('is-disabled')) return;

        $('.js-plugin').addClass('is-disabled');
        $('.js-plugin').removeClass('current');

        // activate save button
        $('.js-save,.js-cancel').addClass('draft');

        if(plugin == this.currentPlugin){
            this.currentPlugin = false;
            CmsInn.disable();
            helpers.clearControls();
        } else {
            el.addClass('current');
            el.removeClass('is-disabled');
            CmsInn.enable(plugin);
            this.currentPlugin = plugin;
        }
    },
    'click .js-save': function(e,tmpl){
        CmsInn.plugins.versioning.enable();
        this.currentPlugin = false;
        helpers.clearControls();
    },
    'click .js-cancel': function(e,tmpl){
        this.currentPlugin = false;
        helpers.clearControls();
    }
});
Template.cmsinn_controls.helpers({
    'clear': function(){
        
    }
});
Template.cmsinn_controls.destroyed = function(){                                                                    // 69
    $('html').removeClass('au-is-active');                                                                               // 70
};

Template.cmsinn_controls.rendered = function(){
    $('html').addClass('au-is-active');
};

Meteor.startup(function(){
    $('body').on('click', '[data-au-locale]', function(event){
        CmsInn.plugins.label.setLocale($(event.currentTarget).attr('data-au-locale'));
    });

    $('body').on('click', '[data-au-filter]', function(event){
        CmsInn.plugins.record.setFilter($(event.currentTarget).attr('data-au-filter'));
    });
});