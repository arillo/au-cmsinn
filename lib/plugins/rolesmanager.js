RolesManager = function(){
    this.roles = [
        'user',
        'editor',
        'admin'
    ];
};

RolesManager.prototype.init = function(){}

RolesManager.prototype.enable = function(){
    console.log(1);
    var users = [];

    Meteor.users.find({}).forEach(function(user){
        var userData = userDataForTemplate(user);
        userData.rolesSelectOptions = userSelectOptionsForTemplate(userData, this.roles);
        users.push(userData);
    }, this);
    
    console.log(users);

    this.view = UI.renderWithData(Template.cmsinn_rolesmanager, {users: users, roles: this.roles}, document.body);
    this.$el = $('.js-cmsinn-rolesmanager');
};

RolesManager.prototype.disable = function(){
    console.log(2);
    if(this.view != null){
        UI.remove(this.view);
    }
};

RolesManager.prototype.config = function(options){};

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

if(Meteor.isServer){
    Meteor.publish(null, function(){
        return Meteor.users.find({}, {
            fields: {
                profile: 1,
                users: 1,
                emails: 1,
                roles: 1
            }
        });
    });
}