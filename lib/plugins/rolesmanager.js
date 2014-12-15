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

    Meteor.users.find({}).forEach(function(userData){
        console.log(userData);
        users.push(userDataForTemplate(userData));
    });
    
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

function userDataForTemplate(userData){
    var emails, email, profile, name, roles, role;

    emails = userData.emails;
    profile = userData.profile;

    if(emails && emails[0]){
        email = emails[0];
        
        if(email){
            email = email.address;
        }
    }

    if(!email && profile){
        name = profile.name;
    }

    roles = userData.roles;

    if(roles){
        role = roles[0];
    } else {
        role = 'user';
    }

    return {
        _id: userData._id,
        name: email || name,
        role: role
    };
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