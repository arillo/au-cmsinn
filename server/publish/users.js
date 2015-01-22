Meteor.publish('users', function(){
    if(this.userId){
        var user = Meteor.users.findOne(this.userId);
        var isAdmin = user && _.contains(user.roles, 'admin');
        var isEditor = user &&_.contains(user.roles, 'editor');

        if(isAdmin || isEditor){
            return Meteor.users.find({}, {
                fields: {
                    profile: 1,
                    users: 1,
                    emails: 1,
                    roles: 1,
                    services: 1
                }
            });
        }
    }
    return null;
});