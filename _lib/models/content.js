Content = function(document){
    _.extend(this, document);
};

Content.prototype = {
    constructor: Content,

    get : function(name){
        if(_.has(this, 'draft') && _.isObject(this.draft) && _.has(this.draft, name)){
            return this.draft[name];
        } else if (_.has(this, name)){
            return this[name];
        }

        return null;
    },

    findField : function(contentType){
        var fields = this;
        if(_.has(this, 'draft') && _.isObject(this.draft) && !_.isEmpty(this.draft)){
            fields = this.draft;
        } 
        
        for(var field in fields){
            if(_.has(fields[field], 'contentType') && fields[field]['contentType'] === contentType){
                fields[field]['_id'] = this._id;
                return fields[field];
            }
        }


        return null;
    },

    firstFieldWithValue : function(inField){
        var exclude = ["_id", "children", "contentType", "parents", "places", "types", "sortOrder", "isDraft", "draft"];

        var lookup = {};
        if(_.isUndefined(inField)){
            for(var field in this){
                if(this.hasOwnProperty(field)){
                    if(_.indexOf(exclude, field, true) === -1){
                        if(_.isString(this.get(field)) && this.get(field) !== ''){
                            return this.get(field);
                        }
                    }
                }
            }
        } else if(_.has(this, inField)){
            for(var field in this[inField]){
                if(this[inField].hasOwnProperty(field)){
                    if(_.indexOf(exclude, field, true) === -1){
                        if(_.isString(this[inField][field]) && this[inField][field] !== ''){
                            return this[inField][field];
                        }
                    }
                }
            }
        }

        return '';
    }
}

ContentCollection = new Meteor.Collection("au-cmsinn-content", {
    transform: function(document){
        return new Content(document)
    }
});

var canEdit = function(){
    var user, roles;

    user = Meteor.user();

    if(user){
        roles = user.roles;
        return roles.indexOf('admin') !== -1 || roles.indexOf('editor') !== -1;
    }

    return false;
};

if(Meteor.isServer){
    ContentCollection.allow({
        insert: function (userId, doc) {
            return canEdit();
        },
        update: function (userId, doc, fields, modifier) {
            return canEdit();
        },
        remove: function (userId, doc) {
            return canEdit();
        }
    });
}

if(Meteor.isClient){
    // make the collection available for the client
    window.ContentCollection = ContentCollection;
}