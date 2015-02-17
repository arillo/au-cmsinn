Iron.Router.plugins.aucmsinn = (router, options) ->
  # console.log('init plugin aucmsinn', router, options);
  # this loading plugin just creates an onBeforeAction hook
  # router.onBeforeAction('loading', options);
  if !options.routes
    alert 'no routes defined'
  _.each options.routes, (lookup) ->
    # add route
    Router.route lookup.uri,
      name: lookup._id
      template: lookup.template
      data: ->
        {
          _id: lookup._id
          template: lookup.template
          route: @route
          params: @params
          path: @path
        }
      action: ->
        @render @data().template
    return
  return
