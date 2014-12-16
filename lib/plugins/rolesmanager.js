RolesManager = function(){
    this.roles = [
        'user',
        'editor',
        'admin'
    ];
};

RolesManager.prototype.init = function(){}

RolesManager.prototype.enable = function(){
    this.view = UI.render(Template.cmsinn_rolesmanager, document.body);
    this.$el = $('.js-cmsinn-rolesmanager');
};

RolesManager.prototype.disable = function(){
    this.save();

    if(this.view != null){
        UI.remove(this.view);
    }
};

RolesManager.prototype.config = function(options){};

RolesManager.prototype.save = function(){
    var $roles = this.$el.find('.js-cmsinn-rolesmanager-role');

    $roles.each(function(){
        var $el = $(this);
        var value = $el.val();
        var userId = $el.data('userid');
        
        if(userId && value){
            Meteor.call('saveUserRole', userId, value);
        }
    });
};

CmsInnRolesManager = new RolesManager();

// TEST DATA
// if(Meteor.isServer){
//     var names = ['John','Michael','Robert','Frank','Kim','Lisa','Marta','Sarah'];
//     var surnames = ['Smith','Red','White','Black','Brown'];
//     var roles = ['user','editor','admin'];

//     var generateTestUser = function(i){
//         var name = _.sample(names);
//         var surname = _.sample(surnames);
//         var role = _.sample(roles);

//         return {
//             profile: {
//                 name: name + ' ' + surname
//             },
//             roles: [role]
//         };
//     }

//     for(var i = 0; i < 100; i+=1){
//         Meteor.users.insert(generateTestUser(i));
//     }
// }