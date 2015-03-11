###*
# Default UI
###

LocaleUI = 
  storage: null
  element: null
  currentLocale: null
  init: (referenceToValue, storage, element) ->
    @storage = storage
    @element = element
    @destroy()
    @currentLocale = CmsInnLocale.get(referenceToValue)
    $('body').on 'click', '.js-close-locale', @closeWindow
    $('body').on 'change', '.js-locale-selector ', @bindLanguage
    return
  closeWindow: ->
    LocaleUI.element.poshytip 'destroy'
    return
  bindLanguage: ->
    if $('option:selected', this).val() != 'none'
      CmsInnLocale.bindLanguage $('option:selected', this).val(), $(this).attr('data-id')
      LocaleUI.element.poshytip 'destroy'
    return
  destroy: ->
    $('body').off 'click', '.js-close-locale', @closeWindow
    $('body').off 'change', '.js-locale-selector', @closeWindow
    return
  buildOptions: (locales) ->
    options = ''
    i = 0
    while i < locales.length
      selectedString = if @currentLocale == locales[i].locale then 'selected' else ''
      options += '                 <option value="' + locales[i].locale + '" ' + selectedString + '>' + locales[i].title + '</option>             '
      i++
    options
  render: (referenceToValue, locales, storage, element) ->
    @init referenceToValue, storage, element
    tpl = '             <div class="au-form au-form-nav ' + referenceToValue + '">                 <div class="au-form_item">                     <label class="au-form_label">Select language</label>                     <select data-id="' + referenceToValue + '" class="au-form_input au-form_input-select js-locale-selector">                         <option value="none">Select</option>                         ' + @buildOptions(locales) + '                     </select>                 </div>                 <div class="au-form_item au-tip_item-actions">                     <div class="au-form_actions">                         <button type="button" class="au-form_btn js-close-locale" data-id="' + referenceToValue + '">Close</button>                     </div>                 </div>             </div>         '
    tpl
gPluginName = 'locale'

###*
# jQuery plugin
###

LocalePlugin = (element, options) ->
  @$element = $(element)
  @settings = $.extend({}, options)

  @storage = @settings.storage if @settings.storage
  @ui = @settings.ui if @settings.ui and typeof @settings.ui == 'object'

  if options.destroy then @destroy() else @init()

Locale = ->
  @name = 'locale'
  @storage = null
  @ui = LocaleUI
  @contentType = 'locale'
  @defaultLocale = 'en_US'

  # default languages
  @allLanguages = [
    {
      locale: 'en_US'
      title: 'en_US'
    }
    {
      locale: 'de_DE'
      title: 'de_DE'
    }
  ]
  return

Locale::constructor = Locale

Locale::init = ->
  PluginBase::init.call this, gPluginName
  return

Locale::disable = ->
  PluginBase::disable.call this, gPluginName
  $('[data-au-locale]').cmsInnLocale
    destroy: true
    storage: @storage
    ui: @ui
  return

Locale::enable = ->
  PluginBase::enable.call this, gPluginName
  $('[data-au-locale]').cmsInnLocale
    storage: @storage
    ui: @ui
  return

Locale::config = (options) ->
  PluginBase::config.call this, gPluginName

  # overwrite default locales if defined in settings
  if options and _.isArray(options.locales) and not _.isEmpty(options.locales)
    @allLanguages = []

    _.each options.locales, (locale) =>
      @allLanguages.push(locale) if _.isEmpty(_.where(@allLanguages, locale))

  # set default locale, falling back to first locale if no default is defined in settings
  if options.defaultLocale?
    localeExists = !!_.find(@allLanguages, (language)-> language.locale is options.defaultLocale)
    @defaultLocale = options.defaultLocale if localeExists
  else
    @defaultLocale = _.first(@allLanguages).locale if not _.isEmpty(@allLanguages)

  return

Locale::get = (id) ->
  result = @storage.collection.findOne(_id: id)
  if result
    # return result.draft['locale'];
    # changed to work with versioning
    return result['locale']
  return

Locale::bindLanguage = (locale, id) ->
  result = @storage.collection.findOne(_id: id)
  if result
    @storage.update { _id: id }, $set: locale: locale
  else
    @storage.insert
      _id: id
      locale: locale
  return

CmsInnLocale = new Locale

LocalePlugin::destroy = ->
  @ui.destroy()
  @$element.removeClass 'au-mark'
  @$element.poshytip 'destroy'
  @$element.off 'click'
  return

LocalePlugin::init = ->
  self = this
  @$element.addClass 'au-mark'
  @$element.on 'click', ->
    # Destroy other poshytips
    $('[data-au-locale]').each ->
      if this != self.$element
        $(this).poshytip 'destroy'
      return
    referenceToValue = $(this).attr('data-au-locale')
    $(this).poshytip
      className: 'au-popover-tip'
      showOn: 'none'
      alignTo: 'target'
      alignX: 'center'
      keepInViewport: true
      fade: true
      slide: true
      content: self.ui.render(referenceToValue, CmsInnLocale.allLanguages, self.storage, self.$element)
    $(this).poshytip 'show'
    return
  return

if Meteor.isClient
  (($) ->

    $.fn.cmsInnLocale = (options) ->
      @each ->
        $.data this, 'cmsInnLocale', new LocalePlugin(this, options)
        return

    return
  ) jQuery
  if UI
    UI.registerHelper 'lang', (id) ->
      CmsInnLocale.get id