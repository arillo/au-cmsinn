Meteor.methods saveUserRole: (userId, role) ->
  Meteor.users.update { _id: userId }, $set: roles: [ role ]
  return