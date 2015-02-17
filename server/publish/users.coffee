Meteor.publish 'users', ->
  if @userId
    user = Meteor.users.findOne(@userId)
    isAdmin = user and _.contains(user.roles, 'admin')
    isEditor = user and _.contains(user.roles, 'editor')
    if isAdmin or isEditor
      return Meteor.users.find({}, fields:
        profile: 1
        users: 1
        emails: 1
        roles: 1
        services: 1)
  null