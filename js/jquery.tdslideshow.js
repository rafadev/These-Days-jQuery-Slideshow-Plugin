/**
 * These Days jQuery Slideshow Plugin v1.0.2
 * @link http://playground.thesedays.com/tdslideshow/
 * @author Keegan Street
 */
(function ($) {

    var init, gotoSlide, stop, start, doTransition, publicMethods;

    // If you have already included Modernizr with a test for CSS Transitions and background-size, you can delete this line
    var Modernizr=function(a,b,c){function A(a,b){var c=a.charAt(0).toUpperCase()+a.substr(1),d=(a+" "+n.join(c+" ")+c).split(" ");return z(d,b)}function z(a,b){for(var d in a)if(k[a[d]]!==c)return b=="pfx"?a[d]:!0;return!1}function y(a,b){return!!~(""+a).indexOf(b)}function x(a,b){return typeof a===b}function w(a,b){return v(prefixes.join(a+";")+(b||""))}function v(a){k.cssText=a}var d="2.0.6",e={},f=!0,g=b.documentElement,h=b.head||b.getElementsByTagName("head")[0],i="modernizr",j=b.createElement(i),k=j.style,l,m=Object.prototype.toString,n="Webkit Moz O ms Khtml".split(" "),o={},p={},q={},r=[],s,t={}.hasOwnProperty,u;!x(t,c)&&!x(t.call,c)?u=function(a,b){return t.call(a,b)}:u=function(a,b){return b in a&&x(a.constructor.prototype[b],c)},o.backgroundsize=function(){return A("backgroundSize")},o.csstransitions=function(){return A("transitionProperty")};for(var B in o)u(o,B)&&(s=B.toLowerCase(),e[s]=o[B](),r.push((e[s]?"":"no-")+s));v(""),j=l=null,e._version=d,e._domPrefixes=n,e.testProp=function(a){return z([a])},e.testAllProps=A,g.className=g.className.replace(/\bno-js\b/,"")+(f?" js "+r.join(" "):"");return e}(this,this.document);
    
    // Initialise plugin
    init = function (options) {
        var defaults = {
            timeout: 5000,
            speed: 2000,
            fastSpeed: 100,
            beforeTransition: null,
            currentClass: 'current',
            fullscreen: false,
            shuffle: false
        };
        return this.each(function () {         
            var $el = $(this), data = $el.data('tdslideshow');
            if (!data) {
                data = {};
                data.stopped = false;
                data.options = $.extend(defaults, options);

                // Go fullscreen?
                if (data.options.fullscreen){
                    $el.css({width: '100%', height: '100%', position: 'fixed', top: '0', left: '0'});
                    if ($.browser.msie && parseInt($.browser.version, 10) == 6) {
                        $el.css({position: 'absolute'});
                    }
                }
                
                // Do necessary tweaks for fullscreen
                if(data.options.fullscreen){
                    if(Modernizr.backgroundsize && Modernizr.csstransitions){
                        $el.children().each(function(){
                            // Replace the image with a span
                            // but save the image in the span's data
                            // to use the imagesloaded callback, and then
                            // place the image as the span's background

                            var newspan = $('<span>').css({
                                display: 'block', 
                                width: '100%', 
                                height: '100%',
                                'background-size': 'cover',
                                position: 'absolute',
                                top: '0',
                                left: '0',
                                'background-position': '50% 50%',
                                opacity: '0'
                            }).addClass('not-loaded').data('image', $(this).detach()).appendTo($el);
                        });
                        data.$children = $el.children();
                    } else {
                        // Fix to remove vertical scrollbar on IE7
                        $('html').css({overflow: 'auto'});
                        
                        $el.css({overflow: 'hidden'});
                        
                        // Set images for lazy loading
                        $el.children().addClass('not-loaded').css({
                            position: 'absolute',
                            left: '50%',
                            top: '50%'
                        });            
                    }
                }
                
                // Shuffle?
                if (data.options.shuffle){
                    var objects = [];
                    $el.children().each(function(){
                        objects.push($(this).css({'display': 'none'}).detach());
                    });
                    for(var j, x, i = objects.length; i; j = parseInt(Math.random() * i), x = objects[--i], objects[i] = objects[j], objects[j] = x);
                    
                    // Insert the images back in the DOM
                    $(objects).each(function(){$(this).appendTo($el).show();});
                }
                
                data.$children = $el.children();
                data.currentIndex = 0;
                data.$current = data.$children.eq(0).addClass(data.options.currentClass).addClass('display-now');

                // Attach the plugin data to the element
                $el.data('tdslideshow', data);
                
                if(!Modernizr.backgroundsize || !Modernizr.csstransitions){
                    // Resize active image when window is resized,
                    // all inactive images will be resized before displaying
                    // so as no to trigger a resize for each image when the
                    // window.resized() event is triggered
                    $(window).resize(function(){
                        data.$children.each(function(){
                           resizeImage($(this)); 
                        });
                    });
                }                
                
                loadImage($el, data.$children.eq(0));
            }
        });
    };

    // Stop the slideshow
    stop = function () {
        return this.each(function () {
            var $el = $(this), data = $el.data('tdslideshow');
            if (!data || !data.timeoutId) {
                return;
            }
            data.stopped = true;
            clearTimeout(data.timeoutId);
            $el.data('tdslideshow', data);
        });
    };

    // Restart the slideshow
    start = function () {
        return this.each(function () {
            var $el = $(this), data = $el.data('tdslideshow');
            if (!data || !data.stopped) {
                return;
            }
            data.stopped = false;
            data.timeoutId = setTimeout(function () {
                doTransition($el);
            }, data.options.timeout);
            $el.data('tdslideshow', data);
        });
    };

    resizeImage = function(image) {
        var imgwidth = image.width(), 
            imgheight = image.height(),
            winwidth = $(window).width(),
            winheight = $(window).height(),
            widthratio = winwidth / imgwidth,
            heightratio = winheight / imgheight,
            widthdiff = heightratio * imgwidth,
            heightdiff = widthratio * imgheight;
 
        if(heightdiff>winheight) {
            image.css({
                width: winwidth+'px',
                height: heightdiff+'px',
                'margin-left': '-'+winwidth/2+'px', 
                'margin-top': '-'+heightdiff/2+'px'
            });
        } else {
            image.css({
                width: widthdiff+'px',
                height: winheight+'px',
                'margin-left': '-'+widthdiff/2+'px', 
                'margin-top': '-'+winheight/2+'px'
            });
        }
    }
    
    loadImage = function($el, $image){
        var data = $el.data('tdslideshow');
        var $targetImage;

        if($image[0].tagName.toLowerCase() == 'span'){
            $targetImage = $image.data('image');
        } else {
            $targetImage = $image;
        }
        
        $targetImage.css({opacity: 0}).attr('src', $targetImage.attr('data-src'));
        
        $image.removeClass('not-loaded').addClass('loading');
        
        $targetImage.data('load-watcher', $targetImage.imagesLoaded().done(function(){
            if($image[0].tagName.toLowerCase() == 'span') {
                $image.css({'background-image': "url('"+$targetImage.attr('src')+"')"});
            } else {
                resizeImage($image);
            }
            // Start loading next image
            if($image.index() < data.$children.length - 1){
                if(data.$children.eq($image.index() + 1).hasClass('not-loaded')){
                   loadImage($el, data.$children.eq($image.index() + 1));
                }
            }

            var displayNow = $image.hasClass('display-now');
            $image.removeClass('loading').addClass('loaded');
            
            $el.data('tdslideshow', data);
            if(displayNow){
                displayNext($el, $image.index());
            }
        }));
    }
    
    displayNext = function($el, nextIndex){
        var data = $el.data('tdslideshow');
        
        // Get next item
        if (typeof nextIndex === 'number') {
            data.currentIndex = nextIndex;
        } else {
            data.currentIndex = data.$current.index() + 1;
        }
      
        if (data.currentIndex >= data.$children.length) {
            data.currentIndex = 0;
        }
        $next = data.$children.eq(data.currentIndex);

        clearTimeout(data.timeoutId);

        if($next.hasClass('loaded')){
            // Show Image
            // Call optional callback before doing the animation
            if (typeof data.options.beforeTransition === 'function') {
                data.options.beforeTransition.apply(this, [data.currentIndex]);
            }
            
            data.$current.removeClass(data.options.currentClass);
            $next.addClass(data.options.currentClass).removeClass('display-now');

            data.$current.css({'z-index': 0});
            $next.css({'z-index': 100});

            if (Modernizr.backgroundresize && Modernizr.csstransitions) { // Use CSS transitions if available
                $next.bind('transitionend oTransitionEnd webkitTransitionEnd', function () {
                    $next.unbind('transitionend oTransitionEnd webkitTransitionEnd');
                    animationComplete();
                });

                $next.css({opacity: 1});
            } else {
                $next.css({opacity: 0, display: 'block'}).animate({opacity: 1}, data.options.speed, function () {
                    animationComplete();
                });
            }
    
            // Callback for animation completion
            animationComplete = function () {
                if(data.$current.index() != $next.index()){
                    if (Modernizr.backgroundsize && Modernizr.csstransitions) {
                        data.$current.css({'opacity': 0});
                    } else {
                        data.$current.hide();
                    }
                    data.$current = $next;
                }
                
                if (data.stopped) {
                    delete data.timeoutId;
                } else {
                    data.timeoutId = setTimeout(function () {
                        displayNext($el);
                    }, data.options.timeout);
                }

                $el.data('tdslideshow', data);
            };

        } else {
            // Mark as display now and wait til the load callback triggers
            $next.addClass('display-now');
            return;
        }
        
        $el.data('tdslideshow', data);
    }

    publicMethods = {
        init: init,
        gotoSlide: gotoSlide,
        stop: stop,
        start: start
    };

    $.fn.tdslideshow = function (method) {
        if (publicMethods[method]) {
            return publicMethods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return publicMethods.init.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' does not exist on jQuery.tdslideshow');
        }
    };

})(jQuery);

