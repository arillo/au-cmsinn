###
# Poshy Tip jQuery plugin v1.2
# http://vadikom.com/tools/poshy-tip-jquery-plugin-for-stylish-tooltips/
# Copyright 2010-2013, Vasil Dinkov, http://vadikom.com/
###

(($) ->
  tips = []
  reBgImage = /^url\(["']?([^"'\)]*)["']?\);?$/i
  rePNG = /\.png$/i
  ie6 = ! !window.createPopup and document.documentElement.currentStyle.minWidth == 'undefined'
  # make sure the tips' position is updated on resize

  handleWindowResize = ->
    $.each tips, ->
      @refresh true
      return
    return

  $(window).resize handleWindowResize

  $.Poshytip = (elm, options) ->
    @$elm = $(elm)
    @opts = $.extend({}, $.fn.poshytip.defaults, options)
    @$tip = $([
      '<div class="'
      @opts.className
      '">'
      '<div class="tip-inner tip-bg-image"></div>'
      '<div class="tip-arrow tip-arrow-top tip-arrow-right tip-arrow-bottom tip-arrow-left"></div>'
      '</div>'
    ].join('')).appendTo(document.body)
    @$arrow = @$tip.find('div.tip-arrow')
    @$inner = @$tip.find('div.tip-inner')
    @disabled = false
    @content = null
    @init()
    return

  $.Poshytip.prototype =
    init: ->
      tips.push this
      # save the original title and a reference to the Poshytip object
      title = @$elm.attr('title')
      @$elm.data('title.poshytip', if title != undefined then title else null).data 'poshytip', this
      # hook element events
      if @opts.showOn != 'none'
        @$elm.bind
          'mouseenter.poshytip': $.proxy(@mouseenter, this)
          'mouseleave.poshytip': $.proxy(@mouseleave, this)
        switch @opts.showOn
          when 'hover'
            if @opts.alignTo == 'cursor'
              @$elm.bind 'mousemove.poshytip', $.proxy(@mousemove, this)
            if @opts.allowTipHover
              @$tip.hover $.proxy(@clearTimeouts, this), $.proxy(@mouseleave, this)
          when 'focus'
            @$elm.bind
              'focus.poshytip': $.proxy(@showDelayed, this)
              'blur.poshytip': $.proxy(@hideDelayed, this)
      return
    mouseenter: (e) ->
      if @disabled
        return true
      @$elm.attr 'title', ''
      if @opts.showOn == 'focus'
        return true
      @showDelayed()
      return
    mouseleave: (e) ->
      if @disabled or @asyncAnimating and (@$tip[0] == e.relatedTarget or jQuery.contains(@$tip[0], e.relatedTarget))
        return true
      if !@$tip.data('active')
        title = @$elm.data('title.poshytip')
        if title != null
          @$elm.attr 'title', title
      if @opts.showOn == 'focus'
        return true
      @hideDelayed()
      return
    mousemove: (e) ->
      if @disabled
        return true
      @eventX = e.pageX
      @eventY = e.pageY
      if @opts.followCursor and @$tip.data('active')
        @calcPos()
        @$tip.css
          left: @pos.l
          top: @pos.t
        if @pos.arrow
          @$arrow[0].className = 'tip-arrow tip-arrow-' + @pos.arrow
      return
    show: ->
      if @disabled or @$tip.data('active')
        return
      @reset()
      @update()
      # don't proceed if we didn't get any content in update() (e.g. the element has an empty title attribute)
      if !@content
        return
      @display()
      if @opts.timeOnScreen
        @hideDelayed @opts.timeOnScreen
      return
    showDelayed: (timeout) ->
      @clearTimeouts()
      @showTimeout = setTimeout($.proxy(@show, this), if typeof timeout == 'number' then timeout else @opts.showTimeout)
      return
    hide: ->
      if @disabled or !@$tip.data('active')
        return
      @display true
      return
    hideDelayed: (timeout) ->
      @clearTimeouts()
      @hideTimeout = setTimeout($.proxy(@hide, this), if typeof timeout == 'number' then timeout else @opts.hideTimeout)
      return
    reset: ->
      @$tip.queue([]).detach().css('visibility', 'hidden').data 'active', false
      @$inner.find('*').poshytip 'hide'
      if @opts.fade
        @$tip.css 'opacity', @opacity
      @$arrow[0].className = 'tip-arrow tip-arrow-top tip-arrow-right tip-arrow-bottom tip-arrow-left'
      @asyncAnimating = false
      return
    update: (content, dontOverwriteOption) ->
      if @disabled
        return
      async = content != undefined
      if async
        if !dontOverwriteOption
          @opts.content = content
        if !@$tip.data('active')
          return
      else
        content = @opts.content
      # update content only if it has been changed since last time
      self = this
      newContent = if typeof content == 'function' then content.call(@$elm[0], ((newContent) ->
        self.update newContent
        return
      )) else if content == '[title]' then @$elm.data('title.poshytip') else content
      if @content != newContent
        @$inner.empty().append newContent
        @content = newContent
      @refresh async
      return
    refresh: (async) ->
      if @disabled
        return
      if async
        if !@$tip.data('active')
          return
        # save current position as we will need to animate
        currPos = 
          left: @$tip.css('left')
          top: @$tip.css('top')
      # reset position to avoid text wrapping, etc.
      @$tip.css(
        left: 0
        top: 0).appendTo document.body
      # save default opacity
      if @opacity == undefined
        @opacity = @$tip.css('opacity')
      # check for images - this code is here (i.e. executed each time we show the tip and not on init) due to some browser inconsistencies
      bgImage = @$tip.css('background-image').match(reBgImage)
      arrow = @$arrow.css('background-image').match(reBgImage)
      if bgImage
        bgImagePNG = rePNG.test(bgImage[1])
        # fallback to background-color/padding/border in IE6 if a PNG is used
        if ie6 and bgImagePNG
          @$tip.css 'background-image', 'none'
          @$inner.css
            margin: 0
            border: 0
            padding: 0
          bgImage = bgImagePNG = false
        else
          @$tip.prepend('<table class="tip-table" border="0" cellpadding="0" cellspacing="0"><tr><td class="tip-top tip-bg-image" colspan="2"><span></span></td><td class="tip-right tip-bg-image" rowspan="2"><span></span></td></tr><tr><td class="tip-left tip-bg-image" rowspan="2"><span></span></td><td></td></tr><tr><td class="tip-bottom tip-bg-image" colspan="2"><span></span></td></tr></table>').css(
            border: 0
            padding: 0
            'background-image': 'none'
            'background-color': 'transparent').find('.tip-bg-image').css('background-image', 'url("' + bgImage[1] + '")').end().find('td').eq(3).append @$inner
        # disable fade effect in IE due to Alpha filter + translucent PNG issue
        if bgImagePNG and !$.support.opacity
          @opts.fade = false
      # IE arrow fixes
      if arrow and !$.support.opacity
        # disable arrow in IE6 if using a PNG
        if ie6 and rePNG.test(arrow[1])
          arrow = false
          @$arrow.css 'background-image', 'none'
        # disable fade effect in IE due to Alpha filter + translucent PNG issue
        @opts.fade = false
      $table = @$tip.find('> table.tip-table')
      if ie6
        # fix min/max-width in IE6
        @$tip[0].style.width = ''
        $table.width('auto').find('td').eq(3).width 'auto'
        tipW = @$tip.width()
        minW = parseInt(@$tip.css('min-width'))
        maxW = parseInt(@$tip.css('max-width'))
        if !isNaN(minW) and tipW < minW
          tipW = minW
        else if !isNaN(maxW) and tipW > maxW
          tipW = maxW
        @$tip.add($table).width(tipW).eq(0).find('td').eq(3).width '100%'
      else if $table[0]
        # fix the table width if we are using a background image
        # IE9, FF4 use float numbers for width/height so use getComputedStyle for them to avoid text wrapping
        # for details look at: http://vadikom.com/dailies/offsetwidth-offsetheight-useless-in-ie9-firefox4/
        $table.width('auto').find('td').eq(3).width('auto').end().end().width(document.defaultView and document.defaultView.getComputedStyle and parseFloat(document.defaultView.getComputedStyle(@$tip[0], null).width) or @$tip.width()).find('td').eq(3).width '100%'
      @tipOuterW = @$tip.outerWidth()
      @tipOuterH = @$tip.outerHeight()
      @calcPos()
      # position and show the arrow image
      if arrow and @pos.arrow
        @$arrow[0].className = 'tip-arrow tip-arrow-' + @pos.arrow
        @$arrow.css 'visibility', 'inherit'
      if async and @opts.refreshAniDuration
        @asyncAnimating = true
        self = this
        @$tip.css(currPos).animate {
          left: @pos.l
          top: @pos.t
        }, @opts.refreshAniDuration, ->
          self.asyncAnimating = false
          return
      else
        @$tip.css
          left: @pos.l
          top: @pos.t
      return
    display: (hide) ->
      active = @$tip.data('active')
      if active and !hide or !active and hide
        return
      @$tip.stop()
      if (@opts.slide and @pos.arrow or @opts.fade) and (hide and @opts.hideAniDuration or !hide and @opts.showAniDuration)
        from = {}
        to = {}
        # this.pos.arrow is only undefined when alignX == alignY == 'center' and we don't need to slide in that rare case
        if @opts.slide and @pos.arrow
          prop = undefined
          arr = undefined
          if @pos.arrow == 'bottom' or @pos.arrow == 'top'
            prop = 'top'
            arr = 'bottom'
          else
            prop = 'left'
            arr = 'right'
          val = parseInt(@$tip.css(prop))
          from[prop] = val + (if hide then 0 else if @pos.arrow == arr then -@opts.slideOffset else @opts.slideOffset)
          to[prop] = val + (if hide then (if @pos.arrow == arr then @opts.slideOffset else -@opts.slideOffset) else 0) + 'px'
        if @opts.fade
          from.opacity = if hide then @$tip.css('opacity') else 0
          to.opacity = if hide then 0 else @opacity
        @$tip.css(from).animate to, @opts[if hide then 'hideAniDuration' else 'showAniDuration']
      if hide then @$tip.queue($.proxy(@reset, this)) else @$tip.css('visibility', 'inherit')
      if active
        title = @$elm.data('title.poshytip')
        if title != null
          @$elm.attr 'title', title
      @$tip.data 'active', !active
      return
    disable: ->
      @reset()
      @disabled = true
      return
    enable: ->
      @disabled = false
      return
    destroy: ->
      @reset()
      @$tip.remove()
      delete @$tip
      @content = null
      @$elm.unbind('.poshytip').removeData('title.poshytip').removeData 'poshytip'
      tips.splice $.inArray(this, tips), 1
      return
    clearTimeouts: ->
      if @showTimeout
        clearTimeout @showTimeout
        @showTimeout = 0
      if @hideTimeout
        clearTimeout @hideTimeout
        @hideTimeout = 0
      return
    calcPos: ->
      pos = 
        l: 0
        t: 0
        arrow: ''
      $win = $(window)
      win = 
        l: $win.scrollLeft()
        t: $win.scrollTop()
        w: $win.width()
        h: $win.height()
      xL = undefined
      xC = undefined
      xR = undefined
      yT = undefined
      yC = undefined
      yB = undefined
      if @opts.alignTo == 'cursor'
        xL = xC = xR = @eventX
        yT = yC = yB = @eventY
      else
        # this.opts.alignTo == 'target'
        elmOffset = @$elm.offset()
        elm = 
          l: elmOffset.left
          t: elmOffset.top
          w: @$elm.outerWidth()
          h: @$elm.outerHeight()
        xL = elm.l + (if @opts.alignX != 'inner-right' then 0 else elm.w)
        # left edge
        xC = xL + Math.floor(elm.w / 2)
        # h center
        xR = xL + (if @opts.alignX != 'inner-left' then elm.w else 0)
        # right edge
        yT = elm.t + (if @opts.alignY != 'inner-bottom' then 0 else elm.h)
        # top edge
        yC = yT + Math.floor(elm.h / 2)
        # v center
        yB = yT + (if @opts.alignY != 'inner-top' then elm.h else 0)
        # bottom edge
      # keep in viewport and calc arrow position
      switch @opts.alignX
        when 'right', 'inner-left'
          pos.l = xR + @opts.offsetX
          if @opts.keepInViewport and pos.l + @tipOuterW > win.l + win.w
            pos.l = win.l + win.w - @tipOuterW
          if @opts.alignX == 'right' or @opts.alignY == 'center'
            pos.arrow = 'left'
        when 'center'
          pos.l = xC - Math.floor(@tipOuterW / 2)
          if @opts.keepInViewport
            if pos.l + @tipOuterW > win.l + win.w
              pos.l = win.l + win.w - @tipOuterW
            else if pos.l < win.l
              pos.l = win.l
        else
          # 'left' || 'inner-right'
          pos.l = xL - @tipOuterW - @opts.offsetX
          if @opts.keepInViewport and pos.l < win.l
            pos.l = win.l
          if @opts.alignX == 'left' or @opts.alignY == 'center'
            pos.arrow = 'right'
      switch @opts.alignY
        when 'bottom', 'inner-top'
          pos.t = yB + @opts.offsetY
          # 'left' and 'right' need priority for 'target'
          if !pos.arrow or @opts.alignTo == 'cursor'
            pos.arrow = 'top'
          if @opts.keepInViewport and pos.t + @tipOuterH > win.t + win.h
            pos.t = yT - @tipOuterH - @opts.offsetY
            if pos.arrow == 'top'
              pos.arrow = 'bottom'
        when 'center'
          pos.t = yC - Math.floor(@tipOuterH / 2)
          if @opts.keepInViewport
            if pos.t + @tipOuterH > win.t + win.h
              pos.t = win.t + win.h - @tipOuterH
            else if pos.t < win.t
              pos.t = win.t
        else
          # 'top' || 'inner-bottom'
          pos.t = yT - @tipOuterH - @opts.offsetY
          # 'left' and 'right' need priority for 'target'
          if !pos.arrow or @opts.alignTo == 'cursor'
            pos.arrow = 'bottom'
          if @opts.keepInViewport and pos.t < win.t
            pos.t = yB + @opts.offsetY
            if pos.arrow == 'bottom'
              pos.arrow = 'top'
      @pos = pos
      return

  $.fn.poshytip = (options) ->
    if typeof options == 'string'
      args = arguments
      method = options
      Array::shift.call args
      # unhook live events if 'destroy' is called
      if method == 'destroy'
        if @die then @die('mouseenter.poshytip').die('focus.poshytip') else $(document).undelegate(@selector, 'mouseenter.poshytip').undelegate(@selector, 'focus.poshytip')
      return @each(->
        poshytip = $(this).data('poshytip')
        if poshytip and poshytip[method]
          poshytip[method].apply poshytip, args
        return
      )
    opts = $.extend({}, $.fn.poshytip.defaults, options)
    # generate CSS for this tip class if not already generated
    if !$('#poshytip-css-' + opts.className)[0]
      $([
        '<style id="poshytip-css-'
        opts.className
        '" type="text/css">'
        'div.'
        opts.className
        '{visibility:hidden;position:absolute;top:0;left:0;}'
        'div.'
        opts.className
        ' table.tip-table, div.'
        opts.className
        ' table.tip-table td{margin:0;font-family:inherit;font-size:inherit;font-weight:inherit;font-style:inherit;font-variant:inherit;vertical-align:middle;}'
        'div.'
        opts.className
        ' td.tip-bg-image span{display:block;font:1px/1px sans-serif;height:'
        opts.bgImageFrameSize
        'px;width:'
        opts.bgImageFrameSize
        'px;overflow:hidden;}'
        'div.'
        opts.className
        ' td.tip-right{background-position:100% 0;}'
        'div.'
        opts.className
        ' td.tip-bottom{background-position:100% 100%;}'
        'div.'
        opts.className
        ' td.tip-left{background-position:0 100%;}'
        'div.'
        opts.className
        ' div.tip-inner{background-position:-'
        opts.bgImageFrameSize
        'px -'
        opts.bgImageFrameSize
        'px;}'
        'div.'
        opts.className
        ' div.tip-arrow{visibility:hidden;position:absolute;overflow:hidden;font:1px/1px sans-serif;}'
        '</style>'
      ].join('')).appendTo 'head'
    # check if we need to hook live events
    if opts.liveEvents and opts.showOn != 'none'
      handler = undefined
      deadOpts = $.extend({}, opts, liveEvents: false)
      switch opts.showOn
        when 'hover'

          handler = ->
            $this = $(this)
            if !$this.data('poshytip')
              $this.poshytip(deadOpts).poshytip 'mouseenter'
            return

          # support 1.4.2+ & 1.9+
          if @live then @live('mouseenter.poshytip', handler) else $(document).delegate(@selector, 'mouseenter.poshytip', handler)
        when 'focus'

          handler = ->
            $this = $(this)
            if !$this.data('poshytip')
              $this.poshytip(deadOpts).poshytip 'showDelayed'
            return

          if @live then @live('focus.poshytip', handler) else $(document).delegate(@selector, 'focus.poshytip', handler)
      return this
    @each ->
      new ($.Poshytip)(this, opts)
      return

  # default settings
  $.fn.poshytip.defaults =
    content: '[title]'
    className: 'tip-yellow'
    bgImageFrameSize: 10
    showTimeout: 500
    hideTimeout: 100
    timeOnScreen: 0
    showOn: 'hover'
    liveEvents: false
    alignTo: 'cursor'
    alignX: 'right'
    alignY: 'top'
    offsetX: -22
    offsetY: 18
    keepInViewport: true
    allowTipHover: true
    followCursor: false
    fade: true
    slide: true
    slideOffset: 8
    showAniDuration: 300
    hideAniDuration: 300
    refreshAniDuration: 200
  return
) window.jQuery
