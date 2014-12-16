var dep, keywords;
dep = new Deps.Dependency();
keywords = '';

Template.cmsinn_rolesmanager.events({

    'keyup .js-cmsinn-rolesmanager-search': function(e, tmpl){
        keywords = tmpl.$('.js-cmsinn-rolesmanager-search').val();
        dep.changed();
    }

});

Template.cmsinn_rolesmanager.helpers({

    users: function(){
        var users, currentUser, currentUserId;

        users = [];
        currentUser = Meteor.user();
        currentUserId = currentUser && currentUser._id;

        Meteor.users.find({}).forEach(function(user){
            var userData;

            userData = userDataForTemplate(user);

            if(currentUserId !== user._id){
                userData.rolesSelectOptions = userSelectOptionsForTemplate(userData, CmsInn.plugins.rolesmanager.roles);
            }

            users.push(userData);
        }, this);

        dep.depend();

        // if(!keywords){
        //     return users;
        // }

        return _(users).filter(function(user){
            var pattern;
            pattern = new RegExp(keywords, 'i');
            return pattern.test(user.name);
        });
    }

});

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
    var userRole, rolesForTemplate;

    userRole = user.role;
    rolesForTemplate = [];

    _.each(roles, function(role){
        var roleOption;

        roleOption = {
            value: role,
            selected: (userRole === role) ? 'selected' : ''
        };

        rolesForTemplate.push(roleOption);
    });

    return rolesForTemplate;
}