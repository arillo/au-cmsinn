RolesManager = function(){
    this.roles = [
        'user',
        'editor',
        'admin'
    ];
};

RolesManager.prototype.init = function(){}

RolesManager.prototype.enable = function(){
    var users = [];
    var currentUser = Meteor.user();
    var currentUserId = currentUser && currentUser._id;

    Meteor.users.find({}).forEach(function(user){
        var userData = userDataForTemplate(user);
        if(currentUserId !== user._id){
            userData.rolesSelectOptions = userSelectOptionsForTemplate(userData, this.roles);
        }
        users.push(userData);
    }, this);

    this.view = UI.renderWithData(Template.cmsinn_rolesmanager, { users: users, roles: this.roles }, document.body);
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
        var userid = $el.data('userid');
        
        Meteor.users.find({ _id: userid })
    });
};

function userDataForTemplate(user){
    var emails, email, profile, name, roles, role;

    emails = user.emails;
    profile = user.profile;

    if(emails && emails[0]){
        email = emails[0];
        
        if(email){
            email = email.address;
        }
    }

    if(!email && profile){
        name = profile.name;
    }

    roles = user.roles;

    if(roles){
        role = roles[0];
    } else {
        role = 'user';
    }

    return {
        _id: user._id,
        name: email || name,
        role: role
    };
}

function userSelectOptionsForTemplate(user, roles){
    var userRole = user.role;
    var rolesForTemplate = [];

    _.each(roles, function(role){
        var roleOption = {
            value: role,
            selected: (userRole === role) ? 'selected' : ''
        };

        rolesForTemplate.push(roleOption);
    });

    return rolesForTemplate;
}

CmsInnRolesManager = new RolesManager();