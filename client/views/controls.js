// function rotate(direction){
//     if(direction == 'back'){
//         $('#cmsinn-container').removeClass('rotate-90');
//         $('.control').removeClass('rotate90');
//     } else {
//         $('#cmsinn-container').addClass('rotate-90');
//         $('.control').addClass('rotate90');
//     }
// }

// function scale(action){
//     if(action == 'down'){
//         $('#cmsinn-container').addClass('scale-down');
//     } else {
//         $('#cmsinn-container').removeClass('scale-down');
//     }
// }

// var scroller = function(){
//     var scrollToTop = $(window).scrollTop();
//     var elementHeight = $('#cmsinn-container').height();
//     var topPosition = $('.drager').position().top;
//     var elementsBottom = elementHeight + $('.drager').position().top;
//     var bottomOfScreen = scrollToTop + $(window).height();

//     if($(window).height() < $('#cmsinn-container').height()){
//         scale('down');
//     } else {
//         scale('up');
//     }

//     var top = null;
//     if(scrollToTop > topPosition){
//         top = scrollToTop;
//         if($('#cmsinn-container').hasClass('scale-down')){
//             top = bottomOfScreen - elementHeight;
//         }
//     }

//     if(elementsBottom > bottomOfScreen){
//         top = bottomOfScreen - elementHeight;
//     }
//     if(top != null){
//         $('.drager').css({top:top+'px'});
//     }
// };

Template.cmsinn_controls.events({
    currentPlugin: false,
    'click .js-plugin': function(e,tmpl){
        e.preventDefault();
        var el, plugin;
        el = $(e.currentTarget);
        plugin = el.data('plugin');
        $('.js-plugin').removeClass('current');

        if(plugin == 'disable' || plugin == this.currentPlugin){
            this.currentPlugin = false;
            CmsInn.disable();
        } else if(plugin != this.currentPlugin){
            el.addClass('current');
            CmsInn.toggle(plugin);
            this.currentPlugin = plugin;
        }
    }
});

Template['cmsinn_controls'].destroyed = function(){                                                                    // 69
    $('html').removeClass('au-is-active');                                                                               // 70
    // $('.drager').draggable({cursor: "move", opacity: 0.35, zIndex: 9999});                                         // 71
    // $(window).scroll(scroller)                                                                                     // 72
    // $(window).resize(scroller);                                                                                    // 73
};

Template['cmsinn_controls'].rendered = function(){
    $('html').addClass('au-is-active');
    // $('.drager').draggable({cursor: "move", opacity: 0.35, zIndex: 9999});
    // $(window).scroll(scroller)
    // $(window).resize(scroller);
};

Meteor.startup(function(){
    $('body').on('click', '[data-au-locale]', function(event){
        CmsInn.plugins.label.setLocale($(event.currentTarget).attr('data-au-locale'));
    });

    $('body').on('click', '[data-au-filter]', function(event){
        CmsInn.plugins.record.setFilter($(event.currentTarget).attr('data-au-filter'));
    });
});