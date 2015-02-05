Template.cmsinn_rolesmanager.created = function(){
    this.dep = new Deps.Dependency();
    this.keywords = '';
    this.sortBy = 'name';
    this.currentPage = 1;
    this.perPage = 20;
    this.users = [];
    this.totalUsers = 0;

    Meteor.subscribe('users', {
        onReady: _.bind(function(){
            this.dep.changed();
        }, this)
    });
};

Template.cmsinn_rolesmanager.events({

    'keyup .js-cmsinn-rolesmanager-search': function(e, tmpl){
        e.preventDefault();
        tmpl.keywords = tmpl.$('.js-cmsinn-rolesmanager-search').val();
        tmpl.currentPage = 1;
        tmpl.dep.changed();
    },

    'click .js-cmsinn-rolesmanager-sort-option': function(e, tmpl){
        e.preventDefault();
        tmpl.sortBy = $(e.currentTarget).data('value') || 'name';
        tmpl.currentPage = 1;
        tmpl.dep.changed();
    },

    'click .js-cmsinn-rolesmanager-pager': function(e, tmpl){
        e.preventDefault();
        tmpl.currentPage = $(e.target).data('value') || 1;
        tmpl.dep.changed();
    }

});

Template.cmsinn_rolesmanager.helpers({

    users: function(){
        var tmpl, currentUser, currentUserId, start, end;

        tmpl = Template.instance();

        tmpl.users.length = 0;

        currentUser = Meteor.user();
        currentUserId = currentUser && currentUser._id;

        Meteor.users.find({}).forEach(function(user){
            var userData;

            userData = userDataForTemplate(user);

            if(currentUserId !== user._id){
                userData.rolesSelectOptions = userSelectOptionsForTemplate(userData, CmsInn.plugins.rolesmanager.roles);
            }

            tmpl.users.push(userData);
        }, this);

        tmpl.dep.depend();

        tmpl.users = _.chain(tmpl.users)
        .filter(function(user){
            var pattern;
            pattern = new RegExp(tmpl.keywords, 'i');
            return pattern.test(user.name);
        })
        .sortBy(function(user){
            return user[tmpl.sortBy];
        })
        .value();

        tmpl.totalUsers = tmpl.users.length;

        start = ((tmpl.currentPage - 1) * tmpl.perPage);
        end = ((tmpl.currentPage - 1) * tmpl.perPage) + tmpl.perPage;

        return tmpl.users.slice(start, end);
    },

    pages: function(){
        var tmpl, totalPages;

        tmpl = Template.instance();

        totalPages = Math.ceil(tmpl.totalUsers / tmpl.perPage) + 1;

        tmpl.dep.depend();

        return _.range(1, totalPages);
    },

    isCurrentPage: function(page){
        var tmpl;

        tmpl = Template.instance();

        tmpl.dep.depend();

        return tmpl.currentPage === page;
    }

});

function userDataForTemplate(user){
    var emails, email, profile, name, roles, role, services;

    profile = user.profile;
    emails = user.emails;
    services = user.services;

    if(emails && emails[0]){
        email = emails[0];
        
        if(email){
            email = email.address;
        }
    }

    if(profile){
        name = profile.name;
    }

    if(services){
        _.find(services, function(service){
            if(service.email){
                return email = service.email;
            }
        });
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