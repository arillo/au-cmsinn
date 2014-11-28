Iron.Router.plugins.aucmsinn = function (router, options) {
    // console.log('init plugin aucmsinn', router, options);
    // this loading plugin just creates an onBeforeAction hook
    // router.onBeforeAction('loading', options);

    if(!options.routes) alert('no routes defined');

    _.each(options.routes, function(lookup){

        // add route
        Router.route(lookup.uri, {
            name : lookup._id,
            template: lookup.template,
            data : function(){
                return {
                    _id: lookup._id,
                    template: lookup.template,
                    route: this.route,
                    params: this.params,
                    path : this.path
                };
            },
            action: function(){
               return this.render(this.data().template);
            }
        });
    });
};