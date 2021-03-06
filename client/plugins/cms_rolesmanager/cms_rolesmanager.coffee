userDataForTemplate = (user) ->
  emails = undefined
  email = undefined
  profile = undefined
  name = undefined
  roles = undefined
  role = undefined
  services = undefined
  profile = user.profile
  emails = user.emails
  services = user.services
  if emails and emails[0]
    email = emails[0]
    if email
      email = email.address
  if profile
    name = profile.name
  if services
    _.find services, (service) ->
      if service.email
        return email = service.email
      return
  roles = user.roles
  if roles
    role = roles[0]
  else
    role = 'user'
  {
    _id: user._id
    name: email or name
    role: role
  }

userSelectOptionsForTemplate = (user, roles) ->
  userRole = undefined
  rolesForTemplate = undefined
  userRole = user.role
  rolesForTemplate = []
  _.each roles, (role) ->
    roleOption = undefined
    roleOption =
      value: role
      selected: if userRole == role then 'selected' else ''
    rolesForTemplate.push roleOption
    return
  rolesForTemplate

Template.cms_rolesmanager.created = ->
  @dep = new (Deps.Dependency)
  @keywords = ''
  @sortBy = 'name'
  @currentPage = 1
  @perPage = 20
  @users = []
  @totalUsers = 0
  Meteor.subscribe 'users', onReady: _.bind((->
    @dep.changed()
    return
  ), this)
  return

Template.cms_rolesmanager.events

  'keyup .js-cms_rolesmanager-search': (e, tmpl) ->
    e.preventDefault()
    tmpl.keywords = tmpl.$('.js-cms_rolesmanager-search').val()
    tmpl.currentPage = 1
    tmpl.dep.changed()
    return

  'click .js-cms_rolesmanager-sort-option': (e, tmpl) ->
    e.preventDefault()
    tmpl.sortBy = $(e.currentTarget).data('value') or 'name'
    tmpl.currentPage = 1
    tmpl.dep.changed()
    return

  'click .js-cms_rolesmanager-pager': (e, tmpl) ->
    e.preventDefault()
    tmpl.currentPage = $(e.target).data('value') or 1
    tmpl.dep.changed()
    return

Template.cms_rolesmanager.helpers

  users: ->
    tmpl = undefined
    currentUser = undefined
    currentUserId = undefined
    start = undefined
    end = undefined
    tmpl = Template.instance()
    tmpl.users.length = 0
    currentUser = Meteor.user()
    currentUserId = currentUser and currentUser._id
    Meteor.users.find({}).forEach ((user) ->
      userData = undefined
      userData = userDataForTemplate(user)
      if currentUserId != user._id
        userData.rolesSelectOptions = userSelectOptionsForTemplate(userData, CmsInn.plugins.rolesmanager.roles)
      tmpl.users.push userData
      return
    ), this
    tmpl.dep.depend()
    tmpl.users = _.chain(tmpl.users).filter((user) ->
      pattern = undefined
      pattern = new RegExp(tmpl.keywords, 'i')
      pattern.test user.name
    ).sortBy((user) ->
      user[tmpl.sortBy]
    ).value()
    tmpl.totalUsers = tmpl.users.length
    start = (tmpl.currentPage - 1) * tmpl.perPage
    end = (tmpl.currentPage - 1) * tmpl.perPage + tmpl.perPage
    tmpl.users.slice start, end

  pages: ->
    tmpl = undefined
    totalPages = undefined
    tmpl = Template.instance()
    totalPages = Math.ceil(tmpl.totalUsers / tmpl.perPage) + 1
    tmpl.dep.depend()
    _.range 1, totalPages

  isCurrentPage: (page) ->
    tmpl = undefined
    tmpl = Template.instance()
    tmpl.dep.depend()
    tmpl.currentPage == page