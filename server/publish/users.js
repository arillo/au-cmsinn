Meteor.publish('users', function(){
    return Meteor.users.find({}, {
        fields: {
            profile: 1,
            users: 1,
            emails: 1,
            roles: 1
        }
    });
});