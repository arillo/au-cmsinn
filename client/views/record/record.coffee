Template.cmsinn_record.events 
    'click .js-cmsinn-record-add-button': (event, tmpl)->
         CmsInnRecord.addRecord @id + '_' + @name