var dep, keywords, sortBy, currentPage, perPage, users, totalUsers;

dep = new Deps.Dependency();
keywords = '';
sortBy = 'name';
currentPage = 1;
perPage = 20;
users = [];
totalUsers = 0;

Meteor.subscribe('users');

Template.cmsinn_rolesmanager.events({

    'keyup .js-cmsinn-rolesmanager-search': function(e, tmpl){
        e.preventDefault();
        keywords = tmpl.$('.js-cmsinn-rolesmanager-search').val();
        currentPage = 1;
        dep.changed();
    },

    'click .js-cmsinn-rolesmanager-sort-option': function(e, tmpl){
        e.preventDefault();
        sortBy = $(e.currentTarget).data('value') || 'name';
        currentPage = 1;
        dep.changed();
    },

    'click .js-cmsinn-rolesmanager-pager': function(e, tmpl){
        e.preventDefault();
        currentPage = $(e.target).data('value') || 1;
        dep.changed();
    }

});

Template.cmsinn_rolesmanager.helpers({

    users: function(){
        var currentUser, currentUserId, start, end;

        users.length = 0;

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

        users = _.chain(users)
        .filter(function(user){
            var pattern;
            pattern = new RegExp(keywords, 'i');
            return pattern.test(user.name);
        })
        .sortBy(function(user){
            return user[sortBy];
        })
        .value();

        totalUsers = users.length;

        start = ((currentPage - 1) * perPage);
        end = ((currentPage - 1) * perPage) + perPage;

        return users.slice(start, end);
    },

    pages: function(){
        var totalPages;

        totalPages = Math.ceil(users.length / perPage);

        dep.depend();

        return _.range(1, totalPages);
    },

    isCurrentPage: function(page){
        dep.depend();

        return currentPage === page;
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