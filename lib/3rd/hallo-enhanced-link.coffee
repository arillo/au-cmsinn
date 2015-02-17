do (jQuery) ->
  jQuery.widget 'IKS.halloenhancedlink',
    options:
      editable: null
      uuid: ''
      link: true
      image: true
      defaultUrl: ''
      dialogOpts:
        autoOpen: false
        width: 540
        height: 200
        title: 'Enter Link'
        buttonTitle: 'Insert'
        buttonUpdateTitle: 'Update'
        modal: true
        resizable: false
        draggable: false
        dialogClass: 'hallolink-dialog'
      buttonCssClass: null
    populateToolbar: (toolbar) ->
      butTitle = undefined
      butUpdateTitle = undefined
      buttonize = undefined
      buttonset = undefined
      dialog = undefined
      dialogId = undefined
      dialogSubmitCb = undefined
      isEmptyLink = undefined
      urlInput = undefined
      widget = undefined
      _this = this
      widget = this
      dialogId = '' + @options.uuid + '-dialog'
      butTitle = @options.dialogOpts.buttonTitle
      butUpdateTitle = @options.dialogOpts.buttonUpdateTitle
      dialog = jQuery('<div id="' + dialogId + '">        <form action="#" method="post" class="linkForm">          <input class="url" type="text" name="url"            value="' + @options.defaultUrl + '" />          <input type="submit" id="addlinkButton" value="' + butTitle + '"/>        </form></div>')
      urlInput = jQuery('input[name=url]', dialog)

      isEmptyLink = (link) ->
        if new RegExp(/^\s*$/).test(link)
          return true
        if link == widget.options.defaultUrl
          return true
        false

      dialogSubmitCb = (event) ->
        link = undefined
        linkNode = undefined
        target = undefined
        event.preventDefault()
        link = urlInput.val()
        dialog.dialog 'close'
        widget.options.editable.restoreSelection widget.lastSelection
        if isEmptyLink(link)
          document.execCommand 'unlink', null, ''
        else
          target = ''
          if /:\/\//.test(link)
            target = 'target=\'_blank\''
          if widget.lastSelection.startContainer.parentNode.href == undefined
            if widget.lastSelection.collapsed
              linkNode = jQuery('<a href=\'' + link + '\' ' + target + '>' + link + '</a>')[0]
              widget.lastSelection.insertNode linkNode
            else
              selection = widget.options.editable.getSelection()
              widget.lastSelection.pasteHtml '<a href=\'' + link + '\' ' + target + '>' + selection + '</a>'
          else
            widget.lastSelection.startContainer.parentNode.href = link
        widget.options.editable.element.trigger 'change'
        false

      dialog.find('input[type=submit]').click dialogSubmitCb
      buttonset = jQuery('<span class="' + widget.widgetName + '"></span>')

      buttonize = (type) ->
        button = undefined
        buttonHolder = undefined
        id = undefined
        id = '' + _this.options.uuid + '-' + type
        buttonHolder = jQuery('<span></span>')
        buttonHolder.hallobutton
          label: 'Link'
          icon: 'icon-link'
          editable: _this.options.editable
          command: null
          queryState: false
          uuid: _this.options.uuid
          cssClass: _this.options.buttonCssClass
        buttonset.append buttonHolder
        button = buttonHolder
        button.on 'click', (event) ->
          button_selector = undefined
          selectionParent = undefined
          widget.lastSelection = widget.options.editable.getSelection()
          urlInput = jQuery('input[name=url]', dialog)
          selectionParent = widget.lastSelection.startContainer.parentNode
          if !selectionParent.href
            urlInput.val widget.options.defaultUrl
            jQuery(urlInput[0].form).find('input[type=submit]').val butTitle
          else
            urlInput.val jQuery(selectionParent).attr('href')
            button_selector = 'input[type=submit]'
            jQuery(urlInput[0].form).find(button_selector).val butUpdateTitle
          widget.options.editable.keepActivated true
          dialog.dialog 'open'
          dialog.on 'dialogclose', ->
            widget.options.editable.restoreSelection widget.lastSelection
            jQuery('label', buttonHolder).removeClass 'ui-state-active'
            widget.options.editable.element.focus()
            widget.options.editable.keepActivated false
          false
        _this.element.on 'keyup paste change mouseup', (event) ->
          nodeName = undefined
          start = undefined
          start = jQuery(widget.options.editable.getSelection().startContainer)
          if start.prop('nodeName')
            nodeName = start.prop('nodeName')
          else
            nodeName = start.parent().prop('nodeName')
          if nodeName and nodeName.toUpperCase() == 'A'
            jQuery('label', button).addClass 'ui-state-active'
            return
          jQuery('label', button).removeClass 'ui-state-active'

      if @options.link
        buttonize 'A'
      if @options.link
        toolbar.append buttonset
        buttonset.hallobuttonset()
        return dialog.dialog(@options.dialogOpts)
      return
