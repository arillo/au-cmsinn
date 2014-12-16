Meteor.methods({

    saveUserRole: function(userId, role){
        Meteor.users.update({ _id: userId }, { $set: { roles: [role] } });
    }

});