Template.cms_record.events 
    'click .js-cms_record-add_btn': (event, tmpl)->
        return if not @name

        place = if @id then @id + '_' + @name else @name

        CmsInnRecord.addRecord place