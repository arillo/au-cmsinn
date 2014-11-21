/**
 * Default UI
 */
var LocaleUI = {
    storage : null,
    element : null,
    currentLocale : null,
    init: function(referenceToValue, storage, element){
        this.storage = storage;
        this.element = element;

        this.destroy();

        this.currentLocale = CmsInnLocale.get(referenceToValue);
        $('body').on('click', '.js-close-locale', this.closeWindow);
        $('body').on('change', '.js-locale-selector ', this.bindLanguage);
    },
    closeWindow : function(){
        LocaleUI.element.poshytip('destroy');
    },
    bindLanguage: function(){
        if($("option:selected", this).val() != 'none'){
            CmsInnLocale.bindLanguage(
                $("option:selected", this).val(),
                $(this).attr('data-id')
            );

            LocaleUI.element.poshytip('destroy');
        }
    },
    destroy : function(){
        $('body').off('click', '.js-close-locale', this.closeWindow);
        $('body').off('change', '.js-locale-selector', this.closeWindow);
    },
    buildOptions: function(locales){
        var options = '';
        for(var i=0; i<locales.length; i++){
            var selectedString = this.currentLocale === locales[i].locale ? 'selected' : '';
            options += ' \
                <option value="'+locales[i].locale+'" '+selectedString+'>'+locales[i].title+'</option> \
            ';
        }
        return options;
    },
    render : function(referenceToValue, locales, storage, element){
        this.init(referenceToValue, storage, element);

        var tpl = ' \
            <div class="au-form au-form-nav '+referenceToValue+'"> \
                <div class="au-form_item"> \
                    <label class="au-form_label">Select language</label> \
                    <select data-id="'+referenceToValue+'" class="au-form_input au-form_input-select js-locale-selector"> \
                        <option value="none">Select</option> \
                        '+this.buildOptions(locales)+' \
                    </select> \
                </div> \
                <div class="au-form_item au-tip_item-actions"> \
                    <div class="au-form_actions"> \
                        <button type="button" class="au-form_btn js-close-locale" data-id="'+referenceToValue+'">Close</button> \
                    </div> \
                </div> \
            </div> \
        ';

        return tpl;
    }
};

Locale = function(){
    this.storage = null;
    this.ui = LocaleUI;
    this.contentType = 'locale';
    this.defaultLocale = 'en_US';
    this.allLanguages = [
        {locale: "en_US", title: "en_US"},
        {locale: "lt_LT", title: "lt_LT"},
        {locale: "ru_RU", title: "ru_RU"},
        {locale: "de_DE", title: "de_DE"}
    ];
}

Locale.prototype.constructor = Locale;

Locale.prototype.disable = function(){
    $("[data-au-locale]").cmsInnLocale({
        destroy: true,
        storage: this.storage,
        ui: this.ui
    });
}

Locale.prototype.enable = function(){
    $("[data-au-locale]").cmsInnLocale({
        storage: this.storage,
        ui: this.ui
    });
}

Locale.prototype.config = function(options){
    if('locales' in options){
        var self = this;
        _.each(options.locales, function(locale){
            if(_.where(self.allLanguages, locale).length == 0){
                self.allLanguages.push(locale);
            }
        });
    }
}

Locale.prototype.get = function(id){
    var result = this.storage.collection.findOne({_id:id});
    if(result){
        // return result.draft['locale'];
        // changed to work with versioning
        return result['locale'];
    }
}

Locale.prototype.bindLanguage = function(locale, id){
    var result = this.storage.collection.findOne({_id:id});
    if(result){
        this.storage.update(
            {_id: id},
            {$set : {locale : locale}}
        );
    } else {
        this.storage.insert({
            _id: id,
            locale: locale
        });
    }
}

CmsInnLocale = new Locale();


/**
 * jQuery plugin
 */
function LocalePlugin(element, options){
    this.$element = $(element);
    this.settings = $.extend({

    }, options);

    if('storage' in this.settings){
        this.storage = this.settings.storage;
    }

    if(('ui' in this.settings) && typeof this.settings.ui === 'object'){
        this.ui = this.settings.ui;
    }

    if('destroy' in options && options['destroy']){
        this.destroy();
    } else {
        this.init();
    }
}

LocalePlugin.prototype.destroy = function(){
    this.ui.destroy();
    this.$element.removeClass('au-mark');
    this.$element.poshytip('destroy');
    this.$element.off('click');
}

LocalePlugin.prototype.init = function(){
    var self = this;
    this.$element.addClass('au-mark');

    this.$element.on('click', function(){
        // Destroy other poshytips
        $("[data-au-locale]").each(function(){
            if(this != self.$element){
                $(this).poshytip('destroy');
            }
        });

        var referenceToValue = $(this).attr('data-au-locale');

        $(this).poshytip({
            className: 'au-popover-tip',
            showOn: 'none',
            alignTo: 'target',
            alignX: 'center',
            keepInViewport: true,
            fade: true,
            slide: true,
            content : self.ui.render(referenceToValue, CmsInnLocale.allLanguages, self.storage, self.$element)
        });

        $(this).poshytip('show');
    });
}

if(Meteor.isClient){
    (function($) {
        $.fn.cmsInnLocale = function(options) {
            return this.each(function() {
                $.data(this, 'cmsInnLocale', new LocalePlugin(this, options));
            });
        };
    }(jQuery));

    if(UI) {
        UI.registerHelper('lang', function(id) {
            return CmsInnLocale.get(id);
        });
    }
}