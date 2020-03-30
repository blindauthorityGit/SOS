'use strict';
/**
 * Copyright Marc J. Schmidt. See the LICENSE file at the top-level
 * directory of this distribution and at
 * https://github.com/marcj/css-element-queries/blob/master/LICENSE.
 */
(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define(factory);
    } else if (typeof exports === "object") {
        module.exports = factory();
    } else {
        root.ResizeSensor = factory();
    }
}(typeof window !== 'undefined' ? window : this, function () {

    // Make sure it does not throw in a SSR (Server Side Rendering) situation
    if (typeof window === "undefined") {
        return null;
    }
    // Only used for the dirty checking, so the event callback count is limited to max 1 call per fps per sensor.
    // In combination with the event based resize sensor this saves cpu time, because the sensor is too fast and
    // would generate too many unnecessary events.
    var requestAnimationFrame = window.requestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        function (fn) {
            return window.setTimeout(fn, 20);
        };

    /**
     * Iterate over each of the provided element(s).
     *
     * @param {HTMLElement|HTMLElement[]} elements
     * @param {Function}                  callback
     */
    function forEachElement(elements, callback){
        var elementsType = Object.prototype.toString.call(elements);
        var isCollectionTyped = ('[object Array]' === elementsType
            || ('[object NodeList]' === elementsType)
            || ('[object HTMLCollection]' === elementsType)
            || ('[object Object]' === elementsType)
            || ('undefined' !== typeof jQuery && elements instanceof jQuery) //jquery
            || ('undefined' !== typeof Elements && elements instanceof Elements) //mootools
        );
        var i = 0, j = elements.length;
        if (isCollectionTyped) {
            for (; i < j; i++) {
                callback(elements[i]);
            }
        } else {
            callback(elements);
        }
    }

    /**
    * Get element size
    * @param {HTMLElement} element
    * @returns {Object} {width, height}
    */
    function getElementSize(element) {
        if (!element.getBoundingClientRect) {
            return {
                width: element.offsetWidth,
                height: element.offsetHeight
            }
        }

        var rect = element.getBoundingClientRect();
        return {
            width: Math.round(rect.width),
            height: Math.round(rect.height)
        }
    }

    /**
     * Class for dimension change detection.
     *
     * @param {Element|Element[]|Elements|jQuery} element
     * @param {Function} callback
     *
     * @constructor
     */
    var ResizeSensor = function(element, callback) {
        /**
         *
         * @constructor
         */
        function EventQueue() {
            var q = [];
            this.add = function(ev) {
                q.push(ev);
            };

            var i, j;
            this.call = function() {
                for (i = 0, j = q.length; i < j; i++) {
                    q[i].call();
                }
            };

            this.remove = function(ev) {
                var newQueue = [];
                for(i = 0, j = q.length; i < j; i++) {
                    if(q[i] !== ev) newQueue.push(q[i]);
                }
                q = newQueue;
            };

            this.length = function() {
                return q.length;
            }
        }

        /**
         *
         * @param {HTMLElement} element
         * @param {Function}    resized
         */
        function attachResizeEvent(element, resized) {
            if (!element) return;
            if (element.resizedAttached) {
                element.resizedAttached.add(resized);
                return;
            }

            element.resizedAttached = new EventQueue();
            element.resizedAttached.add(resized);

            element.resizeSensor = document.createElement('div');
            element.resizeSensor.dir = 'ltr';
            element.resizeSensor.className = 'resize-sensor';
            var style = 'position: absolute; left: -10px; top: -10px; right: 0; bottom: 0; overflow: hidden; z-index: -1; visibility: hidden;';
            var styleChild = 'position: absolute; left: 0; top: 0; transition: 0s;';

            element.resizeSensor.style.cssText = style;
            element.resizeSensor.innerHTML =
                '<div class="resize-sensor-expand" style="' + style + '">' +
                    '<div style="' + styleChild + '"></div>' +
                '</div>' +
                '<div class="resize-sensor-shrink" style="' + style + '">' +
                    '<div style="' + styleChild + ' width: 200%; height: 200%"></div>' +
                '</div>';
            element.appendChild(element.resizeSensor);

            var position = window.getComputedStyle(element).getPropertyPriority('position');
            if ('absolute' !== position && 'relative' !== position && 'fixed' !== position) {
                element.style.position = 'relative';
            }

            var expand = element.resizeSensor.childNodes[0];
            var expandChild = expand.childNodes[0];
            var shrink = element.resizeSensor.childNodes[1];
            var dirty, rafId, newWidth, newHeight;
            var size = getElementSize(element);
            var lastWidth = size.width;
            var lastHeight = size.height;

            var reset = function() {
                //set display to block, necessary otherwise hidden elements won't ever work
                var invisible = element.offsetWidth === 0 && element.offsetHeight === 0;

                if (invisible) {
                    var saveDisplay = element.style.display;
                    element.style.display = 'block';
                }

                expandChild.style.width = '100000px';
                expandChild.style.height = '100000px';

                expand.scrollLeft = 100000;
                expand.scrollTop = 100000;

                shrink.scrollLeft = 100000;
                shrink.scrollTop = 100000;

                if (invisible) {
                    element.style.display = saveDisplay;
                }
            };
            element.resizeSensor.resetSensor = reset;

            var onResized = function() {
                rafId = 0;

                if (!dirty) return;

                lastWidth = newWidth;
                lastHeight = newHeight;

                if (element.resizedAttached) {
                    element.resizedAttached.call();
                }
            };

            var onScroll = function() {
                var size = getElementSize(element);
                var newWidth = size.width;
                var newHeight = size.height;
                dirty = newWidth != lastWidth || newHeight != lastHeight;

                if (dirty && !rafId) {
                    rafId = requestAnimationFrame(onResized);
                }

                reset();
            };

            var addEvent = function(el, name, cb) {
                if (el.attachEvent) {
                    el.attachEvent('on' + name, cb);
                } else {
                    el.addEventListener(name, cb);
                }
            };

            addEvent(expand, 'scroll', onScroll);
            addEvent(shrink, 'scroll', onScroll);

			// Fix for custom Elements
			requestAnimationFrame(reset);
        }

        forEachElement(element, function(elem){
            attachResizeEvent(elem, callback);
        });

        this.detach = function(ev) {
            ResizeSensor.detach(element, ev);
        };

        this.reset = function() {
            element.resizeSensor.resetSensor();
        };
    };

    ResizeSensor.reset = function(element, ev) {
        forEachElement(element, function(elem){
            elem.resizeSensor.resetSensor();
        });
    };

    ResizeSensor.detach = function(element, ev) {
        forEachElement(element, function(elem){
            if (!elem) return;
            if(elem.resizedAttached && typeof ev === "function"){
                elem.resizedAttached.remove(ev);
                if(elem.resizedAttached.length()) return;
            }
            if (elem.resizeSensor) {
                if (elem.contains(elem.resizeSensor)) {
                    elem.removeChild(elem.resizeSensor);
                }
                delete elem.resizeSensor;
                delete elem.resizedAttached;
            }
        });
    };

    return ResizeSensor;

}));

(function($) {
  'use strict';

  if (!$.isEmptyObject(window.MK)) {return}

  var MK = window.MK || {};
  window.MK = MK;
  MK.utils = window.MK.utils || {};

    /**
     * Gets user browser and its version
     * @return {Object} => {name, version}
     */
	MK.utils.browser = (function() {
        var dataBrowser = [
            {string: navigator.userAgent, subString: "Edge", identity: "Edge"},
            {string: navigator.userAgent, subString: "Chrome", identity: "Chrome"},
            {string: navigator.userAgent, subString: "MSIE", identity: "IE"},
            {string: navigator.userAgent, subString: "Trident", identity: "IE"},
            {string: navigator.userAgent, subString: "Firefox", identity: "Firefox"},
            {string: navigator.userAgent, subString: "Safari", identity: "Safari"},
            {string: navigator.userAgent, subString: "Opera", identity: "Opera"}
        ];

		var versionSearchString = null;
        var searchString = function (data) {
            for (var i = 0; i < data.length; i++) {
                var dataString = data[i].string;
                versionSearchString = data[i].subString;

                if (dataString.indexOf(data[i].subString) !== -1) {
                    return data[i].identity;
                }
            }
        };

        var searchVersion = function (dataString) {
            var index = dataString.indexOf(versionSearchString);
            if (index === -1) {
                return;
            }

            var rv = dataString.indexOf("rv:");
            if (versionSearchString === "Trident" && rv !== -1) {
                return parseFloat(dataString.substring(rv + 3));
            } else {
                return parseFloat(dataString.substring(index + versionSearchString.length + 1));
            }
        };

        var name = searchString(dataBrowser) || "Other";
        var version = searchVersion(navigator.userAgent) || searchVersion(navigator.appVersion) || "Unknown";

        // Expose for css
        $('html').addClass(name).addClass(name + version);


        return {
        	name : name,
        	version : version
        };

	})();

    /**
     * Gets user operating system
     * @return {String}
     */
	MK.utils.OS = (function() {
		if (navigator.appVersion.indexOf("Win")!=-1) return "Windows";
		if (navigator.appVersion.indexOf("Mac")!=-1) return "OSX";
		if (navigator.appVersion.indexOf("X11")!=-1) return "UNIX";
		if (navigator.appVersion.indexOf("Linux")!=-1) return "Linux";
	})();

    /**
     * Check if mobile device.
     * @return {Boolean}
     */
	MK.utils.isMobile = function() {
        // Problems with bigger tablets as users raport differences with behaviour. Switch to navigator sniffing
		// return ('ontouchstart' in document.documentElement) && matchMedia( '(max-width: 1024px)' ).matches;

        // http://www.abeautifulsite.net/detecting-mobile-devices-with-javascript/
        // if it still brings problem try to move to more sophisticated solution like
        // apachemobilefilter.org
        // detectright.com
        // web.wurfl.io
        //
        // Seems as best solution here:
        // hgoebl.github.io/mobile-detect.js

        function android() {
            return navigator.userAgent.match(/Android/i);
        }

        function blackBerry() {
            return navigator.userAgent.match(/BlackBerry/i);
        }

        function iOS() {
            return navigator.userAgent.match(/iPhone|iPad|iPod/i);
        }

        function opera() {
            return navigator.userAgent.match(/Opera Mini/i);
        }

        function windows() {
            return navigator.userAgent.match(/IEMobile/i);
        }

        return (android() || blackBerry() || iOS() || opera() || windows() || matchMedia( '(max-width: 1024px)' ).matches);

	};

    /**
     * Check if menu is switched to responsive state based on user width settings
     * @return {Boolean}
     */
    MK.utils.isResponsiveMenuState = function() {
        return window.matchMedia( '(max-width: '+ mk_responsive_nav_width +'px)').matches;
    };



    MK.utils.getUrlParameter = function getUrlParameter(sParam) {
        var sPageURL = decodeURIComponent(window.location.search.substring(1)),
            sURLVariables = sPageURL.split('&'),
            sParameterName,
            i;

        for (i = 0; i < sURLVariables.length; i++) {
            sParameterName = sURLVariables[i].split('=');

            if (sParameterName[0] === sParam) {
                return sParameterName[1] === undefined ? true : sParameterName[1];
            }
        }
    };

    MK.utils.throttle = function( delay, fn ) {
      var last;
      var deferTimer;

      return function() {
          var context = this;
          var args = arguments;
          var now = +new Date;
          if( last && now < last + delay ) {
            clearTimeout( deferTimer );
            deferTimer = setTimeout( function() {
              last = now; fn.apply( context, args );
            }, delay );
          } else {
            last = now;
            fn.apply( context, args );
          }
      };
    };

    /**
	 * This should be invoked only on page load.
	 * Scrolls to anchor from  address bar
	 */
	MK.utils.scrollToURLHash = function() {
		var loc = window.location,
			hash = loc.hash;

		if ( hash.length && hash.substring(1).length ) {
			// !loading is added early after DOM is ready to prevent native jump to anchor
			hash = hash.replace( '!loading', '' );

			// Wait for one second before animating
			// Most of UI animations should be done by then and async operations complited
			setTimeout( function() {
				MK.utils.scrollToAnchor( hash );
			}, 1000 );

			// Right after reset back address bar
			setTimeout( function() {
				window.history.replaceState(undefined, undefined, hash);
			}, 1001);
		}
  };

  	/**
	 * Controls native scroll behaviour
	 * @return {Object} => {disable, enable}
	 */
	MK.utils.scroll = (function() {
    // 37 - left arror, 38 - up arrow, 39 right arrow, 40 down arrow
  var keys = [38, 40];

    function preventDefault(e) {
      e = e || window.event;
      e.preventDefault();
      e.returnValue = false;
    }

    function wheel(e) {
      preventDefault(e);
    }

    function keydown(e) {
        for (var i = keys.length; i--;) {
            if (e.keyCode === keys[i]) {
                preventDefault(e);
                return;
            }
        }
    }

    function disableScroll() {
        if (window.addEventListener) {
            window.addEventListener('DOMMouseScroll', wheel, false);
        }
        window.onmousewheel = document.onmousewheel = wheel;
        document.onkeydown = keydown;
    }

    function enableScroll() {
        if (window.removeEventListener) {
            window.removeEventListener('DOMMouseScroll', wheel, false);
        }
        window.onmousewheel = document.onmousewheel = document.onkeydown = null;
    }

    return {
      disable : disableScroll,
      enable  : enableScroll
    };

})();

MK.utils.launchIntoFullscreen = function ( element ) {
  if(element.requestFullscreen) {
     element.requestFullscreen();
  } else if(element.mozRequestFullScreen) {
    element.mozRequestFullScreen();
  } else if(element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen();
  } else if(element.msRequestFullscreen) {
    element.msRequestFullscreen();
  }
};

MK.utils.exitFullscreen = function () {
  if(document.exitFullscreen) {
    document.exitFullscreen();
  } else if(document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
  } else if(document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  }
};

    /**
	 * Scroll Spy implementation. Spy dynamic offsets of elements or static pixel offset
	 * @param  {Number|Element}
	 * @param  {Object} => callback object {before, active, after}
	 */
	MK.utils.scrollSpy = function( toSpy, config ) {
		var $window   = $( window ),
	        container = $('.jupiterx-site')[0],
	        isObj     = ( typeof toSpy === 'object' ),
	        offset    = (isObj) ? MK.val.dynamicOffset( toSpy, config.position, config.threshold ) : function() { return toSpy; },
	        height    = (isObj) ? MK.val.dynamicHeight( toSpy ) : function() { return 0; },
	        cacheVals = {},
	        _p 		  = 'before'; // current position

		var checkPosition = function() {
	    	var s = MK.val.scroll(),
	    		o = offset(),
	    		h = height();

	        if( s < o && _p !== 'before' ) {
	        	// console.log( toSpy, 'before' );
	        	if( config.before ) config.before();
	        	_p = 'before';
	        }
	        else if( s >= o && s <= o + h && _p !== 'active' ) {
	        	// console.log( toSpy, 'active' );
	        	if( config.active ) config.active( o );
	        	_p = 'active';
	        }
	        else if( s > o + h && _p !== 'after' ) {
	        	// console.log( toSpy, 'after' );
	        	if( config.after) config.after( o + h );
	        	_p = 'after';
	        }
		};

		var rAF = function() {
			window.requestAnimationFrame( checkPosition );
		};

		var exportVals = function() {
			return cacheVals;
		};

		var updateCache = function() {
	    	var o = offset(),
	    		h = height();

	        cacheVals = {
	        	before : o - $window.height(),
	        	active : o,
	        	after : o + h
	        };
		};

		if( config.cache ) {
			config.cache( exportVals );
		}

	    checkPosition();
	    $window.on( 'load', checkPosition );
	    $window.on( 'resize', checkPosition );
	    $window.on( 'mouseup', checkPosition );
   		window.addResizeListener( container, checkPosition );

	    $window.on( 'scroll', rAF );

   		updateCache();
	    $window.on( 'load', updateCache );
	    $window.on( 'resize', updateCache );
   		window.addResizeListener( container, updateCache );
  };

  /**
   * Scrolls page to static pixel offset
   * @param  {Number}
   */
  MK.utils.scrollTo = function( offset ) {
    $('html, body').stop().animate({
      scrollTop: offset
    }, {
      duration: 1200,
    });
  };

  MK.utils.isElementInViewport = function( el ) {
    var elemTop = el.getBoundingClientRect().top;
  var isVisible = (elemTop < window.innerHeight);
  return isVisible;
};

	/**
	 * Scrolls to element passed in as object or DOM reference
	 * @param  {String|Object}
	 */
	MK.utils.scrollToAnchor = function( hash ) {
		// Escape meta-chars from hash name only.
		hash = hash.substring(1).replace(/[!"#$%&'()*+,./:;<=>?@[\]^`{|}~]/g, "\\$&");
		hash = "#" + hash;
		var $target = $( hash );
		// console.log( hash );

		if( ! $target.length ) return;

		var offset  = $target.offset().top;
		offset = offset - MK.val.offsetHeaderHeight( offset );

		if( hash === '#top-of-page' ) window.history.replaceState( undefined, undefined, ' ' );
		else window.history.replaceState( undefined, undefined, hash );

		MK.utils.scrollTo( offset );
	};

  /**
	 * Basic implementation of pub / sub pattern to avoid tight coupling with direct module communication
	 * @type {Object}
	 */
	MK.utils.eventManager = {};

	/**
	 * Subscribe to custom event and run callbacks
	 * @param  {String}
	 * @param  {Function}
	 *
	 * @usage MK.utils.eventManager.subscribe('event', function(e, params) {} )
	 */
	MK.utils.eventManager.subscribe = function(evt, func) {
		$(this).on(evt, func);
	};

	/**
	 * Unsubscribe from custom event
	 * @param  {String}
	 * @param  {Function}
	 */
	MK.utils.eventManager.unsubscribe = function(evt, func) {
		$(this).off(evt, func);
	};

	/**
	 * Publish custom event to notify appliaction about state change
	 * @param  {String}
	 *
	 * @usage MK.utils.eventManager.publish('event', {
	 *        	param: val
	 *        })
	 */
	MK.utils.eventManager.publish = function(evt, params) {
		$(this).trigger(evt, [params]);
  };

  /**
	 * Get all top offsets from jQuery collection
	 *
	 * @param  {$Objects}
	 * @return {Aray}
	 */
	MK.utils.offsets = function( $els ) {
		return $.map( $els, function( el ) {
			return $( el ).offset().top;
		});
  };

  /**
	 * Retrive from array of numbers first number that is higher than given parameter
	 *
	 * @param  {Number}
	 * @param  {Array}
	 * @return {Number}
	 */
	MK.utils.nextHigherVal = function( val, arr ) {
		var i = 0,
			higher = null;

		var check = function() {
			if( val > arr[ i ]) {
				i += 1;
				check();
			} else {
				higher = arr[ i ];
			}
		};
		check();

		return higher;
	};

}(jQuery));

(function($) {
	'use strict';

	var MK = window.MK || {};

	/**
	 * MK.core holds most important methods that bootstraps whole application
	 *
	 * @type {Object}
	 */
	MK.core = {};

	/**
	 * State for referance of already loaded script files
	 * @type {Array}
	 */
	var _loadedDependencies = [];

	/**
	 * State of queue represented as pairs of script ref => callback
	 * @type {Object}
	 */
	var _inQueue = {};

	/**
	 * Initializes all components in given scope (object or DOM reference) based on data attribute and 'pointer' css class '.js-el'.
	 * DOM work is reduced by single traversing for pointer class and later filtering through cached object. It expects init() method
	 * on every component. Component itself should be defined in MK.component namespace and assign to DOM element via data-mk-component.
	 * Use it once on DOM ready with document as a scope. For partial initialization after ajax operations pass as a scope element
	 * where new DOM was inserted.
	 *
	 * @param  {string|object}
	 */
	MK.core.initAll = function( scope ) {
		var $el = $( scope ).find( '.js-el' ), // single traversing
			$components = $el.filter( '[data-mk-component]' ),
			component = null;


		// initialize  component
		var init = function init(name, el) {
			var $el = $(el);

			if ( $el.data('init-' + name) ) return; // do not initialize the same module twice

			if ( typeof MK.component[ name ] !== 'function' ) console.log('Component init error: ', name);
			else {
				component = new MK.component[ name ]( el );
				component.init();
				$el.data('init-' + name, true); // mark as initialised
				// TODO add name
				MK.utils.eventManager.publish('component-inited');
			}
		};

		$components.each( function() {
			var self = this,
				$this = $( this ),
				names = $this.data( 'mk-component' );

			if( typeof names === 'string' ) {
				var name = names; // containes only single name. Keep it transparent.
				init(name, self);
			} else {
				names.forEach( function( name ) {
					init(name, self);
				});
			}
		});
	};

	/**
	 * Async loader for 3rd party plugins available from within theme or external CDNs / APIs.
	 * Take one argument as callback which is run when loading is finished. Also keeps track of already loaded scripts
	 * and prevent duplication. Holds in queue multiple callbacks that where defined in different places but depend on the
	 * same plugin.
	 *
	 * TODO: heavy test for multiple dependencies and crosssharing one dependency and different one dependency in queue,
	 * bulletproof with single dependency
	 *
	 * @example MK.core.loadDependencies([MK.core.path.plugins + 'plugin.js'], function() {
	 *          	// do something when plugin is loaded
	 * 			})
	 *
	 * @param  {array}
	 * @param  {function}
	 */
	MK.core.loadDependencies = function( dependencies, callback ) {
		var _callback = callback || function() {};

        if( !dependencies ) {
        	// If no dependencies defined then run _callback imidietelly
        	_callback();
        	return;
        }

		// Check for new dependencies
        var newDeps = dependencies.map( function( dep ) {
            if( _loadedDependencies.indexOf( dep ) === -1 ) {
            	 if( typeof _inQueue[ dep ] === 'undefined' ) {
        			// console.log( dep );
                	return dep;
                } else {
                	_inQueue[ dep ].push( _callback );
                	return true;
                }
            } else {
            	return false;
            }
        });

        // The dependency is not new but it's not resolved yet
        // Callback is added to queue that will be run after the script is loaded
        // Don't run callback just yet.
        if( newDeps[0] === true ) {
        	// console.log('Waiting for ' + dependencies[0]);
        	return;
        }

        // Dependency was loaded previously. We can run callback safely
        if( newDeps[0] === false ) {
        	_callback();
        	return;
        }

        // Create queue and relationship script -> callback array to track
        // all callbacks that waits for ths script
        var queue = newDeps.map( function( script ) {
        	// console.log( script );
        	_inQueue[ script ] = [ _callback ];
            return $.getCachedScript( script );
        });

        // Callbacks invoking
        var onLoad = function onLoad() {
        	var index;
        	newDeps.map( function( loaded ) {
        		_inQueue[ loaded ].forEach( function( callback ) {
        			callback();
        		});
        		delete _inQueue[ loaded ];
                _loadedDependencies.push( loaded );
        	});
        };

        // Run callbacks when promise is resolved
        $.when.apply( null, queue ).done( onLoad );
	};

	/**
	 * Single namespace for all paths recuired in application.
	 * @type {Object}
	 */
	MK.core.path = {
		theme: jupiterDonutVars.themeUrl,
		plugins: jupiterDonutVars.assetsUrl + '/lib/js/',
		ajaxUrl: jupiterDonutVars.ajaxUrl
	};


})(jQuery);


(function($) {
  'use strict';

  /**
   * Entry point of application. Runs all components
   */
  $( window ).on( 'load', function() {
      MK.core.initAll( document );
      MK.utils.scrollToURLHash();
  });

  /**
   * VC frontend editor. Init all components.
   */
  $( window ).on( 'vc_reload', function() {
      setTimeout(function(){
          MK.core.initAll( document );
      }, 100);
  });

  /**
   * Assign global click handlers
   */
  $( document ).on( 'click', '.js-smooth-scroll, .js-main-nav a', smoothScrollToAnchor);
  $( '.side_dashboard_menu a' ).on( 'click', smoothScrollToAnchor);

  function smoothScrollToAnchor( evt ) {
      var anchor = MK.utils.detectAnchor( this );
      var $this = $(evt.currentTarget);
      var loc = window.location;
      var currentPage = loc.origin + loc.pathname;
      var href = $this.attr( 'href' );
      var linkSplit = (href) ? href.split( '#' ) : '';
      var hrefPage  = linkSplit[0] ? linkSplit[0] : '';
      var hrefHash  = linkSplit[1] ? linkSplit[1] : '';

      if( anchor.length ) {
          if(hrefPage === currentPage || hrefPage === '') evt.preventDefault();
          MK.utils.scrollToAnchor( anchor );

      } else if( $this.attr( 'href' ) === '#' ) {
          evt.preventDefault();
      }
  }

}(jQuery));

'use strict';

/**
 * Copyright Marc J. Schmidt. See the LICENSE file at the top-level
 * directory of this distribution and at
 * https://github.com/marcj/css-element-queries/blob/master/LICENSE.
 */
(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define(['./ResizeSensor.js'], factory);
    } else if (typeof exports === "object") {
        module.exports = factory(require('./ResizeSensor.js'));
    } else {
        root.ElementQueries = factory(root.ResizeSensor);
        root.ElementQueries.listen();
    }
}(typeof window !== 'undefined' ? window : this, function (ResizeSensor) {

    /**
     *
     * @type {Function}
     * @constructor
     */
    var ElementQueries = function () {
        //<style> element with our dynamically created styles
        var cssStyleElement;

        //all rules found for element queries
        var allQueries = {};

        //association map to identify which selector belongs to a element from the animationstart event.
        var idToSelectorMapping = [];

        /**
         *
         * @param element
         * @returns {Number}
         */
        function getEmSize(element) {
            if (!element) {
                element = document.documentElement;
            }
            var fontSize = window.getComputedStyle(element, null).fontSize;
            return parseFloat(fontSize) || 16;
        }

        /**
         * Get element size
         * @param {HTMLElement} element
         * @returns {Object} {width, height}
         */
        function getElementSize(element) {
            if (!element.getBoundingClientRect) {
                return {
                    width: element.offsetWidth,
                    height: element.offsetHeight
                }
            }

            var rect = element.getBoundingClientRect();
            return {
                width: Math.round(rect.width),
                height: Math.round(rect.height)
            }
        }

        /**
         *
         * @copyright https://github.com/Mr0grog/element-query/blob/master/LICENSE
         *
         * @param {HTMLElement} element
         * @param {*} value
         * @returns {*}
         */
        function convertToPx(element, value) {
            var numbers = value.split(/\d/);
            var units = numbers[numbers.length - 1];
            value = parseFloat(value);
            switch (units) {
                case "px":
                    return value;
                case "em":
                    return value * getEmSize(element);
                case "rem":
                    return value * getEmSize();
                // Viewport units!
                // According to http://quirksmode.org/mobile/tableViewport.html
                // documentElement.clientWidth/Height gets us the most reliable info
                case "vw":
                    return value * document.documentElement.clientWidth / 100;
                case "vh":
                    return value * document.documentElement.clientHeight / 100;
                case "vmin":
                case "vmax":
                    var vw = document.documentElement.clientWidth / 100;
                    var vh = document.documentElement.clientHeight / 100;
                    var chooser = Math[units === "vmin" ? "min" : "max"];
                    return value * chooser(vw, vh);
                default:
                    return value;
                // for now, not supporting physical units (since they are just a set number of px)
                // or ex/ch (getting accurate measurements is hard)
            }
        }

        /**
         *
         * @param {HTMLElement} element
         * @param {String} id
         * @constructor
         */
        function SetupInformation(element, id) {
            this.element = element;
            var key, option, elementSize, value, actualValue, attrValues, attrValue, attrName;

            var attributes = ['min-width', 'min-height', 'max-width', 'max-height'];

            /**
             * Extracts the computed width/height and sets to min/max- attribute.
             */
            this.call = function () {
                // extract current dimensions
                elementSize = getElementSize(this.element);

                attrValues = {};

                for (key in allQueries[id]) {
                    if (!allQueries[id].hasOwnProperty(key)) {
                        continue;
                    }
                    option = allQueries[id][key];

                    value = convertToPx(this.element, option.value);

                    actualValue = option.property === 'width' ? elementSize.width : elementSize.height;
                    attrName = option.mode + '-' + option.property;
                    attrValue = '';

                    if (option.mode === 'min' && actualValue >= value) {
                        attrValue += option.value;
                    }

                    if (option.mode === 'max' && actualValue <= value) {
                        attrValue += option.value;
                    }

                    if (!attrValues[attrName]) attrValues[attrName] = '';
                    if (attrValue && -1 === (' ' + attrValues[attrName] + ' ').indexOf(' ' + attrValue + ' ')) {
                        attrValues[attrName] += ' ' + attrValue;
                    }
                }

                for (var k in attributes) {
                    if (!attributes.hasOwnProperty(k)) continue;

                    if (attrValues[attributes[k]]) {
                        this.element.setAttribute(attributes[k], attrValues[attributes[k]].substr(1));
                    } else {
                        this.element.removeAttribute(attributes[k]);
                    }
                }
            };
        }

        /**
         * @param {HTMLElement} element
         * @param {Object}      id
         */
        function setupElement(element, id) {
            if (!element.elementQueriesSetupInformation) {
                element.elementQueriesSetupInformation = new SetupInformation(element, id);
            }
            if (!element.elementQueriesSensor) {
                element.elementQueriesSensor = new ResizeSensor(element, function () {
                    element.elementQueriesSetupInformation.call();
                });
            }

            element.elementQueriesSetupInformation.call();
        }

        /**
         * Stores rules to the selector that should be applied once resized.
         *
         * @param {String} selector
         * @param {String} mode min|max
         * @param {String} property width|height
         * @param {String} value
         */
        function queueQuery(selector, mode, property, value) {
            if (typeof(allQueries[selector]) === 'undefined') {
                allQueries[selector] = [];
                // add animation to trigger animationstart event, so we know exactly when a element appears in the DOM

                var id = idToSelectorMapping.length;
                cssStyleElement.innerHTML += '\n' + selector + ' {animation: 0.1s element-queries;}';
                cssStyleElement.innerHTML += '\n' + selector + ' > .resize-sensor {min-width: '+id+'px;}';
                idToSelectorMapping.push(selector);
            }

            allQueries[selector].push({
                mode: mode,
                property: property,
                value: value
            });
        }

        function getQuery(container) {
            var query;
            if (document.querySelectorAll) query = (container) ? container.querySelectorAll.bind(container) : document.querySelectorAll.bind(document);
            if (!query && 'undefined' !== typeof $$) query = $$;
            if (!query && 'undefined' !== typeof jQuery) query = jQuery;

            if (!query) {
                throw 'No document.querySelectorAll, jQuery or Mootools\'s $$ found.';
            }

            return query;
        }

        /**
         * If animationStart didn't catch a new element in the DOM, we can manually search for it
         */
        function findElementQueriesElements(container) {
            var query = getQuery(container);

            for (var selector in allQueries) if (allQueries.hasOwnProperty(mode)) {
                // find all elements based on the extract query selector from the element query rule
                var elements = query(selector, container);

                for (var i = 0, j = elements.length; i < j; i++) {
                    setupElement(elements[i], selector);
                }
            }
        }

        /**
         *
         * @param {HTMLElement} element
         */
        function attachResponsiveImage(element) {
            var children = [];
            var rules = [];
            var sources = [];
            var defaultImageId = 0;
            var lastActiveImage = -1;
            var loadedImages = [];

            for (var i in element.children) {
                if (!element.children.hasOwnProperty(i)) continue;

                if (element.children[i].tagName && element.children[i].tagName.toLowerCase() === 'img') {
                    children.push(element.children[i]);

                    var minWidth = element.children[i].getAttribute('min-width') || element.children[i].getAttribute('data-min-width');
                    //var minHeight = element.children[i].getAttribute('min-height') || element.children[i].getAttribute('data-min-height');
                    var src = element.children[i].getAttribute('data-src') || element.children[i].getAttribute('url');

                    sources.push(src);

                    var rule = {
                        minWidth: minWidth
                    };

                    rules.push(rule);

                    if (!minWidth) {
                        defaultImageId = children.length - 1;
                        element.children[i].style.display = 'block';
                    } else {
                        element.children[i].style.display = 'none';
                    }
                }
            }

            lastActiveImage = defaultImageId;

            function check() {
                var imageToDisplay = false, i;

                for (i in children) {
                    if (!children.hasOwnProperty(i)) continue;

                    if (rules[i].minWidth) {
                        if (element.offsetWidth > rules[i].minWidth) {
                            imageToDisplay = i;
                        }
                    }
                }

                if (!imageToDisplay) {
                    //no rule matched, show default
                    imageToDisplay = defaultImageId;
                }

                if (lastActiveImage !== imageToDisplay) {
                    //image change

                    if (!loadedImages[imageToDisplay]) {
                        //image has not been loaded yet, we need to load the image first in memory to prevent flash of
                        //no content

                        var image = new Image();
                        image.onload = function () {
                            children[imageToDisplay].src = sources[imageToDisplay];

                            children[lastActiveImage].style.display = 'none';
                            children[imageToDisplay].style.display = 'block';

                            loadedImages[imageToDisplay] = true;

                            lastActiveImage = imageToDisplay;
                        };

                        image.src = sources[imageToDisplay];
                    } else {
                        children[lastActiveImage].style.display = 'none';
                        children[imageToDisplay].style.display = 'block';
                        lastActiveImage = imageToDisplay;
                    }
                } else {
                    //make sure for initial check call the .src is set correctly
                    children[imageToDisplay].src = sources[imageToDisplay];
                }
            }

            element.resizeSensor = new ResizeSensor(element, check);
            check();
        }

        function findResponsiveImages() {
            var query = getQuery();

            var elements = query('[data-responsive-image],[responsive-image]');
            for (var i = 0, j = elements.length; i < j; i++) {
                attachResponsiveImage(elements[i]);
            }
        }

        var regex = /,?[\s\t]*([^,\n]*?)((?:\[[\s\t]*?(?:min|max)-(?:width|height)[\s\t]*?[~$\^]?=[\s\t]*?"[^"]*?"[\s\t]*?])+)([^,\n\s\{]*)/mgi;
        var attrRegex = /\[[\s\t]*?(min|max)-(width|height)[\s\t]*?[~$\^]?=[\s\t]*?"([^"]*?)"[\s\t]*?]/mgi;

        /**
         * @param {String} css
         */
        function extractQuery(css) {
            var match, smatch, attrs, attrMatch;

            css = css.replace(/'/g, '"');
            while (null !== (match = regex.exec(css))) {
                smatch = match[1] + match[3];
                attrs = match[2];

                while (null !== (attrMatch = attrRegex.exec(attrs))) {
                    queueQuery(smatch, attrMatch[1], attrMatch[2], attrMatch[3]);
                }
            }
        }

        /**
         * @param {CssRule[]|String} rules
         */
        function readRules(rules) {
            var selector = '';

            if (!rules) {
                return;
            }

            if ('string' === typeof rules) {
                rules = rules.toLowerCase();
                if (-1 !== rules.indexOf('min-width') || -1 !== rules.indexOf('max-width')) {
                    extractQuery(rules);
                }
            } else {
                for (var i = 0, j = rules.length; i < j; i++) {
                    if (1 === rules[i].type) {
                        selector = rules[i].selectorText || rules[i].cssText;
                        if (-1 !== selector.indexOf('min-height') || -1 !== selector.indexOf('max-height')) {
                            extractQuery(selector);
                        } else if (-1 !== selector.indexOf('min-width') || -1 !== selector.indexOf('max-width')) {
                            extractQuery(selector);
                        }
                    } else if (4 === rules[i].type) {
                        readRules(rules[i].cssRules || rules[i].rules);
                    } else if (3 === rules[i].type) {
                        readRules(rules[i].styleSheet.cssRules);
                    }
                }
            }
        }

        var defaultCssInjected = false;

        /**
         * Searches all css rules and setups the event listener to all elements with element query rules..
         */
        this.init = function () {
            var animationStart = 'animationstart';
            if (typeof document.documentElement.style['webkitAnimationName'] !== 'undefined') {
                animationStart = 'webkitAnimationStart';
            } else if (typeof document.documentElement.style['MozAnimationName'] !== 'undefined') {
                animationStart = 'mozanimationstart';
            } else if (typeof document.documentElement.style['OAnimationName'] !== 'undefined') {
                animationStart = 'oanimationstart';
            }

            document.body.addEventListener(animationStart, function (e) {
                var element = e.target;
                var styles = window.getComputedStyle(element, null);

                if (-1 !== styles.getPropertyValue('animation-name').indexOf('element-queries')) {
                    element.elementQueriesSensor = new ResizeSensor(element, function () {
                        if (element.elementQueriesSetupInformation) {
                            element.elementQueriesSetupInformation.call();
                        }
                    });

                    var sensorStyles = window.getComputedStyle(element.resizeSensor, null);
                    var id = sensorStyles.getPropertyValue('min-width');
                    id = parseInt(id.replace('px', ''));
                    setupElement(e.target, idToSelectorMapping[id]);
                }
            });

            if (!defaultCssInjected) {
                cssStyleElement = document.createElement('style');
                cssStyleElement.type = 'text/css';
                cssStyleElement.innerHTML = '[responsive-image] > img, [data-responsive-image] {overflow: hidden; padding: 0; } [responsive-image] > img, [data-responsive-image] > img {width: 100%;}';

                //safari wants at least one rule in keyframes to start working
                cssStyleElement.innerHTML += '\n@keyframes element-queries { 0% { visibility: inherit; } }';
                document.getElementsByTagName('head')[0].appendChild(cssStyleElement);
                defaultCssInjected = true;
            }

            for (var i = 0, j = document.styleSheets.length; i < j; i++) {
                try {
                    if (document.styleSheets[i].href && 0 === document.styleSheets[i].href.indexOf('file://')) {
                        console.log("CssElementQueries: unable to parse local css files, " + document.styleSheets[i].href);
                    }

                    readRules(document.styleSheets[i].cssRules || document.styleSheets[i].rules || document.styleSheets[i].cssText);
                } catch (e) {
                }
            }

            // findElementQueriesElements();
            findResponsiveImages();
        };

        /**
         * Go through all collected rules (readRules()) and attach the resize-listener.
         * Not necessary to call it manually, since we detect automatically when new elements
         * are available in the DOM. However, sometimes handy for dirty DOM modifications.
         *
         * @param {HTMLElement} container only elements of the container are considered (document.body if not set)
         */
        this.findElementQueriesElements = function (container) {
            findElementQueriesElements(container);
        };

        this.update = function () {
            this.init();
        };
    };

    ElementQueries.update = function () {
        ElementQueries.instance.update();
    };

    /**
     * Removes all sensor and elementquery information from the element.
     *
     * @param {HTMLElement} element
     */
    ElementQueries.detach = function (element) {
        if (element.elementQueriesSetupInformation) {
            //element queries
            element.elementQueriesSensor.detach();
            delete element.elementQueriesSetupInformation;
            delete element.elementQueriesSensor;

        } else if (element.resizeSensor) {
            //responsive image

            element.resizeSensor.detach();
            delete element.resizeSensor;
        }
    };

    ElementQueries.init = function () {
        if (!ElementQueries.instance) {
            ElementQueries.instance = new ElementQueries();
        }

        ElementQueries.instance.init();
    };

    var domLoaded = function (callback) {
        /* Mozilla, Chrome, Opera */
        if (document.addEventListener) {
            document.addEventListener('DOMContentLoaded', callback, false);
        }
        /* Safari, iCab, Konqueror */
        else if (/KHTML|WebKit|iCab/i.test(navigator.userAgent)) {
            var DOMLoadTimer = setInterval(function () {
                if (/loaded|complete/i.test(document.readyState)) {
                    callback();
                    clearInterval(DOMLoadTimer);
                }
            }, 10);
        }
        /* Other web browsers */
        else window.onload = callback;
    };

    ElementQueries.findElementQueriesElements = function (container) {
        ElementQueries.instance.findElementQueriesElements(container);
    };

    ElementQueries.listen = function () {
        domLoaded(ElementQueries.init);
    };

    return ElementQueries;

}));

//////////////////////////////////////////////////////////////////////////
//
//   Init all scripts
//
//////////////////////////////////////////////////////////////////////////

// This is bad but we don't have other access to this scope.
// Ajax Portfolio  is defined as plugin and on success needs these to be reinited
// We'll refactor all of this.
window.ajaxInit = function() {
    mk_lightbox_init();
    // mk_click_events();
    // mk_social_share_global();
   // mk_social_share();
    mk_gallery();
    loop_audio_init();
};

window.ajaxDelayedInit = function() {
    mk_flexslider_init();
    // mk_portfolio_ajax();
};

$(document).ready(function() {
    mk_lightbox_init();
    // mk_login_form();
    mk_backgrounds_parallax();
    mk_flexslider_init();
    mk_event_countdown();
    mk_skill_meter();
    mk_milestone();
    // mk_ajax_search();
    // mk_hover_events();
    // mk_portfolio_ajax();
    // product_loop_add_cart();
  //  mk_social_share();
    // mk_portfolio_widget();
    mk_contact_form();
    mk_blog_carousel();
    // mk_header_searchform();
    // mk_click_events();
    // mk_text_typer();
    mk_tab_slider_func();

    $(window).on('load', function() {
        // mk_unfold_footer();
        // mk_tabs();
        // mk_accordion_toggles_tooltip();
        mk_gallery();
        mk_theatre_responsive_calculator();
        // mk_tabs_responsive();
        // mk_start_tour_resize();
        // mk_header_social_resize();
        // mk_page_section_social_video_bg();
        loop_audio_init();
        mk_one_page_scroller();
        // mkPositionSidebar();

        setTimeout(function() {
            /*
                Somehow the values are not correctly updated for the screens
                and we need to put setTimeout to fix the issue
            */
            mk_mobile_tablet_responsive_calculator();
        }, 300);

        console.log("ready for rock");
    });


    var onDebouncedResize = function() {
        mk_theatre_responsive_calculator();
        mk_mobile_tablet_responsive_calculator();
        // mk_tabs_responsive();
        // mk_accordion_toggles_tooltip();
        // mk_start_tour_resize();
        // mk_header_social_resize();

        setTimeout(function() {
            // mk_unfold_footer();
        }, 300);
    };

    var debounceResize = null;
    $(window).on("resize", function() {
        if( debounceResize !== null ) { clearTimeout( debounceResize ); }
        debounceResize = setTimeout( onDebouncedResize, 300 );
    });

    var onDebouncedScroll = function() {
        mk_skill_meter();
        //TODO: Ask to Bart how we can call javascript component
        //mk_charts();
        mk_milestone();
    };

    var debounceScroll = null;
    $(window).on("scroll", function() {
        if( debounceScroll !== null ) { clearTimeout( debounceScroll ); }
        debounceScroll = setTimeout( onDebouncedScroll, 100 );
    });

    if (MK.utils.isMobile()) {
        $('body').addClass('no-transform');
    }

});

/* VC frontend editor  */
/* -------------------------------------------------------------------- */
$(window).on("vc_reload",function () {
    mk_flexslider_init();
    loop_audio_init();
    mk_tab_slider_func();
    mk_event_countdown();
    // videoLoadState();
    // mk_page_section_social_video_bg();
    // mk_hover_events();

    setTimeout(function() {
        // mkPositionSidebar();
    }, 200);
});

// Replace this if new event for remove found.
$( document ).on( 'click', '.vc_control-btn-delete', function() {
    $( window ).trigger( 'vc_reload' );
} );

$( document ).on( 'sortupdate', '.ui-sortable', function() {
    $( window ).trigger( 'vc_reload' );
} );

/* Typer */
/* -------------------------------------------------------------------- */
function mk_text_typer() {

    "use strict";

    $('[data-typer-targets]').each(function() {
        var that = this;
        MK.core.loadDependencies([ MK.core.path.plugins + 'jquery.typed.js' ], function() {
            var $this = $(that),
                $first_string = [$this.text()],
                $rest_strings = $this.attr('data-typer-targets').split(','),
                $strings = $first_string.concat($rest_strings);

            $this.text('');

            $this.typed({
                strings: $strings,
                typeSpeed: 30, // typing speed
                backDelay: 1200, // pause before backspacing
                loop: true, // loop on or off (true or false)
                loopCount: false, // number of loops, false = infinite
            });
        });
    });
}



/* Tab Slider */
/* -------------------------------------------------------------------- */

function mk_tab_slider_func() {

    "use strict";

    $('.mk-tab-slider').each(function() {
        var that = this;

        MK.core.loadDependencies([ MK.core.path.plugins + 'jquery.swiper.js' ], function() {
            var $this = $(that),
                id = $this.data('id'),
                $autoplayTime = $this.data('autoplay'),
                $content = $('.mk-slider-content');

            var mk_tab_slider = $this.swiper({
                wrapperClass: 'mk-tab-slider-wrapper',
                slideClass: 'mk-tab-slider-item',
                calculateHeight: true,
                speed: 500,
                autoplay: $autoplayTime,
                onSlideChangeStart: function() {
                    $('.mk-tab-slider-nav[data-id="' + id + '"]').find(".active").removeClass('active')
                    $('.mk-tab-slider-nav[data-id="' + id + '"]').find("a").eq(mk_tab_slider.activeIndex).addClass('active')
                }
            });

            // Simple repaint for firefox issue (can't handle 100% height after plugin init)
            function repaintFirefox() {
                $content.css('display','block');
                setTimeout(function() {
                    mk_tab_slider.reInit();
                    $content.css('display','table');
                },100);
            }

            $('.mk-tab-slider-nav[data-id="' + id + '"]').find("a").first().addClass('active');

            $('.mk-tab-slider-nav[data-id="' + id + '"]').find("a").on('touchstart mousedown', function(e) {
                e.preventDefault()
                $('.mk-tab-slider-nav[data-id="' + id + '"]').find(".active").removeClass('active')
                $(this).addClass('active')
                mk_tab_slider.swipeTo($(this).index())
            });

            $('.mk-tab-slider-nav[data-id="' + id + '"]').find("a").click(function(e) {
                e.preventDefault();
            });

            repaintFirefox();
            $(window).on('resize', repaintFirefox);
        });

    });

}



/* Edge One Pager */
/* -------------------------------------------------------------------- */
function mk_one_page_scroller() {

    "use strict";

    $('.mk-edge-one-pager').each(function() {
        var self = this;

        MK.core.loadDependencies([ MK.core.path.plugins + 'jquery.fullpage.js' ], function() {

            var $this = $(self),
                anchorArr = [];

            $this.find('.section').each(function() {
                anchorArr.push($(this).attr('data-title'));
            });

            var scrollable = true;
            $this.find('.section').each(function() {
                var $section = $(this),
                    $content = $section.find('.edge-slide-content'),
                    sectionHeight = $section.height(),
                    contentHeight = $content.innerHeight();

                if((contentHeight + 30) > $(window).height()) {
                    scrollable = false;
                }
            });

            if(!scrollable){
                $this.find('.section').each(function() {
                    var $section = $(this);
                    $section.addClass('active').css({
                        'padding-bottom': '50px'
                    });
                });
            }

            if(scrollable) {
                $this.fullpage({
                    verticalCentered: false,
                    resize: true,
                    slidesColor: ['#ccc', '#fff'],
                    anchors: anchorArr,
                    scrollingSpeed: 600,
                    easing: 'easeInQuart',
                    menu: false,
                    navigation: true,
                    navigationPosition: 'right',
                    navigationTooltips: false,
                    slidesNavigation: true,
                    slidesNavPosition: 'bottom',
                    loopBottom: false,
                    loopTop: false,
                    loopHorizontal: true,
                    autoScrolling: true,
                    scrollOverflow: false,
                    css3: true,
                    paddingTop: 0,
                    paddingBottom: 0,
                    normalScrollElements: '.mk-header, .mk-responsive-wrap',
                    normalScrollElementTouchThreshold: 5,
                    keyboardScrolling: true,
                    touchSensitivity: 15,
                    continuousVertical: false,
                    animateAnchor: true,

                    onLeave: function(index, nextIndex, direction) {
                        var currentSkin = $this.find('.one-pager-slide').eq(nextIndex - 1).attr('data-header-skin');
                        MK.utils.eventManager.publish( 'firstElSkinChange', currentSkin );
                        $('#fullPage-nav').removeClass('light-skin dark-skin').addClass(currentSkin + '-skin');

                    },
                    afterRender: function() {

                        var $nav = $('#fullPage-nav');

                        setTimeout(function() {
                            var currentSkin = $this.find('.one-pager-slide').eq(0).attr('data-header-skin');
                            MK.utils.eventManager.publish( 'firstElSkinChange', currentSkin );
                            if($nav.length) $nav.removeClass('light-skin dark-skin').addClass(currentSkin + '-skin');
                        }, 300);

                        var $slide = $this.find('.section'),
                            headerHeight = MK.val.offsetHeaderHeight(0),
                            windowHeight = $(window).height();

                        $slide.height(windowHeight - headerHeight);

                        if($nav.length) {
                            $nav.css({
                                'top': 'calc(50% + ' + (headerHeight/2) + 'px)',
                                'marginTop': 0
                            });

                            var style = $this.attr('data-pagination');
                            $nav.addClass('pagination-' + style);
                        }

                        setTimeout(mk_one_pager_resposnive, 1000);
                    },
                    afterResize: function() {
                        var $slide = $this.find('.section'),
                            headerHeight = MK.val.offsetHeaderHeight(0),
                            windowHeight = $(window).height();

                        $slide.height(windowHeight - headerHeight);

                        $('#fullPage-nav').css({
                            'top': 'calc(50% + ' + (headerHeight/2) + 'px)',
                            'marginTop': 0
                        });

                        setTimeout(mk_one_pager_resposnive, 1000);
                        console.log('Reposition pager content.');
                    },
                });
            }

            // Linking to slides available for desktop and mobile scenarios
            function swipeTo(href, e) {
                href = '_' + href; // ensure a char before #
                if (!~href.indexOf('#')) return;
                var section = href.split('#')[1];
                if (~anchorArr.indexOf(section)) {
                    if (typeof e !== 'undefined') e.preventDefault();
                    if (scrollable) $.fn.fullpage.moveTo(section);
                    else MK.utils.scrollToAnchor('[data-title="'+section+'"]');
                }
            }

            // onload
            var loc = window.location;
            if(loc.hash) swipeTo(loc.hash);

            $(document).on('click', 'a', function(e) {
                var $link = $(e.currentTarget);
                swipeTo($link.attr('href'), e);
            });
        });
    });



}


function mk_one_pager_resposnive() {
    "use strict";

    $('.mk-edge-one-pager').each(function() {
        var $pager = $(this),
            headerHeight = MK.val.offsetHeaderHeight(0),
            windowHeight = $(window).height() - headerHeight;

        $pager.find('.one-pager-slide').each(function() {
            var $slide = $(this),
                $content = $slide.find('.edge-slide-content');

            if ($slide.hasClass('left_center') || $slide.hasClass('center_center') || $slide.hasClass('right_center')) {
                var contentHeight  = $content.height(),
                    distanceFromTop = (windowHeight - contentHeight) / 2;

                distanceFromTop  = (distanceFromTop < 50) ? 50 + headerHeight : distanceFromTop;

                $content.css('marginTop', distanceFromTop);
            }

            if ($slide.hasClass('left_bottom') || $slide.hasClass('center_bottom') || $slide.hasClass('right_bottom')) {
                var distanceFromTop = windowHeight - $content.height() - 90;
                $content.css('marginTop', (distanceFromTop));
            }
        });

        /**
         * Fix AM-2853
         *
         * @since 6.0.3
         *
         * At the init of Edge One Pager (EOP), EOP will render all image
         * background of each sections from top to bottom. In this case,
         * the page height will be more than screen height and the scroll
         * bar will appear. At the same time, the full width row will set
         * the container width into 100%. But, after all Slides are set up,
         * EOP height will be 100% of the screen height, so the scroll bar
         * will be disappeared. It's caused spacing issues on the left and
         * right side of the EOP container. To fix this, the row width
         * should be resized and row position should be readjusted.
         */
        var $row = $pager.parents( '.vc_row.vc_row-fluid.mk-fullwidth-true' );

        // Run only if the Edge One Pager is wrapped inside full width row.
        if ( $row.length > 0 ) {
            // Set the wrapper and row width.
            var $wrapper = $( '.mk-main-wrapper-holder' );
            var $grid = $row.children( '.mk-grid' );
            var rowWidth = $row.width();         // Original width.
            var wrapperWidth = $wrapper.width(); // The new width.

            // Run only if original width is smaller than the new width.
            if ( rowWidth >= wrapperWidth || $grid.length > 0 ) {
                return;
            }

            // Get the content left offset.
            var $content = $wrapper.find( '.theme-content' );
            var oriPos = $content.position();
            var oriPadLeft = $content.css( 'padding-left' );
            var oriLeft = parseInt( oriPos.left ) + parseInt( oriPadLeft );

            // Ensure the new width and left position is more than 0.
            if ( wrapperWidth <= 0 || oriLeft <= 0 ) {
                return;
            }

            // Resize the width and left position of row full width.
            $row.css({
                'width': wrapperWidth,
                'left': oriLeft * -1,
            });
        }
    });
}

/* Image Gallery */
/* -------------------------------------------------------------------- */

function mk_gallery() {

    "use strict";

    $('.mk-gallery .mk-gallery-item.hover-overlay_layer .item-holder').each(function() {
        var itemHolder = $(this),
            galleryDesc = itemHolder.find('.gallery-desc');

        function updatePosition() {
            var parentHeight = itemHolder.outerHeight(),
                contentHeight = galleryDesc.innerHeight();

            var paddingVal = (parentHeight - contentHeight) / 2;
            galleryDesc.css({
                'top': paddingVal,
                // 'padding-bottom': paddingVal
            });

            // console.log(parentHeight);
            // console.log(contentHeight);


        }
        updatePosition();

        $(window).on('resize', function() {
            setTimeout(function() {
                updatePosition();
            }, 1000);
        });
    });
    // Execute hover state for mk gallery item
    if ($(window).width() <= 1024) {
        $('.mk-gallery .mk-gallery-item').on('click', function (e) {
            var clicks = $(this).data('clicks');
            if (clicks) {
                // First click
                $(this).toggleClass('hover-state');
            } else {
                // Second click
                $(this).toggleClass('hover-state');
            }
            $(this).data("clicks", !clicks);
        });
    }
}

/* Theatre Slider Responsive Calculator */
/* -------------------------------------------------------------------- */

function mk_theatre_responsive_calculator() {
    var $laptopContainer = $(".laptop-theatre-slider");
    var $computerContainer = $(".desktop-theatre-slider");
    $laptopContainer.each(function() {
        var $this = $(this),
            $window = $(window),
            $windowWidth = $window.outerWidth(),
            $windowHeight = $window.outerHeight(),
            $width = $this.outerWidth(),
            $height = $this.outerHeight(),
            $paddingTop = 38,
            $paddingRight = 143,
            $paddingBottom = 78,
            $paddingLeft = 143;

        var $player = $this.find('.player-container');

        if ($windowWidth > $width) {
            $player.css({
                'padding-left': parseInt(($width * $paddingLeft) / 1200),
                'padding-right': parseInt(($width * $paddingRight) / 1200),
                'padding-top': parseInt(($height * $paddingTop) / 690),
                'padding-bottom': parseInt(($height * $paddingBottom) / 690),
            });
        }

    });

    $computerContainer.each(function() {
        var $this = $(this),
            $window = $(window),
            $windowWidth = $window.outerWidth(),
            $windowHeight = $window.outerHeight(),
            $width = $this.outerWidth(),
            $height = $this.outerHeight(),
            $paddingTop = 60,
            $paddingRight = 52,
            $paddingBottom = 290,
            $paddingLeft = 49;

        var $player = $this.find('.player-container');

        if ($windowWidth > $width) {
            $player.css({
                'padding-left': parseInt(($width * $paddingLeft) / 1200),
                'padding-right': parseInt(($width * $paddingRight) / 1200),
                'padding-top': parseInt(($height * $paddingTop) / 969),
                'padding-bottom': parseInt(($height * $paddingBottom) / 969),
            });
        }

    });

}

/* Mobile and Tablet Slideshow Responsive Calculator */
/* -------------------------------------------------------------------- */
function mk_mobile_tablet_responsive_calculator() {
    var $laptopSlideshow = $(".mk-laptop-slideshow-shortcode");
    var $lcdSlideshow = $(".mk-lcd-slideshow");

    if ($.exists(".mk-laptop-slideshow-shortcode")) {
        $laptopSlideshow.each(function() {
            var $this = $(this),
                $window = $(window),
                $windowWidth = $window.outerWidth(),
                $windowHeight = $window.outerHeight(),
                $width = $this.outerWidth(),
                $height = $this.outerHeight(),
                $paddingTop = 28,
                $paddingRight = 102,
                $paddingBottom = 52,
                $paddingLeft = 102;

            var $player = $this.find(".slideshow-container");

            $player.css({
                "padding-left": parseInt(($width * $paddingLeft) / 836),
                "padding-right": parseInt(($width * $paddingRight) / 836),
                "padding-top": parseInt(($height * $paddingTop) / 481),
                "padding-bottom": parseInt(($height * $paddingBottom) / 481),
            });

        });
    }

    if ($.exists(".mk-lcd-slideshow")) {
        $lcdSlideshow.each(function() {
            var $this = $(this),
                $window = $(window),
                $windowWidth = $window.outerWidth(),
                $windowHeight = $window.outerHeight(),
                $width = $this.outerWidth(),
                $height = $this.outerHeight(),
                $paddingTop = 35,
                $paddingRight = 39,
                $paddingBottom = 213,
                $paddingLeft = 36;

            var $player = $this.find(".slideshow-container");
            $player.css({
                "padding-left": parseInt(($width * $paddingLeft) / 886),
                "padding-right": parseInt(($width * $paddingRight) / 886),
                "padding-top": parseInt(($height * $paddingTop) / 713),
                "padding-bottom": parseInt(($height * $paddingBottom) / 713),
            });
        });
    }
}


/* Start a tour resize function */
/* -------------------------------------------------------------------- */
function mk_start_tour_resize() {

    $('.mk-header-start-tour').each(function() {

        var $windowWidth = $(document).width(),
            $this = $(this),
            $linkWidth = $this.width() + 15,
            $padding = ($windowWidth - mk_responsive_nav_width) / 2;



        function updateStartTour(){
            if($windowWidth < mk_responsive_nav_width){
                $this.removeClass('hidden');
                $this.addClass('show');
            }else{
                if($padding < $linkWidth){
                    $this.removeClass('show');
                    $this.addClass('hidden');
                }else{
                    $this.removeClass('hidden');
                    $this.addClass('show');
                }
            }
        }

        setTimeout(function() {
            updateStartTour();
        }, 300);
    });
}

/* Header social resize function */
/* -------------------------------------------------------------------- */
function mk_header_social_resize() {

    $('.mk-header-social.header-section').each(function() {

        var $windowWidth = $(document).width(),
            $this = $(this),
            $linkWidth = $this.width() + 15,
            $padding = ($windowWidth - mk_responsive_nav_width) / 2;



        function updateStartTour(){
            if($windowWidth < mk_responsive_nav_width){
                $this.removeClass('hidden');
                $this.addClass('show');
            }else{
                if($padding < $linkWidth){
                    $this.removeClass('show');
                    $this.addClass('hidden');
                }else{
                    $this.removeClass('hidden');
                    $this.addClass('show');
                }
            }
        }

        setTimeout(function() {
            updateStartTour();
        }, 300);
    });
}

/* Page Section Socail Video Player Controls */
/* -------------------------------------------------------------------- */

function mk_page_section_social_video_bg() {
    $(".mk-page-section.social-hosted").each(function() {
        var $container = $(this),
            $sound = $container.data('sound'),
            $source = $container.data('source'),
            player,
            timer = 1000;

        if ( $( 'body' ).hasClass( '.compose-mode' ) ) {
            timer = 2000;
        }

        if ($source == 'youtube') {
            var youtube = $container.find('iframe')[0];
            try {
                player = new YT.Player(youtube, {
                    events: {
                        'onReady': function () {
                           player.playVideo();
                           if($sound == false) {
                               player.mute();
                           }
                       }
                    }
                });


            } catch (e) {
            	console.log( e );
            }
        }
        if ($source == 'vimeo') {
            var vimeo = $container.find('iframe')[0];
            player = $f(vimeo);
            setTimeout(function() {
                player.api('play');
                if($sound === false) {
                    player.api('setVolume', 0);
                }
            }, timer);
        }

    });
}

// Pre RequireJS hot bug fixing

function videoLoadState() {
    $('.mk-section-video video').each(function() {
        var mkVideo = this;

        mkVideo.play();
        this.onload = fire();

        function fire() {
            setTimeout(function() {
                $(mkVideo).animate({
                    'opacity': 1
                }, 300);
            }, 1000);
        }
    });
}
videoLoadState();


// Gmap Widget
(function($) {

    $(window).on('load vc_reload', initialize);

    function initialize() {
        var $gmap = $('.gmap_widget');
        if($gmap.length && typeof google !== 'undefined') $gmap.each(run);
    }

    function run() {
        var $mapHolder = $(this);
        var myLatlng = new google.maps.LatLng($mapHolder.data('latitude'), $mapHolder.data('longitude'));
        var mapOptions = $mapHolder.data('options');
            mapOptions.mapTypeId = google.maps.MapTypeId.ROADMAP;
            mapOptions.center = myLatlng;
        var map = new google.maps.Map(this, mapOptions);

        new google.maps.Marker({
            position: myLatlng,
            map: map
        });
    }

}(jQuery));

// Instagram Widget
(function($) {

    $(window).on('load', function() {
        var $feeds = $('.mk-instagram-feeds');
        if($feeds.length) $feeds.each(run);
    });

    function run() {
        var options = $(this).data('options');
            options.template = '<a class="featured-image '+options.tmp_col+'-columns" href="{{link}}" target="_'+options.tmp_target+'"><div class="item-holder"><img src="{{image}}" /><div class="image-hover-overlay"></div></div></a>';
        var feed = new Instafeed(options);
        feed.run();
    }
}(jQuery));


// Flipbox backface visibility fix for chrome
(function($) {
     $(window).on('load', function() {
         setTimeout( function() {
            $('.chrome-flipbox-backface-fix').removeClass('chrome-flipbox-backface-fix');
         }, 300);
     });
}(jQuery));


/* Product in VC Tab Bug Fix
/* -------------------------------------------------------------------- */
(function($) {
    $(window).on('load', function() {
        $('.vc_tta-tab a').on('click', function() {
            setTimeout( function() {
                $(window).trigger('resize');
            }, 100);
        });
    });
}(jQuery));


/* Vertical menu fix when childrens exceed screen height
/* -------------------------------------------------------------------- */
(function($) {
    $(window).on('load', function() {
        $('#mk-vm-menu .menu-item-has-children, #mk-vm-menu .mk-vm-back').on('mouseenter', function() {
            var $header_inner = $(this).closest('.mk-header-inner'),
                $header_inner_height = $header_inner.outerHeight(),
                $header_bg = $header_inner.find('.mk-header-bg'),
                total_height = 0;
            $header_bg.css('height', '100%');
            setTimeout( function() {
                $header_inner.children(':visible').each(function() {
                    total_height += $(this).outerHeight(true);
                });
                total_height -= $header_bg.height();
                if ( total_height < $header_inner_height ) {
                    $header_bg.css('height', '100%');
                } else {
                    $header_bg.css('height', total_height + 'px');
                }
            }, 600);
        });
    });
}(jQuery));


/* Woocommerce varitions lightbox fix
/* -------------------------------------------------------------------- */
(function($) {
    $(window).on('load', function() {

        var $variations_form = $('.variations_form');

        if ( $variations_form.length ) {

            var $varitions_selects = $variations_form.find('.variations').find('.value').find('select');
            $varitions_selects.on('change', function() {

                // Woocommerce variations lightbox with galleries
                var $all_img_container = $('.mk-product-image .mk-woocommerce-main-image');
                if ( $all_img_container.length ) {
                    $( $all_img_container ).each( set_lightbox_href );
                }

            });
            $varitions_selects.trigger('change');

        }

    });

    function set_lightbox_href() {

        var $product_img = $( this ).find( 'img' ),
            $lightbox    = $( this ).find( '.mk-lightbox' );

        setTimeout( function() {
            var image_url    = $product_img.attr( 'src' ),
                image_suffix = image_url.substr( image_url.lastIndexOf('.') - image_url.length ), // Get image suffix
                image_url    = image_url.slice( 0 , image_url.lastIndexOf('-') ); // Remove image size
            $lightbox.attr('href', image_url + image_suffix );
        }, 300);
    }

}(jQuery));


/* Remove video section when on mobile */
/* -------------------------------------------------------------------- */
(function($) {
    if ( MK.utils.isMobile() ) {
      $('.mk-section-video video').remove();
    }
}(jQuery));


/* Yith AJAX Product Filter & Yith Infinite Scrolling Plugin Fix
/* -------------------------------------------------------------------- */
(function($) {
    $(window).on('load', function() {

        $(document).on( 'yith-wcan-ajax-filtered yith_infs_added_elem yith-wcan-ajax-reset-filtered', function(){
            setTimeout( function() {
                MK.utils.eventManager.publish('ajaxLoaded');
                MK.core.initAll( document );
            }, 1000 );
        });

        // Fixed YITH Filter plugin causes issue for dropdown sort
        $(document).on( 'yith-wcan-ajax-filtered yith-wcan-ajax-reset-filtered', function(){
            setTimeout( function() {
                $( '.woocommerce-ordering' ).on( 'change', 'select.orderby', function() {
                    $( this ).closest( 'form' ).submit();
                });
            }, 1000 );
        });

    });
}(jQuery));


/* Toggle loading state in URL for anchor links.
 * - Add a filter to escape meta-chars from hash string.
/* -------------------------------------------------------------------- */
!function(e){var a=window.location,n=a.hash;if(n.length&&n.substring(1).length){var hSuf = n.substring(1).replace(/[!"#$%&'()*+,./:;<=>?@[\]^`{|}~]/g, "\\$&");var r=e(".vc_row, .mk-main-wrapper-holder, .mk-page-section, #comments"),t=r.filter("#"+hSuf);if(!t.length)return;n=n.replace("!loading","");var i=n+"!loading";a.hash=i}}(jQuery);


/* Determine the top spacing of sidebar for full-width page section & row.
/* -------------------------------------------------------------------- */
function mkPositionSidebar() {

	var themeContent = $( '.theme-content' ),
		lastFullWidthChild = themeContent.find( '.vc_row-full-width' ).last(),
		top,
		sidebar = $( '#theme-page > .mk-main-wrapper-holder > .theme-page-wrapper > #mk-sidebar' );

	if ( ! lastFullWidthChild.length ) {
		sidebar.removeAttr( 'style' );
		return;
	}

	top = lastFullWidthChild.offset().top - themeContent.offset().top;
	sidebar.css( 'padding-top', top );
}

(function($) {
	'use strict';

	$.exists = function(selector) {
	    return ($(selector).length > 0);
	};

	/**
	 * Helper to enable caching async scripts
	 * https://api.jquery.com/jquery.getscript/
	 * http://www.vrdmn.com/2013/07/overriding-jquerygetscript-to-include.html
	 * 
	 * @param  {String}   script url
	 * @param  {Function} callback     
	 */
	$.getCachedScript = function( url ) {
		var options = {
			dataType: "script",
			cache: true,
			url: url
		};
	 
	    // Use $.ajax() since it is more flexible than $.getScript
	    // Return the jqXHR object so we can chain callbacks
	  	return $.ajax( options );
	};



	// Fn to allow an event to fire after all images are loaded
	// usage:
	// $.ajax({
	//     cache: false,
	//     url: 'ajax/content.php',
	//     success: function(data) {
	//         $('#divajax').html(data).imagesLoaded().then(function(){
	//             // do stuff after images are loaded here
	//         });
	//     }
	// });
	$.fn.mk_imagesLoaded = function () {

	    // Edit: in strict mode, the var keyword is needed
	    var $imgs = this.find('img[src!=""]');
	    // if there's no images, just return an already resolved promise
	    if (!$imgs.length) {return $.Deferred().resolve().promise();}

	    // for each image, add a deferred object to the array which resolves when the image is loaded (or if loading fails)
	    var dfds = [];  
	    $imgs.each(function(){
	        var dfd = $.Deferred();
	        dfds.push(dfd);
	        var img = new Image();
	        img.onload = function(){dfd.resolve();};
	        img.onerror = function(){dfd.resolve();};
	        img.src = this.src;
	    });

	    // return a master promise object which will resolve when all the deferred objects have resolved
	    // IE - when all the images are loaded
	    return $.when.apply($,dfds);

	};

}(jQuery));
/**
* Detect Element Resize
*
* https://github.com/sdecima/javascript-detect-element-resize
* Sebastian Decima
*
* version: 0.5.3
**/

(function () {
	var attachEvent = document.attachEvent,
		stylesCreated = false;

	if (!attachEvent) {
		var requestFrame = (function(){
			var raf = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame ||
								function(fn){ return window.setTimeout(fn, 20); };
			return function(fn){ return raf(fn); };
		})();

		var cancelFrame = (function(){
			var cancel = window.cancelAnimationFrame || window.mozCancelAnimationFrame || window.webkitCancelAnimationFrame ||
								   window.clearTimeout;
		  return function(id){ return cancel(id); };
		})();

		/* Detect CSS Animations support to detect element display/re-attach */
		var animation = false,
			animationstring = 'animation',
			keyframeprefix = '',
			animationstartevent = 'animationstart',
			domPrefixes = 'Webkit Moz O ms'.split(' '),
			startEvents = 'webkitAnimationStart animationstart oAnimationStart MSAnimationStart'.split(' '),
			pfx  = '';
		{
			var elm = document.createElement('fakeelement');
			if( elm.style.animationName !== undefined ) { animation = true; }

			if( animation === false ) {
				for( var i = 0; i < domPrefixes.length; i++ ) {
					if( elm.style[ domPrefixes[i] + 'AnimationName' ] !== undefined ) {
						pfx = domPrefixes[ i ];
						animationstring = pfx + 'Animation';
						keyframeprefix = '-' + pfx.toLowerCase() + '-';
						animationstartevent = startEvents[ i ];
						animation = true;
						break;
					}
				}
			}
		}

		var animationName = 'resizeanim';
		var animationKeyframes = '@' + keyframeprefix + 'keyframes ' + animationName + ' { from { opacity: 0; } to { opacity: 0; } } ';
		var animationStyle = keyframeprefix + 'animation: 1ms ' + animationName + '; ';
	}

	function createStyles() {
		if (!stylesCreated) {
			//opacity:0 works around a chrome bug https://code.google.com/p/chromium/issues/detail?id=286360
			var css = (animationKeyframes ? animationKeyframes : '') +
					'.resize-triggers { ' + (animationStyle ? animationStyle : '') + 'visibility: hidden; opacity: 0; } ' +
					'.resize-triggers, .resize-triggers > div, .contract-trigger:before { content: \" \"; display: block; position: absolute; top: 0; left: 0; height: 100%; width: 100%; overflow: hidden; } .resize-triggers > div { background: #eee; overflow: auto; } .contract-trigger:before { width: 200%; height: 200%; }',
				head = document.head || document.getElementsByTagName('head')[0],
				style = document.createElement('style');

			style.type = 'text/css';
			if (style.styleSheet) {
				style.styleSheet.cssText = css;
			} else {
				style.appendChild(document.createTextNode(css));
			}

			head.appendChild(style);
			stylesCreated = true;
		}
	}

	window.addResizeListener = function(element, fn){

    function resetTriggers(element){
			var triggers = element.__resizeTriggers__,
				expand = triggers.firstElementChild,
				contract = triggers.lastElementChild,
				expandChild = expand.firstElementChild;
			contract.scrollLeft = contract.scrollWidth;
			contract.scrollTop = contract.scrollHeight;
			expandChild.style.width = expand.offsetWidth + 1 + 'px';
			expandChild.style.height = expand.offsetHeight + 1 + 'px';
			expand.scrollLeft = expand.scrollWidth;
			expand.scrollTop = expand.scrollHeight;
		};

		function checkTriggers(element){
			return element.offsetWidth != element.__resizeLast__.width ||
						 element.offsetHeight != element.__resizeLast__.height;
		}

		function scrollListener(e){
			var element = this;
			resetTriggers(this);
			if (this.__resizeRAF__) cancelFrame(this.__resizeRAF__);
			this.__resizeRAF__ = requestFrame(function(){
				if (checkTriggers(element)) {
					element.__resizeLast__.width = element.offsetWidth;
					element.__resizeLast__.height = element.offsetHeight;
					element.__resizeListeners__.forEach(function(fn){
						fn.call(element, e);
					});
				}
			});
    };

    if (!element) {return}

		if (attachEvent) element.attachEvent('onresize', fn);
		else {
			if (!element.__resizeTriggers__) {
				if (getComputedStyle(element).position == 'static') element.style.position = 'relative';
				createStyles();
				element.__resizeLast__ = {};
				element.__resizeListeners__ = [];
				(element.__resizeTriggers__ = document.createElement('div')).className = 'resize-triggers';
				element.__resizeTriggers__.innerHTML = '<div class="expand-trigger"><div></div></div>' +
																						'<div class="contract-trigger"></div>';
				element.appendChild(element.__resizeTriggers__);
				resetTriggers(element);
				element.addEventListener('scroll', scrollListener, true);

				/* Listen for a css animation to detect element display/re-attach */
				animationstartevent && element.__resizeTriggers__.addEventListener(animationstartevent, function(e) {
					if(e.animationName == animationName)
						resetTriggers(element);
				});
			}
			element.__resizeListeners__.push(fn);
		}
	};

	window.removeResizeListener = function(element, fn){
		if (attachEvent) element.detachEvent('onresize', fn);
		else {
			element.__resizeListeners__.splice(element.__resizeListeners__.indexOf(fn), 1);
			if (!element.__resizeListeners__.length) {
					element.removeEventListener('scroll', scrollListener);
					element.__resizeTriggers__ = !element.removeChild(element.__resizeTriggers__);
			}
		}
	}
})();

(function($) {
	'use strict';

	var MK = window.MK || {};

	/**
	* 	MK.val is collection of Lambdas responsible for returning up to date values of method type like scrollY or el offset.
	* 	The Lambda is responsible for keeping track of value of a particular property, usually takes as argument an object
	* 	(or DOM reference) and internally creates and updates data that is returned as primitive value - through variable reference.
	*
	*  Benefits of this approach:
	*  - reduced DOM reads
	*  - auto-updating values without need for additional logic where methods are called
	*  - updating values when needed to be updated not read
	*
	*  Downsides:
	*  - Memory overhead with closures and keeping state in memory ( still beter than read state from DOM, but use wisely -
	*    do not use it when you really need static value on runtime )
	*/
	MK.val = {};

	/**
	* Current window offsetY position
	*
	* @uses   MK.val.scroll()
	* @return {number}
	*/
	MK.val.scroll = (function() {
		var offset = 0,
		$window = $(window),
		hasPageYOffset = (window.pageYOffset !== undefined),
		body = (document.documentElement || document.body.parentNode || document.body); // cross browser handling

		var update = function() {
			offset = hasPageYOffset ? window.pageYOffset : body.scrollTop;
		};

		var rAF = function() {
			window.requestAnimationFrame(update);
		};

		update();
		$window.on('load', update);
		$window.on('resize', update);
		$window.on('scroll', rAF);

		return function() {
			return offset;
		};
	})();


	/**
	* Changes number of percent to pixels based on viewport height
	*
	* @uses   MK.val.viewportPercentHeight({percent val})
	* @param  {number}
	* @return {number}
	*/
	MK.val.viewportPercentHeight = function(percent) {
		return $(window).height() * (percent / 100);
	};


	/**
	* Wordpress adminbar height based on wp media queries
	* @return {Number}
	*/
	MK.val.adminbarHeight = function() {
		if (php.hasAdminbar) {
			// apply WP native media-query and sizes
			return (window.matchMedia('( max-width: 782px )').matches) ? 46 : 32;
		} else {
			return 0;
		}
	};


	/**
	* Offset when header becomes sticky. Evaluates viewport % and header height to pixels for according options
	* @return {Number}
	*/
	MK.val.stickyOffset = (function() {
		var $header = $('.mk-header').not('.js-header-shortcode').first();

		// We need to have returning function even when header is disabled
		if (!$header.length) {
			return function() {
				return 0;
			};
		}



		var $toolbar = $header.find('.mk-header-toolbar'),
		config = $header.data(),
		hasToolbar = $toolbar.length,
		toolbarHeight = (hasToolbar) ? $toolbar.height() : 0,
		isVertical = (config.headerStyle === 4),
		headerHeight = (isVertical) ? 0 : config.height;

		var type = ((typeof config.stickyOffset === 'number') ? 'number' : false) ||
		((config.stickyOffset === 'header') ? 'header' : false) ||
		'percent';

		var stickyOffset = 0;
		var setOffset = function() {

			//we calculate toolbar height for When the device is changed Size
			//Toolbar height in responsive state is 0
			toolbarHeight = (hasToolbar) ? $toolbar.height() : 0;

			if (MK.utils.isResponsiveMenuState()) {
				headerHeight = config.responsiveHeight;

				if (hasToolbar) {
					if ($toolbar.is(':hidden')) {
						toolbarHeight = 0;
					}
				}
			}

			if (type === 'number') {
				stickyOffset = config.stickyOffset;
			} else if (type === 'header') {

				stickyOffset = headerHeight + toolbarHeight + MK.val.adminbarHeight(); // add all header components here, make them 0 if needed

			} else if (type === 'percent') {
				stickyOffset = MK.val.viewportPercentHeight(parseInt(config.stickyOffset));
			}
		};

		setOffset();
		$(window).on('resize', setOffset);

		return function() {
			return stickyOffset;
		};
	}());



	/**
	* Gets header height on particular offsetY position. Use to determine logic for fullHeight, smooth scroll etc.
	* Takes one parameter which is offset position we're interested in.
	*
	* @uses   MK.val.offsetHeaderHeight({offset val})
	* @param  {number}
	* @return {number}
	*/
	MK.val.offsetHeaderHeight = (function() { // Closure avoids multiple DOM reads. We need to fetch header config only once.
		var $header = $('.mk-header').not('.js-header-shortcode').first();

		// We need to have returning function even when header is disabled
		if (!$header.length) {
			return function() {
				return 0;
			};
		}

		var $toolbar = $header.find('.mk-header-toolbar'),
		config = $header.data(),
		stickyHeight = config.stickyHeight,
		desktopHeight = config.height,
		mobileHeight = config.responsiveHeight,
		isTransparent = $header.hasClass('transparent-header'),
		isSticky = config.stickyStyle.length,
		isStickyLazy = config.stickyStyle === 'lazy',
		isVertical = config.headerStyle === 4,
		hasToolbar = $toolbar.length,
		toolbarHeight = hasToolbar ? $toolbar.height() : 0,
		bufor = 5;

		/**
		 * The sticky section of header style 2 has fixed height.
		 * The stickey height option does not affect this header style.
		 */
		if ( config.headerStyle === 2 ) {
			stickyHeight = $header.find( '.mk-header-nav-container' ).outerHeight();
		}

		// if header has border bottom we can calculate that (for responsive state)
		var $innerHeader = $header.find('.mk-header-inner');
		var hasInnerHeader = $innerHeader.length;

		var headerHeight = function(offset) {

			toolbarHeight = hasToolbar ? $toolbar.height() : 0
			var stickyOffset = MK.val.stickyOffset();


			if (MK.utils.isResponsiveMenuState()) { //  Header avaible only on top for mobile

				if (hasToolbar && $toolbar.is(':hidden')) {
					toolbarHeight = 0;
				}

				//in responsive state , .mk-header-holder position's changed to "relative"
				//and header's border affected to offset,so borders must be calculated
				var headerBorder = 0;
				headerBorder = parseInt($innerHeader.css('border-bottom-width'));

				var totalHeight = mobileHeight + MK.val.adminbarHeight() + toolbarHeight + headerBorder;

				if (offset <= totalHeight) return totalHeight;
				else return MK.val.adminbarHeight();
			} else {
				if (offset <= stickyOffset) {
					if (isVertical) {
						if (hasToolbar) {
							return toolbarHeight + MK.val.adminbarHeight();
						} else {
							return MK.val.adminbarHeight();
						}
					} else if (isTransparent) {
						return MK.val.adminbarHeight();
					} else {
						return desktopHeight + toolbarHeight + MK.val.adminbarHeight();
					} // For any other return regular desktop height
				} else if (offset > stickyOffset) {
					if (isVertical) {
						return MK.val.adminbarHeight();
					} else if (!isSticky) {
						return MK.val.adminbarHeight();
					} else if (isStickyLazy) {
						return MK.val.adminbarHeight();
					} else if (isSticky) {
						return stickyHeight + MK.val.adminbarHeight();
					}
				}
			}
			// default to 0 to prevent errors ( need to return number )
			// Anyway make sure all scenarios are covered in IFs
			return 0;
		};

		return function(offset) {
			return headerHeight(offset - MK.val.adminbarHeight());
		};
	})();


	/**
	* Gets current offset of given element (passed as object or DOM reference) from top or bottom (default to top)
	* of screen  with possible threshold (default to 0)
	*
	* @uses   MK.val.dynamicOffset({obj reference}, {'top'|'bottom'}, {threshold val})
	* @param  {string|object}
	* @param  {string}
	* @param  {number}
	* @return {number}
	*/
	MK.val.dynamicOffset = function(el, position, threshold) {
		var $window = $(window),
		$el = $(el),
		pos = position || 'top',
		thr = threshold || 0,
		container = $('.jupiterx-site')[0],
		currentPos = 0;

		var offset = 0,
		winH = 0,
		rect = 0,
		x = 0;

		var update = function() {
			winH = $window.height();
			rect = $el[0].getBoundingClientRect();
			offset = (rect.top + MK.val.scroll());
			x = (pos === 'top') ? MK.val.offsetHeaderHeight(offset) : winH + (rect.height - thr);
			currentPos = offset - x - 1;
		};

		update();
		$window.on('load', update);
		$window.on('resize', update);
		window.addResizeListener(container, update);

		return function() {
			return currentPos;
		};
	};

	/**
	* Gets current height of given element (passed as object or DOM reference)
	*
	* @uses   MK.val.dynamicHeight({obj reference})
	* @param  {string|object}
	* @return {number}
	*/
	MK.val.dynamicHeight = function(el) {
		var $window = $(window),
		$el = $(el),
		container = $('.jupiterx-site')[0],
		currentHeight = 0;

		var update = function() {
			currentHeight = $el.outerHeight();
		};

		update();
		$window.on('load', update);
		$window.on('resize', update);
		window.addResizeListener(container, update);

		return function() {
			return currentHeight;
		};
	};

})(jQuery);

(function($) {
    'use strict';

    var Accordion = function(el) { 
        // Private
        var that = this,
            $el = $(el),
            initial = $el.data('initialindex'),
            timeout;

        // Public
        this.$el = $el;
        this.$single = $('.' + this.dom.single, $el);
        this.isExpendable = ($el.data('style') === 'toggle-action');

        // Init 
        this.bindClicks();
        // Reveal initial tab on load event (wait for possible images inside)
        $(window).on('load', function() {
            if( initial !== -1 ) that.show(that.$single.eq(initial))
        });
        $(window).on('resize', function() {
            clearTimeout(timeout);
            timeout = setTimeout(that.bindClicks.bind(that), 500);
        }); 
    }

    Accordion.prototype.dom = {
        // only class names please!
        single        : 'mk-accordion-single',
        tab           : 'mk-accordion-tab',
        pane          : 'mk-accordion-pane',
        current       : 'current',
        mobileToggle  : 'mobile-false',
        mobileBreakPoint : 767
    }

    Accordion.prototype.bindClicks = function() {
        // Prevent multiple events binding
        this.$single.off('click', '.' + this.dom.tab);

        if( !(window.matchMedia('(max-width: ' + this.dom.mobileBreakPoint +'px)').matches 
          && this.$el.hasClass(this.dom.mobileToggle)) ) {

            this.$single.on('click', '.' + this.dom.tab, this.handleEvent.bind(this));
            // When website is loaded in mobile view and resized to desktop 'current' will 
            // inherit display: none from css. Repair it by calling show() on this element
            var $current = $('.' + this.dom.current, this.$el);
            if($('.' + this.dom.pane, $current).css('display') === 'none') this.show($current);
        }
    }

    Accordion.prototype.handleEvent = function(e) {
        e.preventDefault();
        e.stopPropagation();

        var $single = $(e.delegateTarget);

        if(!$single.hasClass(this.dom.current)) {
            this.show($single);
        }
        else {
            if(this.isExpendable) this.hide($single);
        }
    }

    Accordion.prototype.hide = function($single) {
        $single.removeClass(this.dom.current);
        $('.' + this.dom.pane, $single).slideUp();
    }

    Accordion.prototype.show = function($single) {
        // hide currently opened tab
        if(!this.isExpendable) {
            var that = this;
            this.hide($('.' + this.dom.current, that.$el));
        }

        $single.addClass(this.dom.current);
        $('.' + this.dom.pane, $single).slideDown();
    }



    // ///////////////////////////////////////
    //
    // Apply to:
    //
    // ///////////////////////////////////////

	function init() {
		$('.mk-accordion').each(function() {
			new Accordion(this);
		});
	}

	init();
	$(window).on('vc_reload', init);

})(jQuery);
(function($) {
  'use strict';

  var MK = window.MK || {};
  window.MK = MK;
  MK.ui = window.MK.ui || {};

  var _ajaxUrl = MK.core.path.ajaxUrl;
  var _instances = {};

	MK.utils.ajaxLoader = function ajaxLoader(el) {
		// retrun a cached instance to have control over state from within multiple places
		// we may need for example to reset pageId when do filtering. It is really one instance that controls both filtering and pagination / load more
		var id = '#' + ($(el).attr('id'));
		if(typeof _instances[id] !== 'undefined') return _instances[id];

		// else lets start new instance
		this.id = id;
		this.el = el;
		this.isLoading = false;
		this.xhrCounter = 0;
	};

	MK.utils.ajaxLoader.prototype = {
		init: function init() {
			// prevent double initialization of we return an instance
			if ( this.initialized && typeof window.vc_iframe === 'undefined' ) {
				return;
			}

			this.createInstance();
			this.cacheElements();

			this.initialized = true;
		},

		cacheElements: function cacheElements() {
			this.$container = $(this.el);
			this.id = '#' + (this.$container.attr('id'));
	        this.categories = this.$container.data('loop-categories');

			this.data = {};
			this.data.action = 'mk_load_more';
	        this.data.query = this.$container.data('query');
	        this.data.atts = this.$container.data('loop-atts');
	        this.data.loop_iterator = this.$container.data('loop-iterator');
	        this.data.author = this.$container.data('loop-author');
	        this.data.posts = this.$container.data('loop-posts');
	        this.data.safe_load_more = this.$container.siblings('#safe_load_more').val();
	        this.data._wp_http_referer = this.$container.siblings('input[name="_wp_http_referer"]').val();
	        this.data.paged = 1;
	        this.data.maxPages = this.$container.data('max-pages');
	        this.data.term = this.categories;
		},

		createInstance: function() {
			_instances[this.id] = this;
		},

		load: function load(unique) {
			var self = this;
			var seq = ++this.xhrCounter;
            this.isLoading = true;

			// If mk-ajax-loaded-posts span exists, get the post ids
			if ( this.$container.siblings('.mk-ajax-loaded-posts').length ) {
				var loaded_posts = this.$container.siblings('.mk-ajax-loaded-posts').attr('data-loop-loaded-posts');

				// Do not send looaded posts for Classic Pagination Navigation
				if ( this.$container.attr('data-pagination-style') != 1 ) {
					self.data.loaded_posts = loaded_posts.split(',');
				}
			}

            return $.when(
	            $.ajax({
	                url 	: _ajaxUrl,
	                type 	: "POST",
	                data 	: self.data
	            })
	        ).done(function(response) {
	        	self.onDone(response, unique, seq);
	        });
		},

		onDone: function(response, unique, seq) {
			if(seq === this.xhrCounter) {
				var self = this;

				response = $.parseJSON(response);
				response.unique = unique;
				response.id = this.id;

				// If mk-ajax-loaded-posts span exists, update current post ids
				// with new post ids from server's response
				if ( this.$container.siblings('.mk-ajax-loaded-posts').length ) {
					this.$container.siblings('.mk-ajax-loaded-posts').attr('data-loop-loaded-posts', response.loaded_posts);
				}

	            this.setData({
	                maxPages: response.maxPages,
	                found_posts: response.found_posts,
	                loop_iterator: response.i
	            });

				// Preload images first by creating object from returned content.
				// mk_imagesLoaded() method will create a promise that gets resolved when all images inside are loaded.
				// Our ajaxLoad is somehow more similar to window.onload event now.
				$(response.content).mk_imagesLoaded().then(function() {
					MK.utils.eventManager.publish('ajaxLoaded', response);
		        	self.isLoading = false;
		        	self.initNewComponents();
				});

	        } else console.log('XHR request nr '+ seq +' aborted');

        },

		setData: function setData(atts) {
			for(var att in atts) {
				if(att === 'term' && atts[att] === '*') this.data.term = '';
				else this.data[att] = atts[att];
			}
		},

		getData: function getData(att) {
			return this.data[att];
		},

		initNewComponents: function initNewComponents() {
            // Legacy scripts reinit
            window.ajaxInit();
            setTimeout(window.ajaxDelayedInit, 1000);
            // New way to init apended things
            MK.core.initAll(this.el);
        }
	};

}(jQuery));

/* Background Parallax Effects */
/* -------------------------------------------------------------------- */

function mk_backgrounds_parallax() {

  "use strict";

  $('.mk-parallax-enabled').each(function () {
    var $this = $( this );
    if (!MK.utils.isMobile()) {
      MK.core.loadDependencies([ MK.core.path.plugins + 'jquery.parallax.js' ], function() {
        $this.parallax("49%", 0.3);
      });
    }
  });

  $('.mk-fullwidth-slideshow.parallax-slideshow').each(function () {
    var $this = $( this );
    if (!MK.utils.isMobile()) {
      MK.core.loadDependencies([ MK.core.path.plugins + 'jquery.parallax.js' ], function() {
        var speed_factor = $this.attr('data-speedFactor');
        $this.parallax("49%", speed_factor);
      });
    }
  });

}


var MK = window.MK || {};
window.MK = MK;
MK.component = window.MK.component || {};

MK.component.BackgroundImageSetter = (function ($) {

	'use strict';

	var module = {};


	/*---------------------------------------------------------------------------------*/
	/* Private Variables
	/*---------------------------------------------------------------------------------*/

	/**
	 *	Take all elements with data-mk-img-set attribute and evaluate best image according to given device orientation and resolution,
	 *	sets style for backround-image on the same node element.	 *
	 */

	var $win = $(window),
		// $layers = $('[data-mk-img-set]'),
		screen = getScreenSize(),
		orientation = getOrientation(),
		device = getDevice(),
		lastOrientation = orientation,
		lastDevice = device;


	/*---------------------------------------------------------------------------------*/
	/* Private Methods
	/*---------------------------------------------------------------------------------*/

	function run($layers) {
		$layers.filter( function() {
			return !this.hasAttribute("mk-img-loaded");
		}).each(applyBg);
	}

	// Keep our main side effect out of calculations so they can be run once before loop of applying bg as a result
	function applyBg() {
		var $this = $(this),
			imgs = $this.data('mk-img-set');

		$this.css('background-image', 'url('+ module.getImage(imgs) +')');
		$this.find('.mk-adaptive-image').attr('src', module.getImage(imgs));
	}

	// Keep track of current screen size while resizing but update device reference
	// and reapply backgrounds only when we discover switch point
	function handleResize($layers) {
		updateScreenSize();
		if(hasSwitched()) {
			updateDevice();
			run($layers);
		}
	}

	function getScreenSize() {
		return {
			w: $win.width(),
			h: $win.height()
		};
	}

	// Name our device classes and add them id which simply means which one is wider
	function getDevice() {
		if     (screen.w > 1024) 	return {class: 'desktop', id: 2};
		else if(screen.w > 736) 	return {class: 'tablet',  id: 1};
		else 					 	return {class: 'mobile',  id: 0};
	}

	function getOrientation() {
		if(screen.w > screen.h) 	return 'landscape';
		else 						return 'portrait';
	}

	function updateScreenSize() {
		screen = getScreenSize();
	}

	function updateDevice() {
		if(lastOrientation !== orientation) orientation = lastOrientation;
		// Switch device only if going from smaller size to bigger.
		// Bigger to smaller is perfectly handled by browsers and doesn't require change and reupload
		if(lastDevice.id > device.id) device = lastDevice;
	}

	function hasSwitched() {
		lastOrientation = getOrientation();
		lastDevice = getDevice();

		if(lastOrientation !== orientation || lastDevice.class !== device.class) return true;
		else return false;
	}


	/*---------------------------------------------------------------------------------*/
	/* Public Methods
	/*---------------------------------------------------------------------------------*/

	// As desired image might be not available we have to evaluate the best match.
	module.getImage = function (imgs) {
		if (imgs['responsive'] === 'false') {
			return (imgs['landscape']['desktop']) ? imgs['landscape']['desktop'] : (imgs['landscape']['external'] ? imgs['landscape']['external'] : '');

		}
		var hasOrientation = !!imgs[orientation];
		// there are only two orientations now and we may get them by string name if both are there
		// or by index of 0 if only one is available. Note Objects has no lexical order so we need to grab key name by its index.
		// Also we may have external file for each orientation which we don't scale internaly so we grab it as it is. If nothing found return an empty string
		var imgOriented = imgs[ (hasOrientation ? orientation : Object.keys(imgs)[0]) ],
			imgExact    = (imgOriented[device.class]) ? imgOriented[device.class] : (imgOriented['external'] ? imgOriented['external'] : '');
		return imgExact;
	}

	module.init = function ($layers) {

		// Run and bind
		run($layers);
		$layers.attr('mk-img-loaded', '');
	};

	module.onResize = function ($layers) {
		$win.on('resize', MK.utils.throttle( 500, function() {
			handleResize($layers);
		}));
	};

	return module;

}(jQuery));


jQuery(function($) {

	var init = function init() {
		// Get All Layers, Excluding Edge Slider and Page Section
		var $allLayers = $('[data-mk-img-set]').filter(function(index) {
			return !$(this).hasClass('mk-section-image') && !$(this).hasClass('background-layer') && !$(this).hasClass('mk-video-section-touch');
		});;

		// Handle the resize
		MK.component.BackgroundImageSetter.onResize($allLayers);

		// Set all the BG Layers
		MK.component.BackgroundImageSetter.init($allLayers);
	}
	init();

	$(window).on('vc_reload', init);

});

/* Blog, Portfolio Audio */
/* -------------------------------------------------------------------- */

function loop_audio_init() {
  if ($.exists('.jp-jplayer')) {
    $('.jp-jplayer.mk-blog-audio').each(function () {
      var $this = $( this );
      MK.core.loadDependencies([ MK.core.path.plugins + 'jquery.jplayer.js' ], function() {
        var css_selector_ancestor = "#" + $this.siblings('.jp-audio').attr('id');
        var ogg_file, mp3_file, mk_theme_js_path;
        ogg_file = $this.attr('data-ogg');
        mp3_file = $this.attr('data-mp3');
        $this.jPlayer({
          ready: function () {
            $this.jPlayer("setMedia", {
              mp3: mp3_file,
              ogg: ogg_file
            });
          },
          play: function () { // To avoid both jPlayers playing together.
            $this.jPlayer("pauseOthers");
          }, 
          swfPath: mk_theme_js_path,
          supplied: "mp3, ogg",
          cssSelectorAncestor: css_selector_ancestor,
          wmode: "window"
        });
      });
    });
  }
}


/* Blog Loop Carousel Shortcode */
/* -------------------------------------------------------------------- */


function mk_blog_carousel() {

  "use strict";

  if (!$.exists('.mk-blog-showcase')) {
    return;
  }
  $('.mk-blog-showcase ul li').each(function () {

    $(this).on('hover', function () {

      $(this).siblings('li').removeClass('mk-blog-first-el').end().addClass('mk-blog-first-el');

    });

  });


}




/**
 * Contact Form
 *
 * Mostly implemented in Vanilla JS instead of jQuery.
 */
function mk_contact_form() {
    "use strict";
    var mkContactForms = document.getElementsByClassName('mk-contact-form');
    if (mkContactForms.length === 0) {
        return;
    }
    var captchaImageHolder = $('.captcha-image-holder');
    var activeClassName = 'is-active';
    var invalidClassName = 'mk-invalid';
    for (var i = 0; i < mkContactForms.length; i++) {
        initializeForm(mkContactForms[i], activeClassName, invalidClassName);
    }
    if (captchaImageHolder.length > 0) {
        $(window).on('load', initializeCaptchas);
    }
    /**
     * Initialize mk forms. e.g add activeClassName for inputs.
     *
     * @param form
     * @param activeClassName
     * @param invalidClassName
     */
    function initializeForm(form, activeClassName, invalidClassName) {
        var inputs = getFormInputs(form);
        for (var i = 0; i < inputs.length; i++) {
            markActiveClass(inputs[i]);
        }
        form.addEventListener('submit', function(e) {
            validateForm(e, invalidClassName);
        });
        /**
         * Set activeClassName for the parent node of the inout
         */
        function setActiveClass() {
            addClass(this.parentNode, activeClassName);
        }
        /**
         * Unset activeClassName from the parent node of the input.
         * We need to unset activeClassName only if the data was empty.
         * e.g. in the line style of the mk-contact-form, we set labels position based on activeClassName.
         */
        function unsetActiveClass() {
            if (this.value === '') {
                removeClass(this.parentNode, activeClassName);
            }
        }
        /**
         * Add event listeners (focus,blur) for input to set and unset activeClassName.
         *
         * @param input
         */
        function markActiveClass(input) {
            input.addEventListener('focus', setActiveClass);
            input.addEventListener('blur', unsetActiveClass);
        }
    }
    /**
     * Validate form when it's submitted. If everything was valid, we with post form in ajax request.
     *
     * @param e
     * @param invalidClassName
     */
    function validateForm(e, invalidClassName) {
        e.preventDefault();
        var form = e.target || e.srcElement;
        var inputs = getFormInputs(form);
        var isValidForm = true;
        var hasCaptchaField = false;
        for (var i = 0; i < inputs.length; i++) {
            var input = inputs[i];
            input.value = String(input.value).trim();
            switch (input.type) {
                case 'hidden':
                    break;
                case 'checkbox':
                    isValidForm = validateCheckBox(input, invalidClassName) && isValidForm;
                    break;
                case 'email':
                    isValidForm = validateEmail(input, invalidClassName) && isValidForm;
                    break;
                case 'textarea':
                    isValidForm = validateText(input, invalidClassName) && isValidForm;
                    break;
                case 'text':
                    /**
                     * Some old browsers such as IE 8 and 9 detect email type as text.
                     * So, we need to extra check for data-type attribute
                     */
                    if (input.dataset.type === 'captcha') {
                        isValidForm = validateText(input, invalidClassName) && isValidForm;
                        hasCaptchaField = true;
                    } else if (input.dataset.type === 'email') {
                        isValidForm = validateEmail(input, invalidClassName) && isValidForm;
                    } else {
                        isValidForm = validateText(input, invalidClassName) && isValidForm;
                    }
                    break;
                default:
                    /**
                     * e.g. validating for radiobox, selectbox and etc.
                     */
                    console.warn('Implement validation for ' + input.name + ':' + input.type);
                    break;
            }
        }
        if (isValidForm) {
            if (hasCaptchaField) {
                validateCaptcha(form, invalidClassName, sendForm);
            } else {
                sendForm(form);
            }
        }
    }
    /**
     * Validate captcha of form. If everything was, we will execute captchaIsValidCallback which as sendForm().
     *
     * @param form
     * @param invalidClassName
     * @param captchaIsValidCallback
     * @returns boolean
     */
    function validateCaptcha(form, invalidClassName, captchaIsValidCallback) {
        var input = form.querySelectorAll('[data-type="captcha"]')[0];
        if (input.value.length === 0) {
            addClass(input, invalidClassName);
            return false;
        } else {
            window.get.captcha(input.value).done(function(data) {
                loadCaptcha();
                input.value = '';
                if (data !== 'ok') {
                    addClass(input, invalidClassName);
                    addClass(input, 'contact-captcha-invalid');
                    removeClass(input, 'contact-captcha-valid');
                    input.placeholder = mk_captcha_invalid_txt;
                } else {
                    removeClass(input, invalidClassName);
                    removeClass(input, 'contact-captcha-invalid');
                    addClass(input, 'contact-captcha-valid');
                    input.placeholder = mk_captcha_correct_txt;
                    captchaIsValidCallback(form);
                }
            });
        }
    }
    /**
     * Send submitted form.
     *
     * @param form
     */
    function sendForm(form) {
        var $form = $(form);
        var data = getFormData(form);
        progressButton.loader($form);
        $.post(jupiterDonutVars.ajaxUrl, data, function(response) {
            var res = JSON.parse(response);
            if (res.action_Status) {
                progressButton.success($form);
                $form.find('.text-input').val('');
                $form.find('textarea').val('');
                $form.find('input[type=checkbox]').attr("checked", false);
                $form.find('.contact-form-message').slideDown().addClass('state-success').html(res.message);
                setTimeout(function() {
                   $form.find('.contact-form-message').slideUp();
                }, 5000);
            } else {
                progressButton.error($form);
                $form.find('.contact-form-message').removeClass('state-success').html(res.message);
            }
        });
    }
    /**
     * Initialize all captcha images for first time. All captcha images is always same. e.g. if we have multiple form,
     * all of them will have the same image.
     * It will also add event listener for '.captcha-change-image' objects to reload the captcha.
     */
    function initializeCaptchas() {
        var captchaChangeImageButtons = document.getElementsByClassName('captcha-change-image');
        for (var i = 0; i < captchaChangeImageButtons.length; i++) {
            captchaChangeImageButtons[i].addEventListener('click', loadCaptcha);
        }
    }
    /**
     * Load captcha text and append the image to captcha container.
     * If it used as a callback, it will prevent default behave of the event.
     * e.g. loading new captcha by click on <a> without changing url.
     */
    function loadCaptcha(e) {
        if (e) {
            e.preventDefault();
        }
        $.post(jupiterDonutVars.ajaxUrl, {
            action: 'mk_create_captcha_image'
        }, appendImage);
        /**
         * The callback function for append or change old image src based on response. T
         * The captchaImageURL is the url of the captcha which is provided in ajax response of mk_create_captcha_image.
         * @param captchaImageURL
         */
        function appendImage(captchaImageURL) {
            if (captchaImageHolder.find('.captcha-image').length === 0) {
                captchaImageHolder.html('<img src="' + captchaImageURL + '" class="captcha-image" alt="captcha txt">');
            } else {
                captchaImageHolder.find('.captcha-image').attr("src", captchaImageURL + '?' + new Date().getTime());
            }
        }
    }
    /**
     * Get form inputs using querySelectorAll().
     * It returns <input> and <textarea> tags. If you need any other tags such as <select>, please update this function.
     *
     * @param form
     * @returns {NodeList}
     */
    function getFormInputs(form) {
        return form.querySelectorAll('input,textarea');
    }
    /**
     * Get data of the form inputs and textareas as a object.
     *
     * @param form
     * @returns {{action: string}}
     */
    function getFormData(form) {
        var data = {
            action: 'mk_contact_form'
        };
        var inputs = getFormInputs(form);
        for (var i = 0; i < inputs.length; i++) {
            data[inputs[i].name] = inputs[i].value;
        }
        return data;
    }
}
/* Ajax Login Form */
/* -------------------------------------------------------------------- */
function mk_login_form() {
    $('form.mk-login-form').each(function() {
        var $this = $(this);
        $this.on('submit', function(e) {
            $('p.mk-login-status', $this).show().text(ajax_login_object.loadingmessage);
            $.ajax({
                type: 'POST',
                dataType: 'json',
                url: ajax_login_object.ajaxurl,
                data: {
                    'action': 'ajaxlogin',
                    'username': $('#username', $this).val(),
                    'password': $('#password', $this).val(),
                    'security': $('#security', $this).val()
                },
                success: function(data) {
                    $('p.mk-login-status', $this).text(data.message);
                    if (data.loggedin === true) {
                        document.location.href = ajax_login_object.redirecturl;
                    }
                }
            });
            e.preventDefault();
        });
    });
}
/* Progress Button */
/* -------------------------------------------------------------------- */
var progressButton = {
    loader: function(form) {
        MK.core.loadDependencies([MK.core.path.plugins + 'tweenmax.js'], function() {
            var $form = form,
                progressBar = $form.find(".mk-progress-button .mk-progress-inner"),
                buttonText = $form.find(".mk-progress-button .mk-progress-button-content"),
                progressButton = new TimelineLite();
            progressButton.to(progressBar, 0, {
                width: "100%",
                scaleX: 0,
                scaleY: 1
            }).to(buttonText, .3, {
                y: -5
            }).to(progressBar, 1.5, {
                scaleX: 1,
                ease: Power2.easeInOut
            }, "-=.1").to(buttonText, .3, {
                y: 0
            }).to(progressBar, .3, {
                scaleY: 0
            });
        });
    },
    success: function(form) {
        MK.core.loadDependencies([MK.core.path.plugins + 'tweenmax.js'], function() {
            var $form = form,
                buttonText = $form.find(".mk-button .mk-progress-button-content, .mk-contact-button .mk-progress-button-content"),
                successIcon = $form.find(".mk-progress-button .state-success"),
                progressButtonSuccess = new TimelineLite({
                    onComplete: hideSuccessMessage
                });
            progressButtonSuccess.to(buttonText, .3, {
                paddingRight: 20,
                ease: Power2.easeInOut
            }, "+=1").to(successIcon, .3, {
                opacity: 1
            }).to(successIcon, 2, {
                opacity: 1
            });

            function hideSuccessMessage() {
                progressButtonSuccess.reverse()
            }
        });
    },
    error: function(form) {
        MK.core.loadDependencies([MK.core.path.plugins + 'tweenmax.js'], function() {
            var $form = form,
                buttonText = $form.find(".mk-button .mk-progress-button-content, .mk-contact-button .mk-progress-button-content"),
                errorIcon = $form.find(".mk-progress-button .state-error"),
                progressButtonError = new TimelineLite({
                    onComplete: hideErrorMessage
                });
            progressButtonError.to(buttonText, .3, {
                paddingRight: 20
            }, "+=1").to(errorIcon, .3, {
                opacity: 1
            }).to(errorIcon, 2, {
                opacity: 1
            });

            function hideErrorMessage() {
                progressButtonError.reverse()
            }
        });
    }
};

/* Event Count Down */
/* -------------------------------------------------------------------- */

function mk_event_countdown() {
  if ($.exists('.mk-event-countdown')) {

    MK.core.loadDependencies([ MK.core.path.plugins + 'jquery.countdown.js' ], function() {

      $('.mk-event-countdown').each(function () {
        var $this = $(this),
          $date = $this.attr('data-date'),
          $offset = $this.attr('data-offset');

        $this.downCount({
          date: $date,
          offset: $offset
        });
      });

    });
  }
}

/* Flexslider init */
/* -------------------------------------------------------------------- */

function mk_flexslider_init() {

  var $lcd = $('.mk-lcd-slideshow'),
      $laptop = $('.mk-laptop-slideshow-shortcode');

  if($lcd.length) $lcd.find('.mk-lcd-image').fadeIn();
  if($laptop.length) $laptop.find(".mk-laptop-image").fadeIn();

  $('.js-flexslider').each(function () {

    if ($(this).parents('.mk-tabs').length || $(this).parents('.mk-accordion').length) {
      $(this).removeData("flexslider");
    }

    var $this = $(this),
      $selector = $this.attr('data-selector'),
      $animation = $this.attr('data-animation'),
      $easing = $this.attr('data-easing'),
      $direction = $this.attr('data-direction'),
      $smoothHeight = $this.attr('data-smoothHeight') == "true" ? true : false,
      $slideshowSpeed = $this.attr('data-slideshowSpeed'),
      $animationSpeed = $this.attr('data-animationSpeed'),
      $controlNav = $this.attr('data-controlNav') == "true" ? true : false,
      $directionNav = $this.attr('data-directionNav') == "true" ? true : false,
      $pauseOnHover = $this.attr('data-pauseOnHover') == "true" ? true : false,
      $isCarousel = $this.attr('data-isCarousel') == "true" ? true : false;


    if ($selector !== undefined) {
      var $selector_class = $selector;
    } else {
      var $selector_class = ".mk-flex-slides > li";
    }

    if ($isCarousel === true) {
      var $itemWidth = parseInt($this.attr('data-itemWidth')),
        $itemMargin = parseInt($this.attr('data-itemMargin')),
        $minItems = parseInt($this.attr('data-minItems')),
        $maxItems = parseInt($this.attr('data-maxItems')),
        $move = parseInt($this.attr('data-move'));
    } else {
      var $itemWidth = $itemMargin = $minItems = $maxItems = $move = 0;
    }

    MK.core.loadDependencies([ MK.core.path.plugins + 'jquery.flexslider.js' ], function() {
      $this.flexslider({
        selector: $selector_class,
        animation: $animation,
        easing: $easing,
        direction: $direction,
        smoothHeight: $smoothHeight,
        slideshow: true, // autoplay
        slideshowSpeed: $slideshowSpeed,
        animationSpeed: $animationSpeed,
        controlNav: $controlNav,
        directionNav: $directionNav,
        pauseOnHover: $pauseOnHover,
        prevText: "",
        nextText: "",
        itemWidth: $itemWidth,
        itemMargin: $itemMargin,
        minItems: $minItems,
        maxItems: $maxItems,
        move: $move
      });
    });

  });

}

(function( $ ) {
	'use strict';

	var val = MK.val;

	MK.component.FullHeight = function( el ) {
		var $window = $( window ),
			$this = $( el ),
			config = $this.data( 'fullheight-config' ),
			container = document.getElementById( 'mk-theme-container' ),
			minH = (config && config.min) ? config.min : 0,
			winH = null,
			height = null,
			update_count = 0,
			testing = MK.utils.getUrlParameter('testing'),
			offset = null;

		// We need to provide height on the same specificity level for workaround to IE bug
		// connect.microsoft.com/IE/feedback/details/802625/min-height-and-flexbox-flex-direction-column-dont-work-together-in-ie-10-11-preview
		// stackoverflow.com/questions/19371626/flexbox-not-centering-vertically-in-ie
		if(MK.utils.browser.name === ('IE' || 'Edge')) $this.css( 'height', '1px' );

		var update = function() {

			if(update_count === 0) {
				winH = $window.height();
				// for correct calculate
				offset = $this.offset().top - 1;
				height = Math.max(minH, winH - val.offsetHeaderHeight( offset ));
				$this.css( 'min-height', height );
				if(testing !== undefined )
				update_count++;
			}

		};

		// TODO remove scroll listener by dynamic offset reader
		var init = function() {
			update();
			$window.on( 'resize', update );
			$window.on( 'scroll', update );
			window.addResizeListener( container, update );
		};

		return {
			init : init
		};
	};

})( jQuery );


(function( $ ) {
	'use strict';

	var core  = MK.core,
		utils = MK.utils,
		path  = MK.core.path;


	MK.ui.FullScreenGallery = function( element, settings ) {
		this.element = element;
		this.config = settings;

		this.isFullScreen = false;
	};


	// preload slick PLUGIN TO USE THIS
	MK.ui.FullScreenGallery.prototype = {
		dom : {
			fullScrBtn 		: '.slick-full-screen',
			exitFullScrBtn 	: '.slick-minimize',
			playBtn 		: '.slick-play',
			pauseBtn 		: '.slick-pause',
			shareBtn 		: '.slick-share',
			socialShare 	: '.slick-social-share',
		    wrapper 		: '.slick-slider-wrapper',
			slider 			: '.slick-slides',
			slides 			: '.slick-slide',
			dots 			: '.slick-dot',
			active 			: '.slick-active',
			hiddenClass 	: 'jupiter-donut-is-hidden',
			dataId 			: 'slick-index'
		},

		tpl: {
			dot  : '<div class="slick-dot"></div>',
			next : '<a href="javascript:;" class="slick-next"> <svg width="33px" height="65px"> <polyline fill="none" stroke="#FFFFFF" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" points=" 0.5,0.5 32.5,32.5 0.5,64.5"/> </svg> </a>',
			prev : '<a href="javascript:;" class="slick-prev"> <svg  width="33px" height="65px"> <polyline fill="none" stroke="#FFFFFF" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" points=" 32.5,64.5 0.5,32.5 32.5,0.5"/> </svg> </a>'
		},

		init : function() {
			var self = this;

			// core.loadDependencies([ path.plugins + 'slick.js' ], function() {
				self.cacheElements();
				self.getViewportSizes();
				self.updateSizes( 'window' );
				self.create();
				// update cache with elements propagated by plugin
				self.updateCacheElements();
				self.createPagination();
				self.bindEvents();
			// });
		},

		create : function() {
			var self = this;

			this.slick = this.$gallery.slick({
		        dots: true,
		        arrows: true,
				infinite: true,
				speed: 300,
				slidesToShow: 1,
				centerMode: true,
				centerPadding: '0px',
				variableWidth: true,
				autoplay: false,
				autoplaySpeed: 3000,
        		useTransform: true,
                prevArrow: self.tpl.prev,
                nextArrow: self.tpl.next,
                customPaging: function(slider, i) {
                    return self.tpl.dot;
                },
			});
		},

		cacheElements : function() {
			this.$window = $( window );
			this.$gallery = $( this.element );

			this.$fullScrBtn = $( this.dom.fullScrBtn );
			this.$exitFullScrBtn = $( this.dom.exitFullScrBtn );
			this.$playBtn = $( this.dom.playBtn );
			this.$pauseBtn = $( this.dom.pauseBtn );
			this.$shareBtn = $( this.dom.shareBtn );
			this.$socialShare = $( this.dom.socialShare );

		    this.$wrapper = $( this.dom.wrapper );
			this.$slider = $( this.dom.slider );
			this.$slides = $( this.dom.slides );
			this.$imgs = this.$slides.find( 'img' );
			// store reference to initial images without slides appended by pugin
			// - needed for creating of pagination
			this.$originalImgs = this.$imgs;
		},

		updateCacheElements : function() {
			this.$slides = $( this.dom.slides );
			this.$imgs = this.$slides.find( 'img' );
			this.$dots = $( this.dom.dots );
		},

		bindEvents : function() {
			var self = this;
			this.$fullScrBtn.on( 'click', this.toFullScreen.bind( this ) );
			this.$exitFullScrBtn.on( 'click', this.exitFullScreen.bind( this ) );
			this.$playBtn.on( 'click', this.play.bind( this ) );
			this.$pauseBtn.on( 'click', this.pause.bind( this ) );
			this.$shareBtn.on( 'click', this.toggleShare.bind( this ) );
			this.$socialShare.on( 'click', 'a', this.socialShare.bind( this ) );
			this.$window.on( 'resize', this.onResize.bind( this ) );
			this.$window.on( 'keydown', function(e) {
				if(e.keyCode === 39) self.$gallery.slick('slickNext');
				if(e.keyCode === 37) self.$gallery.slick('slickPrev');
			});
			$( document ).on( 'fullscreenchange mozfullscreenchange webkitfullscreenchange msfullcreenchange', this.exitFullScreen.bind( this ) );
		},

		getViewportSizes : function() {
			this.screen = {
				w: screen.width,
				h: screen.height
			};
			this.window = {
				w: this.$window.width(),
				h: this.$window.height()
			};
		},

		updateSizes : function( viewport ) {
			this.$wrapper.width( this[ viewport ].w );
			this.$wrapper.height( '100%' );
			this.$imgs.height( '100%');
		},

		createPagination : function() {
			var self = this;
			this.$dots.each( function( i ) {
				var img = self.$originalImgs.eq( i ).attr( 'src' );

				$( this ).css({
					'background-image': 'url('+ img +')'
				});
			});
		},

		play : function(e) {
			e.preventDefault();
			this.$playBtn.addClass( this.dom.hiddenClass );
			this.$pauseBtn.removeClass( this.dom.hiddenClass );
			$( this.element ).slick( 'slickPlay' );
		},

		pause : function(e) {
			e.preventDefault();
			this.$pauseBtn.addClass( this.dom.hiddenClass );
			this.$playBtn.removeClass( this.dom.hiddenClass );
			$( this.element ).slick( 'slickPause' );
		},

		toggleShare : function(e) {
			e.preventDefault();
			this.$socialShare.toggleClass( this.dom.hiddenClass );
		},

		getCurentId : function() {
			return this.$slides.filter( this.dom.active ).data( this.dom.dataId );
		},

		toFullScreen : function() {
			var self = this;

			this.$fullScrBtn.addClass( this.dom.hiddenClass );
			this.$exitFullScrBtn.removeClass( this.dom.hiddenClass );

			this.$slider.hide().fadeIn( 500 );
			utils.launchIntoFullscreen( document.documentElement );
			this.updateSizes( 'screen' );
			$( this.element ).slick( 'slickGoTo', this.getCurentId(), true );

			// Update state with delay so we avoid triggering exitFullScreen fn from
			// fullscreenchange event
			setTimeout( function() {
				self.isFullScreen = true;
			}, 1000);
		},

		exitFullScreen : function() {
			if( this.isFullScreen ) {
				this.$exitFullScrBtn.addClass( this.dom.hiddenClass );
				this.$fullScrBtn.removeClass( this.dom.hiddenClass );

				utils.exitFullscreen();
				this.updateSizes( 'window' );
				$( this.element ).slick( 'slickGoTo', this.getCurentId(), true );

				this.isFullScreen = false;
			}

		},

		onResize : function() {
			this.getViewportSizes();
			this.updateSizes( this.isFullScreen ? 'screen' : 'window' );
			$( this.element ).slick( 'refresh' );
			$( this.element ).slick( 'slickGoTo', this.getCurentId(), true );
			this.updateCacheElements();
			this.createPagination();
		},

		socialShare : function( e ) {
			e.preventDefault();
			var $this = $( e.currentTarget ),
				network = $this.data( 'network' ),
				id = this.config.id,
				url = this.config.url,
				title = this.$wrapper.find( '.slick-title' ).text(),
				name;
				var picture = this.$slides.filter( this.dom.active ).children().first().attr( 'src' );
			switch( network ) {
				case 'facebook':
					url = 'https://www.facebook.com/sharer/sharer.php?picture=' + picture+'&u=' + url + '#id=' + id;
					name = 'Facebook Share';
					break;
				case 'twitter':
					url = 'http://twitter.com/intent/tweet?text=' + url + '#id=' + id;
					name = 'Twitter Share';
					break;
				case 'pinterest':
					url = 'http://pinterest.com/pin/create/bookmarklet/?media=' + picture + '&url=' + url + '&is_video=false&description=' + title;
					// other available link paranmeters: media, description
					name = 'Pinterest Share';
					break;

			}

       		window.open( url, name, "height=380 ,width=660, resizable=0, toolbar=0, menubar=0, status=0, location=0, scrollbars=0" );
		}
	};

})( jQuery );

(function($) {
    'use strict';

    MK.component.Grid = function( el ) {
    	var $container = $(el);
    	var config = $container.data( 'grid-config' );
        var isSlideshow = $container.closest('[data-mk-component="SwipeSlideshow"]').length;
        var miniGridConfig = {
            container: el,
            item: config.item + ':not(.is-hidden)',
            gutter: 0
        };

        var init = function init(){
            // Flags for cancelling usage goes first :
            // Quit early if we discover that Grid is used inside SwipeSlideshow as it brings bug with crossoverriding positioning
            // + grid is not really needed as we have single row all handled by slider.
            // It happens only in woocommerce carousel as of hardcoded Grid in loop-start.php
            if(isSlideshow) return;
	        MK.core.loadDependencies([ MK.core.path.plugins + 'minigrid.js' ], create);
        };

        // Remove el hidden without adding proper class
        var prepareForGrid = function prepareForGrid() {
            var $item = $(this);
            var isHidden = ($item.css('display') === 'none');
            if(isHidden) $item.addClass('is-hidden');
            else $item.removeClass('is-hidden');
        };

        var create = function create() {
            var timer = null;

	        function draw() {
                // Prevent plugin breaking when feeding it with hidden elements
                $container.find(config.item).each( prepareForGrid );
	            minigrid(miniGridConfig);
	        }

            function redraw() {
                if (timer) clearTimeout(timer);
                timer = setTimeout(draw, 100);
            }

            // init
	        draw();
            // If reinitializing drop existing event handler
            $(window).off('resize', redraw);
            $(window).on('resize mk-image-loaded', redraw);
            MK.utils.eventManager.subscribe('item-expanded', redraw);
            MK.utils.eventManager.subscribe('ajaxLoaded', redraw);
            MK.utils.eventManager.subscribe('staticFilter', redraw);
        };

        return {
         	init : init
        };
    };

})(jQuery);








/*!
 * imagesLoaded PACKAGED v4.1.1
 * JavaScript is all like "You images are done yet or what?"
 * MIT License
 */

!function(t,e){"function"==typeof define&&define.amd?define("ev-emitter/ev-emitter",e):"object"==typeof module&&module.exports?module.exports=e():t.EvEmitter=e()}("undefined"!=typeof window?window:this,function(){function t(){}var e=t.prototype;return e.on=function(t,e){if(t&&e){var i=this._events=this._events||{},n=i[t]=i[t]||[];return-1==n.indexOf(e)&&n.push(e),this}},e.once=function(t,e){if(t&&e){this.on(t,e);var i=this._onceEvents=this._onceEvents||{},n=i[t]=i[t]||{};return n[e]=!0,this}},e.off=function(t,e){var i=this._events&&this._events[t];if(i&&i.length){var n=i.indexOf(e);return-1!=n&&i.splice(n,1),this}},e.emitEvent=function(t,e){var i=this._events&&this._events[t];if(i&&i.length){var n=0,o=i[n];e=e||[];for(var r=this._onceEvents&&this._onceEvents[t];o;){var s=r&&r[o];s&&(this.off(t,o),delete r[o]),o.apply(this,e),n+=s?0:1,o=i[n]}return this}},t}),function(t,e){"use strict";"function"==typeof define&&define.amd?define(["ev-emitter/ev-emitter"],function(i){return e(t,i)}):"object"==typeof module&&module.exports?module.exports=e(t,require("ev-emitter")):t.imagesLoaded=e(t,t.EvEmitter)}(window,function(t,e){function i(t,e){for(var i in e)t[i]=e[i];return t}function n(t){var e=[];if(Array.isArray(t))e=t;else if("number"==typeof t.length)for(var i=0;i<t.length;i++)e.push(t[i]);else e.push(t);return e}function o(t,e,r){return this instanceof o?("string"==typeof t&&(t=document.querySelectorAll(t)),this.elements=n(t),this.options=i({},this.options),"function"==typeof e?r=e:i(this.options,e),r&&this.on("always",r),this.getImages(),h&&(this.jqDeferred=new h.Deferred),void setTimeout(function(){this.check()}.bind(this))):new o(t,e,r)}function r(t){this.img=t}function s(t,e){this.url=t,this.element=e,this.img=new Image}var h=t.jQuery,a=t.console;o.prototype=Object.create(e.prototype),o.prototype.options={},o.prototype.getImages=function(){this.images=[],this.elements.forEach(this.addElementImages,this)},o.prototype.addElementImages=function(t){"IMG"==t.nodeName&&this.addImage(t),this.options.background===!0&&this.addElementBackgroundImages(t);var e=t.nodeType;if(e&&d[e]){for(var i=t.querySelectorAll("img"),n=0;n<i.length;n++){var o=i[n];this.addImage(o)}if("string"==typeof this.options.background){var r=t.querySelectorAll(this.options.background);for(n=0;n<r.length;n++){var s=r[n];this.addElementBackgroundImages(s)}}}};var d={1:!0,9:!0,11:!0};return o.prototype.addElementBackgroundImages=function(t){var e=getComputedStyle(t);if(e)for(var i=/url\((['"])?(.*?)\1\)/gi,n=i.exec(e.backgroundImage);null!==n;){var o=n&&n[2];o&&this.addBackground(o,t),n=i.exec(e.backgroundImage)}},o.prototype.addImage=function(t){var e=new r(t);this.images.push(e)},o.prototype.addBackground=function(t,e){var i=new s(t,e);this.images.push(i)},o.prototype.check=function(){function t(t,i,n){setTimeout(function(){e.progress(t,i,n)})}var e=this;return this.progressedCount=0,this.hasAnyBroken=!1,this.images.length?void this.images.forEach(function(e){e.once("progress",t),e.check()}):void this.complete()},o.prototype.progress=function(t,e,i){this.progressedCount++,this.hasAnyBroken=this.hasAnyBroken||!t.isLoaded,this.emitEvent("progress",[this,t,e]),this.jqDeferred&&this.jqDeferred.notify&&this.jqDeferred.notify(this,t),this.progressedCount==this.images.length&&this.complete(),this.options.debug&&a&&a.log("progress: "+i,t,e)},o.prototype.complete=function(){var t=this.hasAnyBroken?"fail":"done";if(this.isComplete=!0,this.emitEvent(t,[this]),this.emitEvent("always",[this]),this.jqDeferred){var e=this.hasAnyBroken?"reject":"resolve";this.jqDeferred[e](this)}},r.prototype=Object.create(e.prototype),r.prototype.check=function(){var t=this.getIsImageComplete();return t?void this.confirm(0!==this.img.naturalWidth,"naturalWidth"):(this.proxyImage=new Image,this.proxyImage.addEventListener("load",this),this.proxyImage.addEventListener("error",this),this.img.addEventListener("load",this),this.img.addEventListener("error",this),void(this.proxyImage.src=this.img.src))},r.prototype.getIsImageComplete=function(){return this.img.complete&&void 0!==this.img.naturalWidth},r.prototype.confirm=function(t,e){this.isLoaded=t,this.emitEvent("progress",[this,this.img,e])},r.prototype.handleEvent=function(t){var e="on"+t.type;this[e]&&this[e](t)},r.prototype.onload=function(){this.confirm(!0,"onload"),this.unbindEvents()},r.prototype.onerror=function(){this.confirm(!1,"onerror"),this.unbindEvents()},r.prototype.unbindEvents=function(){this.proxyImage.removeEventListener("load",this),this.proxyImage.removeEventListener("error",this),this.img.removeEventListener("load",this),this.img.removeEventListener("error",this)},s.prototype=Object.create(r.prototype),s.prototype.check=function(){this.img.addEventListener("load",this),this.img.addEventListener("error",this),this.img.src=this.url;var t=this.getIsImageComplete();t&&(this.confirm(0!==this.img.naturalWidth,"naturalWidth"),this.unbindEvents())},s.prototype.unbindEvents=function(){this.img.removeEventListener("load",this),this.img.removeEventListener("error",this)},s.prototype.confirm=function(t,e){this.isLoaded=t,this.emitEvent("progress",[this,this.element,e])},o.makeJQueryPlugin=function(e){e=e||t.jQuery,e&&(h=e,h.fn.imagesLoaded=function(t,e){var i=new o(this,t,e);return i.jqDeferred.promise(h(this))})},o.makeJQueryPlugin(),o});

!function(s,H,f,w){var K=f("html"),q=f(s),p=f(H),b=f.fancybox=function(){b.open.apply(this,arguments)},J=navigator.userAgent.match(/msie/i),C=null,t=H.createTouch!==w,u=function(a){return a&&a.hasOwnProperty&&a instanceof f},r=function(a){return a&&"string"===f.type(a)},F=function(a){return r(a)&&0<a.indexOf("%")},m=function(a,d){var e=parseInt(a,10)||0;return d&&F(a)&&(e*=b.getViewport()[d]/100),Math.ceil(e)},x=function(a,b){return m(a,b)+"px"};f.extend(b,{version:"2.1.5",defaults:{padding:15,margin:20,width:800,height:600,minWidth:100,minHeight:100,maxWidth:9999,maxHeight:9999,pixelRatio:1,autoSize:!0,autoHeight:!1,autoWidth:!1,autoResize:!0,autoCenter:!t,fitToView:!0,aspectRatio:!1,topRatio:.5,leftRatio:.5,scrolling:"auto",wrapCSS:"",arrows:!0,closeBtn:!0,closeClick:!1,nextClick:!1,mouseWheel:!0,autoPlay:!1,playSpeed:3e3,preload:3,modal:!1,loop:!0,ajax:{dataType:"html",headers:{"X-fancyBox":!0}},iframe:{scrolling:"auto",preload:!0},swf:{wmode:"transparent",allowfullscreen:"true",allowscriptaccess:"always"},keys:{next:{13:"left",34:"up",39:"left",40:"up"},prev:{8:"right",33:"down",37:"right",38:"down"},close:[27],play:[32],toggle:[70]},direction:{next:"left",prev:"right"},scrollOutside:!0,index:0,type:null,href:null,content:null,title:null,tpl:{wrap:'<div class="fancybox-wrap" tabIndex="-1"><div class="fancybox-skin"><div class="fancybox-outer"><div class="fancybox-inner"></div></div></div></div>',image:'<img class="fancybox-image" src="{href}" alt="" />',iframe:'<iframe id="fancybox-frame{rnd}" name="fancybox-frame{rnd}" class="fancybox-iframe" frameborder="0" vspace="0" hspace="0" webkitAllowFullScreen mozallowfullscreen allowFullScreen'+(J?' allowtransparency="true"':"")+"></iframe>",error:'<p class="fancybox-error">The requested content cannot be loaded.<br/>Please try again later.</p>',closeBtn:'<a title="Close" class="fancybox-item fancybox-close" href="javascript:;"></a>',next:'<a title="Next" class="fancybox-nav fancybox-next" href="javascript:;"><span></span></a>',prev:'<a title="Previous" class="fancybox-nav fancybox-prev" href="javascript:;"><span></span></a>'},openEffect:"fade",openSpeed:250,openEasing:"swing",openOpacity:!0,openMethod:"zoomIn",closeEffect:"fade",closeSpeed:250,closeEasing:"swing",closeOpacity:!0,closeMethod:"zoomOut",nextEffect:"elastic",nextSpeed:250,nextEasing:"swing",nextMethod:"changeIn",prevEffect:"elastic",prevSpeed:250,prevEasing:"swing",prevMethod:"changeOut",helpers:{overlay:!0,title:!0},onCancel:f.noop,beforeLoad:f.noop,afterLoad:f.noop,beforeShow:f.noop,afterShow:f.noop,beforeChange:f.noop,beforeClose:f.noop,afterClose:f.noop},group:{},opts:{},previous:null,coming:null,current:null,isActive:!1,isOpen:!1,isOpened:!1,wrap:null,skin:null,outer:null,inner:null,player:{timer:null,isActive:!1},ajaxLoad:null,imgPreload:null,transitions:{},helpers:{},open:function(a,d){if(a&&(f.isPlainObject(d)||(d={}),!1!==b.close(!0)))return f.isArray(a)||(a=u(a)?f(a).get():[a]),f.each(a,function(e,c){var l={},g,h,k,n,m;"object"===f.type(c)&&(c.nodeType&&(c=f(c)),u(c)?(l={href:c.data("fancybox-href")||c.attr("href"),title:f("<div/>").text(c.data("fancybox-title")||c.attr("title")).html(),isDom:!0,element:c},f.metadata&&f.extend(!0,l,c.metadata())):l=c),g=d.href||l.href||(r(c)?c:null),h=d.title!==w?d.title:l.title||"",n=(k=d.content||l.content)?"html":d.type||l.type,!n&&l.isDom&&((n=c.data("fancybox-type"))||(n=(n=c.prop("class").match(/fancybox\.(\w+)/))?n[1]:null)),r(g)&&(n||(b.isImage(g)?n="image":b.isSWF(g)?n="swf":"#"===g.charAt(0)?n="inline":r(c)&&(n="html",k=c)),"ajax"===n&&(m=g.split(/\s+/,2),g=m.shift(),m=m.shift())),k||("inline"===n?g?k=f(r(g)?g.replace(/.*(?=#[^\s]+$)/,""):g):l.isDom&&(k=c):"html"===n?k=g:n||g||!l.isDom||(n="inline",k=c)),f.extend(l,{href:g,type:n,content:k,title:h,selector:m}),a[e]=l}),b.opts=f.extend(!0,{},b.defaults,d),d.keys!==w&&(b.opts.keys=!!d.keys&&f.extend({},b.defaults.keys,d.keys)),b.group=a,b._start(b.opts.index)},cancel:function(){var a=b.coming;a&&!1===b.trigger("onCancel")||(b.hideLoading(),a&&(b.ajaxLoad&&b.ajaxLoad.abort(),b.ajaxLoad=null,b.imgPreload&&(b.imgPreload.onload=b.imgPreload.onerror=null),a.wrap&&a.wrap.stop(!0,!0).trigger("onReset").remove(),b.coming=null,b.current||b._afterZoomOut(a)))},close:function(a){b.cancel(),!1!==b.trigger("beforeClose")&&(b.unbindEvents(),b.isActive&&(b.isOpen&&!0!==a?(b.isOpen=b.isOpened=!1,b.isClosing=!0,f(".fancybox-item, .fancybox-nav").remove(),b.wrap.stop(!0,!0).removeClass("fancybox-opened"),b.transitions[b.current.closeMethod]()):(f(".fancybox-wrap").stop(!0).trigger("onReset").remove(),b._afterZoomOut())))},play:function(a){var d=function(){clearTimeout(b.player.timer)},e=function(){d(),b.current&&b.player.isActive&&(b.player.timer=setTimeout(b.next,b.current.playSpeed))},c=function(){d(),p.unbind(".player"),b.player.isActive=!1,b.trigger("onPlayEnd")};!0===a||!b.player.isActive&&!1!==a?b.current&&(b.current.loop||b.current.index<b.group.length-1)&&(b.player.isActive=!0,p.bind({"onCancel.player beforeClose.player":c,"onUpdate.player":e,"beforeLoad.player":d}),e(),b.trigger("onPlayStart")):c()},next:function(a){var d=b.current;d&&(r(a)||(a=d.direction.next),b.jumpto(d.index+1,a,"next"))},prev:function(a){var d=b.current;d&&(r(a)||(a=d.direction.prev),b.jumpto(d.index-1,a,"prev"))},jumpto:function(a,d,e){var c=b.current;c&&(a=m(a),b.direction=d||c.direction[a>=c.index?"next":"prev"],b.router=e||"jumpto",c.loop&&(0>a&&(a=c.group.length+a%c.group.length),a%=c.group.length),c.group[a]!==w&&(b.cancel(),b._start(a)))},reposition:function(a,d){var e=b.current,c=e?e.wrap:null,l;c&&(l=b._getPosition(d),a&&"scroll"===a.type?(delete l.position,c.stop(!0,!0).animate(l,200)):(c.css(l),e.pos=f.extend({},e.dim,l)))},update:function(a){var d=a&&a.originalEvent&&a.originalEvent.type,e=!d||"orientationchange"===d;e&&(clearTimeout(C),C=null),b.isOpen&&!C&&(C=setTimeout(function(){var c=b.current;c&&!b.isClosing&&(b.wrap.removeClass("fancybox-tmp"),(e||"load"===d||"resize"===d&&c.autoResize)&&b._setDimension(),"scroll"===d&&c.canShrink||b.reposition(a),b.trigger("onUpdate"),C=null)},e&&!t?0:300))},toggle:function(a){b.isOpen&&(b.current.fitToView="boolean"===f.type(a)?a:!b.current.fitToView,t&&(b.wrap.removeAttr("style").addClass("fancybox-tmp"),b.trigger("onUpdate")),b.update())},hideLoading:function(){p.unbind(".loading"),f("#fancybox-loading").remove()},showLoading:function(){var a,d;b.hideLoading(),a=f('<div id="fancybox-loading"><div></div></div>').click(b.cancel).appendTo("body"),p.bind("keydown.loading",function(a){27===(a.which||a.keyCode)&&(a.preventDefault(),b.cancel())}),b.defaults.fixed||(d=b.getViewport(),a.css({position:"absolute",top:.5*d.h+d.y,left:.5*d.w+d.x})),b.trigger("onLoading")},getViewport:function(){var a=b.current&&b.current.locked||!1,d={x:q.scrollLeft(),y:q.scrollTop()};return a&&a.length?(d.w=a[0].clientWidth,d.h=a[0].clientHeight):(d.w=t&&s.innerWidth?s.innerWidth:q.width(),d.h=t&&s.innerHeight?s.innerHeight:q.height()),d},unbindEvents:function(){b.wrap&&u(b.wrap)&&b.wrap.unbind(".fb"),p.unbind(".fb"),q.unbind(".fb")},bindEvents:function(){var a=b.current,d;a&&(q.bind("orientationchange.fb"+(t?"":" resize.fb")+(a.autoCenter&&!a.locked?" scroll.fb":""),b.update),(d=a.keys)&&p.bind("keydown.fb",function(e){var c=e.which||e.keyCode,l=e.target||e.srcElement;if(27===c&&b.coming)return!1;e.ctrlKey||e.altKey||e.shiftKey||e.metaKey||l&&(l.type||f(l).is("[contenteditable]"))||f.each(d,function(d,l){return 1<a.group.length&&l[c]!==w?(b[d](l[c]),e.preventDefault(),!1):-1<f.inArray(c,l)?(b[d](),e.preventDefault(),!1):void 0})}),f.fn.mousewheel&&a.mouseWheel&&b.wrap.bind("mousewheel.fb",function(d,c,l,g){for(var h=f(d.target||null),k=!1;h.length&&!(k||h.is(".fancybox-skin")||h.is(".fancybox-wrap"));)k=h[0]&&!(h[0].style.overflow&&"hidden"===h[0].style.overflow)&&(h[0].clientWidth&&h[0].scrollWidth>h[0].clientWidth||h[0].clientHeight&&h[0].scrollHeight>h[0].clientHeight),h=f(h).parent();0!==c&&!k&&1<b.group.length&&!a.canShrink&&(0<g||0<l?b.prev(0<g?"down":"left"):(0>g||0>l)&&b.next(0>g?"up":"right"),d.preventDefault())}))},trigger:function(a,d){var e,c=d||b.coming||b.current;if(c){if(f.isFunction(c[a])&&(e=c[a].apply(c,Array.prototype.slice.call(arguments,1))),!1===e)return!1;c.helpers&&f.each(c.helpers,function(d,e){e&&b.helpers[d]&&f.isFunction(b.helpers[d][a])&&b.helpers[d][a](f.extend(!0,{},b.helpers[d].defaults,e),c)})}p.trigger(a)},isImage:function(a){return r(a)&&a.match(/(^data:image\/.*,)|(\.(jp(e|g|eg)|gif|png|bmp|webp|svg)((\?|#).*)?$)/i)},isSWF:function(a){return r(a)&&a.match(/\.(swf)((\?|#).*)?$/i)},_start:function(a){var d={},e,c;if(a=m(a),!(e=b.group[a]||null))return!1;if(d=f.extend(!0,{},b.opts,e),e=d.margin,c=d.padding,"number"===f.type(e)&&(d.margin=[e,e,e,e]),"number"===f.type(c)&&(d.padding=[c,c,c,c]),d.modal&&f.extend(!0,d,{closeBtn:!1,closeClick:!1,nextClick:!1,arrows:!1,mouseWheel:!1,keys:null,helpers:{overlay:{closeClick:!1}}}),d.autoSize&&(d.autoWidth=d.autoHeight=!0),"auto"===d.width&&(d.autoWidth=!0),"auto"===d.height&&(d.autoHeight=!0),d.group=b.group,d.index=a,b.coming=d,!1===b.trigger("beforeLoad"))b.coming=null;else{if(c=d.type,e=d.href,!c)return b.coming=null,!(!b.current||!b.router||"jumpto"===b.router)&&(b.current.index=a,b[b.router](b.direction));if(b.isActive=!0,"image"!==c&&"swf"!==c||(d.autoHeight=d.autoWidth=!1,d.scrolling="visible"),"image"===c&&(d.aspectRatio=!0),"iframe"===c&&t&&(d.scrolling="scroll"),d.wrap=f(d.tpl.wrap).addClass("fancybox-"+(t?"mobile":"desktop")+" fancybox-type-"+c+" fancybox-tmp "+d.wrapCSS).appendTo(d.parent||"body"),f.extend(d,{skin:f(".fancybox-skin",d.wrap),outer:f(".fancybox-outer",d.wrap),inner:f(".fancybox-inner",d.wrap)}),f.each(["Top","Right","Bottom","Left"],function(a,b){d.skin.css("padding"+b,x(d.padding[a]))}),b.trigger("onReady"),"inline"===c||"html"===c){if(!d.content||!d.content.length)return b._error("content")}else if(!e)return b._error("href");"image"===c?b._loadImage():"ajax"===c?b._loadAjax():"iframe"===c?b._loadIframe():b._afterLoad()}},_error:function(a){f.extend(b.coming,{type:"html",autoWidth:!0,autoHeight:!0,minWidth:0,minHeight:0,scrolling:"no",hasError:a,content:b.coming.tpl.error}),b._afterLoad()},_loadImage:function(){var a=b.imgPreload=new Image;a.onload=function(){this.onload=this.onerror=null,b.coming.width=this.width/b.opts.pixelRatio,b.coming.height=this.height/b.opts.pixelRatio,b._afterLoad()},a.onerror=function(){this.onload=this.onerror=null,b._error("image")},a.src=b.coming.href,!0!==a.complete&&b.showLoading()},_loadAjax:function(){var a=b.coming;b.showLoading(),b.ajaxLoad=f.ajax(f.extend({},a.ajax,{url:a.href,error:function(a,e){b.coming&&"abort"!==e?b._error("ajax",a):b.hideLoading()},success:function(d,e){"success"===e&&(a.content=d,b._afterLoad())}}))},_loadIframe:function(){var a=b.coming,d=f(a.tpl.iframe.replace(/\{rnd\}/g,(new Date).getTime())).attr("scrolling",t?"auto":a.iframe.scrolling).attr("src",a.href);f(a.wrap).bind("onReset",function(){try{f(this).find("iframe").hide().attr("src","//about:blank").end().empty()}catch(a){}}),a.iframe.preload&&(b.showLoading(),d.one("load",function(){f(this).data("ready",1),t||f(this).bind("load.fb",b.update),f(this).parents(".fancybox-wrap").width("100%").removeClass("fancybox-tmp").show(),b._afterLoad()})),a.content=d.appendTo(a.inner),a.iframe.preload||b._afterLoad()},_preloadImages:function(){var a=b.group,d=b.current,e=a.length,c=d.preload?Math.min(d.preload,e-1):0,f,g;for(g=1;g<=c;g+=1)f=a[(d.index+g)%e],"image"===f.type&&f.href&&((new Image).src=f.href)},_afterLoad:function(){var a=b.coming,d=b.current,e,c,l,g,h;if(b.hideLoading(),a&&!1!==b.isActive)if(!1===b.trigger("afterLoad",a,d))a.wrap.stop(!0).trigger("onReset").remove(),b.coming=null;else{switch(d&&(b.trigger("beforeChange",d),d.wrap.stop(!0).removeClass("fancybox-opened").find(".fancybox-item, .fancybox-nav").remove()),b.unbindEvents(),e=a.content,c=a.type,l=a.scrolling,f.extend(b,{wrap:a.wrap,skin:a.skin,outer:a.outer,inner:a.inner,current:a,previous:d}),g=a.href,c){case"inline":case"ajax":case"html":a.selector?e=f("<div>").html(e).find(a.selector):u(e)&&(e.data("fancybox-placeholder")||e.data("fancybox-placeholder",f('<div class="fancybox-placeholder"></div>').insertAfter(e).hide()),e=e.show().detach(),a.wrap.bind("onReset",function(){f(this).find(e).length&&e.hide().replaceAll(e.data("fancybox-placeholder")).data("fancybox-placeholder",!1)}));break;case"image":e=a.tpl.image.replace(/\{href\}/g,g);break;case"swf":e='<object id="fancybox-swf" classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" width="100%" height="100%"><param name="movie" value="'+g+'"></param>',h="",f.each(a.swf,function(a,b){e+='<param name="'+a+'" value="'+b+'"></param>',h+=" "+a+'="'+b+'"'}),e+='<embed src="'+g+'" type="application/x-shockwave-flash" width="100%" height="100%"'+h+"></embed></object>"}u(e)&&e.parent().is(a.inner)||a.inner.append(e),b.trigger("beforeShow"),a.inner.css("overflow","yes"===l?"scroll":"no"===l?"hidden":l),b._setDimension(),b.reposition(),b.isOpen=!1,b.coming=null,b.bindEvents(),b.isOpened?d.prevMethod&&b.transitions[d.prevMethod]():f(".fancybox-wrap").not(a.wrap).stop(!0).trigger("onReset").remove(),b.transitions[b.isOpened?a.nextMethod:a.openMethod](),b._preloadImages()}},_setDimension:function(){var a=b.getViewport(),d=0,e=!1,c=!1,e=b.wrap,l=b.skin,g=b.inner,h=b.current,c=h.width,k=h.height,n=h.minWidth,v=h.minHeight,p=h.maxWidth,q=h.maxHeight,t=h.scrolling,r=h.scrollOutside?h.scrollbarWidth:0,y=h.margin,z=m(y[1]+y[3]),s=m(y[0]+y[2]),w,A,u,D,B,G,C,E,I;if(e.add(l).add(g).width("auto").height("auto").removeClass("fancybox-tmp"),y=m(l.outerWidth(!0)-l.width()),w=m(l.outerHeight(!0)-l.height()),A=z+y,u=s+w,D=F(c)?(a.w-A)*m(c)/100:c,B=F(k)?(a.h-u)*m(k)/100:k,"iframe"===h.type){if(I=h.content,h.autoHeight&&1===I.data("ready"))try{I[0].contentWindow.document.location&&(g.width(D).height(9999),G=I.contents().find("body"),r&&G.css("overflow-x","hidden"),B=G.outerHeight(!0))}catch(H){}}else(h.autoWidth||h.autoHeight)&&(g.addClass("fancybox-tmp"),h.autoWidth||g.width(D),h.autoHeight||g.height(B),h.autoWidth&&(D=g.width()),h.autoHeight&&(B=g.height()),g.removeClass("fancybox-tmp"));if(c=m(D),k=m(B),E=D/B,n=m(F(n)?m(n,"w")-A:n),p=m(F(p)?m(p,"w")-A:p),v=m(F(v)?m(v,"h")-u:v),q=m(F(q)?m(q,"h")-u:q),G=p,C=q,h.fitToView&&(p=Math.min(a.w-A,p),q=Math.min(a.h-u,q)),A=a.w-z,s=a.h-s,h.aspectRatio?(c>p&&(c=p,k=m(c/E)),k>q&&(k=q,c=m(k*E)),c<n&&(c=n,k=m(c/E)),k<v&&(k=v,c=m(k*E))):(c=Math.max(n,Math.min(c,p)),h.autoHeight&&"iframe"!==h.type&&(g.width(c),k=g.height()),k=Math.max(v,Math.min(k,q))),h.fitToView)if(g.width(c).height(k),e.width(c+y),a=e.width(),z=e.height(),h.aspectRatio)for(;(a>A||z>s)&&c>n&&k>v&&!(19<d++);)k=Math.max(v,Math.min(q,k-10)),c=m(k*E),c<n&&(c=n,k=m(c/E)),c>p&&(c=p,k=m(c/E)),g.width(c).height(k),e.width(c+y),a=e.width(),z=e.height();else c=Math.max(n,Math.min(c,c-(a-A))),k=Math.max(v,Math.min(k,k-(z-s)));r&&"auto"===t&&k<B&&c+y+r<A&&(c+=r),g.width(c).height(k),e.width(c+y),a=e.width(),z=e.height(),e=(a>A||z>s)&&c>n&&k>v,c=h.aspectRatio?c<G&&k<C&&c<D&&k<B:(c<G||k<C)&&(c<D||k<B),f.extend(h,{dim:{width:x(a),height:x(z)},origWidth:D,origHeight:B,canShrink:e,canExpand:c,wPadding:y,hPadding:w,wrapSpace:z-l.outerHeight(!0),skinSpace:l.height()-k}),!I&&h.autoHeight&&k>v&&k<q&&!c&&g.height("auto")},_getPosition:function(a){var d=b.current,e=b.getViewport(),c=d.margin,f=b.wrap.width()+c[1]+c[3],g=b.wrap.height()+c[0]+c[2],c={position:"absolute",top:c[0],left:c[3]};return d.autoCenter&&d.fixed&&!a&&g<=e.h&&f<=e.w?c.position="fixed":d.locked||(c.top+=e.y,c.left+=e.x),c.top=x(Math.max(c.top,c.top+(e.h-g)*d.topRatio)),c.left=x(Math.max(c.left,c.left+(e.w-f)*d.leftRatio)),c},_afterZoomIn:function(){var a=b.current;a&&(b.isOpen=b.isOpened=!0,b.wrap.css("overflow","visible").addClass("fancybox-opened"),b.update(),(a.closeClick||a.nextClick&&1<b.group.length)&&b.inner.css("cursor","pointer").bind("click.fb",function(d){f(d.target).is("a")||f(d.target).parent().is("a")||(d.preventDefault(),b[a.closeClick?"close":"next"]())}),a.closeBtn&&f(a.tpl.closeBtn).appendTo(b.skin).bind("click.fb",function(a){a.preventDefault(),b.close()}),a.arrows&&1<b.group.length&&((a.loop||0<a.index)&&f(a.tpl.prev).appendTo(b.outer).bind("click.fb",b.prev),(a.loop||a.index<b.group.length-1)&&f(a.tpl.next).appendTo(b.outer).bind("click.fb",b.next)),b.trigger("afterShow"),a.loop||a.index!==a.group.length-1?b.opts.autoPlay&&!b.player.isActive&&(b.opts.autoPlay=!1,b.play(!0)):b.play(!1))},_afterZoomOut:function(a){a=a||b.current,f(".fancybox-wrap").trigger("onReset").remove(),f.extend(b,{group:{},opts:{},router:!1,current:null,isActive:!1,isOpened:!1,isOpen:!1,isClosing:!1,wrap:null,skin:null,outer:null,inner:null}),b.trigger("afterClose",a)}}),b.transitions={getOrigPosition:function(){var a=b.current,d=a.element,e=a.orig,c={},f=50,g=50,h=a.hPadding,k=a.wPadding,n=b.getViewport();return!e&&a.isDom&&d.is(":visible")&&(e=d.find("img:first"),e.length||(e=d)),u(e)?(c=e.offset(),e.is("img")&&(f=e.outerWidth(),g=e.outerHeight())):(c.top=n.y+(n.h-g)*a.topRatio,c.left=n.x+(n.w-f)*a.leftRatio),("fixed"===b.wrap.css("position")||a.locked)&&(c.top-=n.y,c.left-=n.x),c={top:x(c.top-h*a.topRatio),left:x(c.left-k*a.leftRatio),width:x(f+k),height:x(g+h)}},step:function(a,d){var e,c,f=d.prop;c=b.current;var g=c.wrapSpace,h=c.skinSpace;"width"!==f&&"height"!==f||(e=d.end===d.start?1:(a-d.start)/(d.end-d.start),b.isClosing&&(e=1-e),c="width"===f?c.wPadding:c.hPadding,c=a-c,b.skin[f](m("width"===f?c:c-g*e)),b.inner[f](m("width"===f?c:c-g*e-h*e)))},zoomIn:function(){var a=b.current,d=a.pos,e=a.openEffect,c="elastic"===e,l=f.extend({opacity:1},d);delete l.position,c?(d=this.getOrigPosition(),a.openOpacity&&(d.opacity=.1)):"fade"===e&&(d.opacity=.1),b.wrap.css(d).animate(l,{duration:"none"===e?0:a.openSpeed,easing:a.openEasing,step:c?this.step:null,complete:b._afterZoomIn})},zoomOut:function(){var a=b.current,d=a.closeEffect,e="elastic"===d,c={opacity:.1};e&&(c=this.getOrigPosition(),a.closeOpacity&&(c.opacity=.1)),b.wrap.animate(c,{duration:"none"===d?0:a.closeSpeed,easing:a.closeEasing,step:e?this.step:null,complete:b._afterZoomOut})},changeIn:function(){var a=b.current,d=a.nextEffect,e=a.pos,c={opacity:1},f=b.direction,g;e.opacity=.1,"elastic"===d&&(g="down"===f||"up"===f?"top":"left","down"===f||"right"===f?(e[g]=x(m(e[g])-200),c[g]="+=200px"):(e[g]=x(m(e[g])+200),c[g]="-=200px")),"none"===d?b._afterZoomIn():b.wrap.css(e).animate(c,{duration:a.nextSpeed,easing:a.nextEasing,complete:b._afterZoomIn})},changeOut:function(){var a=b.previous,d=a.prevEffect,e={opacity:.1},c=b.direction;"elastic"===d&&(e["down"===c||"up"===c?"top":"left"]=("up"===c||"left"===c?"-":"+")+"=200px"),a.wrap.animate(e,{duration:"none"===d?0:a.prevSpeed,easing:a.prevEasing,complete:function(){f(this).trigger("onReset").remove()}})}},b.helpers.overlay={defaults:{closeClick:!0,speedOut:200,showEarly:!0,css:{},locked:!t,fixed:!0},overlay:null,fixed:!1,el:f("html"),create:function(a){var d;a=f.extend({},this.defaults,a),this.overlay&&this.close(),d=b.coming?b.coming.parent:a.parent,this.overlay=f('<div class="fancybox-overlay"></div>').appendTo(d&&d.lenth?d:"body"),this.fixed=!1,a.fixed&&b.defaults.fixed&&(this.overlay.addClass("fancybox-overlay-fixed"),this.fixed=!0)},open:function(a){var d=this;a=f.extend({},this.defaults,a),this.overlay?this.overlay.unbind(".overlay").width("auto").height("auto"):this.create(a),this.fixed||(q.bind("resize.overlay",f.proxy(this.update,this)),this.update()),a.closeClick&&this.overlay.bind("click.overlay",function(a){if(f(a.target).hasClass("fancybox-overlay"))return b.isActive?b.close():d.close(),!1}),this.overlay.css(a.css).show()},close:function(){q.unbind("resize.overlay"),this.el.hasClass("fancybox-lock")&&(f(".fancybox-margin").removeClass("fancybox-margin"),this.el.removeClass("fancybox-lock"),q.scrollTop(this.scrollV).scrollLeft(this.scrollH)),f(".fancybox-overlay").remove().hide(),f.extend(this,{overlay:null,fixed:!1})},update:function(){var a="100%",b;this.overlay.width(a).height("100%"),J?(b=Math.max(H.documentElement.offsetWidth,H.body.offsetWidth),p.width()>b&&(a=p.width())):p.width()>q.width()&&(a=p.width()),this.overlay.width(a).height(p.height())},onReady:function(a,b){var e=this.overlay;f(".fancybox-overlay").stop(!0,!0),e||this.create(a),a.locked&&this.fixed&&b.fixed&&(b.locked=this.overlay.append(b.wrap),b.fixed=!1),!0===a.showEarly&&this.beforeShow.apply(this,arguments)},beforeShow:function(a,b){b.locked&&!this.el.hasClass("fancybox-lock")&&(!1!==this.fixPosition&&f("*").filter(function(){return"fixed"===f(this).css("position")&&!f(this).hasClass("fancybox-overlay")&&!f(this).hasClass("fancybox-wrap")}).addClass("fancybox-margin"),this.el.addClass("fancybox-margin"),this.scrollV=q.scrollTop(),this.scrollH=q.scrollLeft(),this.el.addClass("fancybox-lock"),q.scrollTop(this.scrollV).scrollLeft(this.scrollH)),this.open(a)},onUpdate:function(){this.fixed||this.update()},afterClose:function(a){this.overlay&&!b.coming&&this.overlay.fadeOut(a.speedOut,f.proxy(this.close,this))}},b.helpers.title={defaults:{type:"float",position:"bottom"},beforeShow:function(a){var d=b.current,e=d.title,c=a.type;if(f.isFunction(e)&&(e=e.call(d.element,d)),r(e)&&""!==f.trim(e)){switch(d=f('<div class="fancybox-title fancybox-title-'+c+'-wrap">'+e+"</div>"),c){case"inside":c=b.skin;break;case"outside":c=b.wrap;break;case"over":c=b.inner;break;default:c=b.skin,d.appendTo("body"),J&&d.width(d.width()),d.wrapInner('<span class="child"></span>'),b.current.margin[2]+=Math.abs(m(d.css("margin-bottom")))}d["top"===a.position?"prependTo":"appendTo"](c)}}},f.fn.fancybox=function(a){var d,e=f(this),c=this.selector||"",l=function(g){var h=f(this).blur(),k=d,l,m;g.ctrlKey||g.altKey||g.shiftKey||g.metaKey||h.is(".fancybox-wrap")||(l=a.groupAttr||"data-fancybox-group",m=h.attr(l),m||(l="rel",m=h.get(0)[l]),m&&""!==m&&"nofollow"!==m&&(h=c.length?f(c):e,h=h.filter("["+l+'="'+m+'"]'),k=h.index(this)),a.index=k,!1!==b.open(h,a)&&g.preventDefault())};return a=a||{},d=a.index||0,c&&!1!==a.live?p.undelegate(c,"click.fb-start").delegate(c+":not('.fancybox-item, .fancybox-nav')","click.fb-start",l):e.unbind("click.fb-start").bind("click.fb-start",l),this.filter("[data-fancybox-start=1]").trigger("click"),this},p.ready(function(){var a,d;f.scrollbarWidth===w&&(f.scrollbarWidth=function(){var a=f('<div style="width:50px;height:50px;overflow:auto"><div/></div>').appendTo("body"),b=a.children(),b=b.innerWidth()-b.height(99).innerWidth();return a.remove(),b}),f.support.fixedPosition===w&&(f.support.fixedPosition=function(){var a=f('<div style="position:fixed;top:20px;"></div>').appendTo("body"),b=20===a[0].offsetTop||15===a[0].offsetTop;return a.remove(),b}()),f.extend(b.defaults,{scrollbarWidth:f.scrollbarWidth(),fixed:f.support.fixedPosition,parent:f("body")}),a=f(s).width(),K.addClass("fancybox-lock-test"),d=f(s).width(),K.removeClass("fancybox-lock-test"),f("<style type='text/css'>.fancybox-margin{margin-right:"+(d-a)+"px;}</style>").appendTo("head")})}(window,document,jQuery),function($){"use strict";var format=function(url,rez,params){return params=params||"","object"===$.type(params)&&(params=$.param(params,!0)),$.each(rez,function(key,value){url=url.replace("$"+key,value||"")}),params.length&&(url+=(url.indexOf("?")>0?"&":"?")+params),url};$.fancybox.helpers.media={defaults:{youtube:{matcher:/(youtube\.com|youtu\.be|youtube-nocookie\.com)\/(watch\?v=|v\/|u\/|embed\/?)?(videoseries\?list=(.*)|[\w-]{11}|\?listType=(.*)&list=(.*)).*/i,params:{autoplay:1,autohide:1,fs:1,rel:0,hd:1,wmode:"opaque",enablejsapi:1},type:"iframe",url:"//www.youtube.com/embed/$3"},vimeo:{matcher:/(?:vimeo(?:pro)?.com)\/(?:[^\d]+)?(\d+)(?:.*)/,params:{autoplay:1,hd:1,show_title:1,show_byline:1,show_portrait:0,fullscreen:1},type:"iframe",url:"//player.vimeo.com/video/$1"},metacafe:{matcher:/metacafe.com\/(?:watch|fplayer)\/([\w\-]{1,10})/,params:{autoPlay:"yes"},type:"swf",url:function(rez,params,obj){return obj.swf.flashVars="playerVars="+$.param(params,!0),"//www.metacafe.com/fplayer/"+rez[1]+"/.swf"}},dailymotion:{matcher:/dailymotion.com\/video\/(.*)\/?(.*)/,params:{additionalInfos:0,autoStart:1},type:"swf",url:"//www.dailymotion.com/swf/video/$1"},twitvid:{matcher:/twitvid\.com\/([a-zA-Z0-9_\-\?\=]+)/i,params:{autoplay:0},type:"iframe",url:"//www.twitvid.com/embed.php?guid=$1"},twitpic:{matcher:/twitpic\.com\/(?!(?:place|photos|events)\/)([a-zA-Z0-9\?\=\-]+)/i,type:"image",url:"//twitpic.com/show/full/$1/"},instagram:{matcher:/(instagr\.am|instagram\.com)\/p\/([a-zA-Z0-9_\-]+)\/?/i,type:"image",url:"//$1/p/$2/media/?size=l"},google_maps:{matcher:/maps\.google\.([a-z]{2,3}(\.[a-z]{2})?)\/(\?ll=|maps\?)(.*)/i,type:"iframe",url:function(rez){return"//maps.google."+rez[1]+"/"+rez[3]+rez[4]+"&output="+(rez[4].indexOf("layer=c")>0?"svembed":"embed")}}},beforeLoad:function(opts,obj){var url=obj.href||"",type=!1,what,item,rez,params;for(what in opts)if(opts.hasOwnProperty(what)&&(item=opts[what],rez=url.match(item.matcher))){type=item.type,params=$.extend(!0,{},item.params,obj[what]||($.isPlainObject(opts[what])?opts[what].params:null)),url="function"===$.type(item.url)?item.url.call(this,rez,params,obj):format(item.url,rez,params);break}type&&(obj.href=url,obj.type=type,obj.autoHeight=!1)}}}(jQuery);
/* jQuery fancybox lightbox */
/* -------------------------------------------------------------------- */
function mk_lightbox_init() {

var $lightbox = $(".mk-lightbox");

  $lightbox.fancybox({
            padding: 15,
            margin: 15, 

            width: 800,
            height: 600,
            minWidth: 100,
            minHeight: 100,
            maxWidth: 9999,
            maxHeight: 9999,
            pixelRatio: 1, // Set to 2 for retina display support

            autoSize: true,
            autoHeight: false,
            autoWidth: false,

            autoResize: true,
            fitToView: true,
            aspectRatio: false,
            topRatio: 0.5,
            leftRatio: 0.5,

            scrolling: 'auto', // 'auto', 'yes' or 'no'
            wrapCSS: '',

            arrows: true,
            closeBtn: true,
            closeClick: false,
            nextClick: false,
            mouseWheel: true,
            autoPlay: false,
            playSpeed: 3000,
            preload: 3,
            modal: false,
            loop: true,
            // Properties for each animation type
            // Opening fancyBox
            openEffect: 'fade', // 'elastic', 'fade' or 'none'
            openSpeed: 200,
            openEasing: 'swing',
            openOpacity: true,
            openMethod: 'zoomIn',

            // Closing fancyBox
            closeEffect: 'fade', // 'elastic', 'fade' or 'none'
            closeSpeed: 200,
            closeEasing: 'swing',
            closeOpacity: true,
            closeMethod: 'zoomOut',

            // Changing next gallery item
            nextEffect: 'none', // 'elastic', 'fade' or 'none'
            nextSpeed: 350,
            nextEasing: 'swing',
            nextMethod: 'changeIn',

            // Changing previous gallery item
            prevEffect: 'none', // 'elastic', 'fade' or 'none'
            prevSpeed: 350,
            prevEasing: 'swing',
            prevMethod: 'changeOut',
            helpers : {
                media : {},
                overlay: {
                  locked: true 
                }
            },

            tpl: {
                wrap: '<div class="fancybox-wrap" tabIndex="-1"><div class="fancybox-skin"><div class="fancybox-outer"><div class="fancybox-inner"></div></div></div></div>',
                image: '<img class="fancybox-image" src="{href}" alt="" />',
                error: '<p class="fancybox-error">The requested content cannot be loaded.<br/>Please try again later.</p>',
                closeBtn: '<a title="Close" class="fancybox-item fancybox-close" href="javascript:;"><i><svg class="mk-svg-icon" svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M390.628 345.372l-45.256 45.256-89.372-89.373-89.373 89.372-45.255-45.255 89.373-89.372-89.372-89.373 45.254-45.254 89.373 89.372 89.372-89.373 45.256 45.255-89.373 89.373 89.373 89.372z"/></svg></i></a>',
                next: '<a title="Next" class="fancybox-nav fancybox-next" href="javascript:;"><span><i><svg class="mk-svg-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M144 505.6c8 0 16-3.2 22.4-8l240-225.6c6.4-6.4 9.6-14.4 9.6-22.4s-3.2-16-9.6-22.4l-240-224c-12.8-12.8-32-12.8-44.8 0s-11.2 32 1.6 44.8l214.4 201.6-216 203.2c-12.8 11.2-12.8 32 0 44.8 6.4 4.8 14.4 8 22.4 8z"/></svg></i></span></a>',
                prev: '<a title="Previous" class="fancybox-nav fancybox-prev" href="javascript:;"><span><i><svg class="mk-svg-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M368 505.6c-8 0-16-3.2-22.4-8l-240-225.6c-6.4-6.4-9.6-14.4-9.6-24 0-8 3.2-16 9.6-22.4l240-224c12.8-11.2 33.6-11.2 44.8 1.6 12.8 12.8 11.2 32-1.6 44.8l-214.4 201.6 216 203.2c12.8 11.2 12.8 32 0 44.8-4.8 4.8-14.4 8-22.4 8z"/></svg></i></span></a>',
                loading: '<div id="fancybox-loading"><div></div></div>'
            },

            afterLoad: function() {
                $('html').addClass('fancybox-lock');
                $('.fancybox-wrap').appendTo('.fancybox-overlay');
            },
            beforeShow: function(){
                this.locked = true;
            },
            afterClose: function() {
                // Only for gallery shortcode.
                var galleryParent = this.element.parents( '.mk-gallery-item' );

                if ( galleryParent ) {
                    galleryParent.removeClass('hover-state');
                }
            }

        });
}


(function($, window){
    'use strict';

    var scrollY = MK.val.scroll; 
    var dynamicHeight = MK.val.dynamicHeight;

    var $window = $(window);
    var $containers = $('.js-loop');

    $containers.each( pagination );

	$window.on( 'vc_reload', function() {
		$('.js-loop').each( pagination );
	} );

    function pagination() {
        var unique = Date.now();
        var $container = $(this);
        var $superContainer = $container.parent(); // should contain clearing so it stretches with floating children
        var $loadBtn = $container.siblings('.js-loadmore-holder').find('.js-loadmore-button');
        var $loadScroll = $('.js-load-more-scroll');
        var style = $container.data('pagination-style');
        var maxPages = $container.data('max-pages');
        var id = '#' + ($container.attr('id'));
        var ajaxLoader = new MK.utils.ajaxLoader(id);
        var isLoadBtn = (style === 2);
        var isInfiniteScroll = (style === 3); // add flag for last container
        var scrollCheckPoint = null;
        var isHandlerBinded = false;

        ajaxLoader.init();

        init();

        function init() {
            MK.utils.eventManager.subscribe('ajaxLoaded', onLoad);
            bindHandlers();
            if( isInfiniteScroll ) scrollCheckPoint = spyScrollCheckPoint();

			$window.on( 'vc_reload', function() {
				$window.off('scroll', handleScroll);
			} );
        }

        function bindHandlers() {
            if( isLoadBtn ) $loadBtn.on('click', handleClick);
            if( isInfiniteScroll ) $window.on('scroll', handleScroll); 
            isHandlerBinded = true;
        }

        function unbindHandlers() {
            if( isLoadBtn ) $loadBtn.off('click', handleClick);
            if( isInfiniteScroll ) $window.off('scroll', handleScroll);
            isHandlerBinded = false;
        }

        function handleClick(e) {
            e.preventDefault();
            if(!ajaxLoader.isLoading) loadMore();
        }

        function handleScroll() {
            if((scrollY() > scrollCheckPoint()) && !ajaxLoader.isLoading) loadMore();
        }

        function loadMore() {
            loadingIndicatorStart();
            var page = ajaxLoader.getData('paged');
            ajaxLoader.setData({paged: ++page});
            ajaxLoader.load(unique);
        }

        function onLoad(e, response) {
            if( typeof response !== 'undefined' && response.id === id) {
                // Checking found posts helps to fix all pagination styles 
                if( ajaxLoader.getData('found_posts') <= 0 && ajaxLoader.getData('paged') >= ajaxLoader.getData('maxPages')) loadingIndicatorHide();
                else loadingIndicatorShow();
                if(response.unique === unique) $container.append(response.content);
                loadingIndicatorStop();
            }
        }

        function loadingIndicatorStart() {
            if(isLoadBtn) $loadBtn.addClass('is-active');
            else if(isInfiniteScroll) MK.ui.loader.add('.js-load-more-scroll');

        }

        function loadingIndicatorStop() {
            if(isLoadBtn) $loadBtn.removeClass('is-active');
            else if(isInfiniteScroll) MK.ui.loader.remove('.js-load-more-scroll');
        }

        function loadingIndicatorShow() {
            if(isHandlerBinded) return;
            if(isLoadBtn) $loadBtn.show();
            else if(isInfiniteScroll) $loadScroll.show();
            bindHandlers();
        }

        function loadingIndicatorHide() {
            if(!isHandlerBinded) return;
            if(isLoadBtn) $loadBtn.hide();
            else if(isInfiniteScroll) $loadScroll.hide();
            unbindHandlers();
        }


        function spyScrollCheckPoint() {
            var containerO = 0;
            var containerH = dynamicHeight( $superContainer );
            var winH = dynamicHeight( window );
 
            var setVals = function() {
                containerO = $superContainer.offset().top;
            };

            setVals();
            $window.on('resize', function() { requestAnimationFrame(setVals); });

            return function() {
                return (containerH() + containerO) - (winH() * 2);
            };
        }
    }

})(jQuery, window);
(function($) {
  'use strict';

  var MK = window.MK || {};
  window.MK = MK;
  MK.component = window.MK.component || {};

	// Check if it's inside hidden parent
	// Cannot be position: fixed
	function isHidden(el) {
	    return (el.offsetParent === null);
	}

	MK.component.Masonry = function(el) {
		var $window = $(window);
		var $container = $(el);
		var config = $container.data( 'masonry-config' );
		var $masonryItems = $container.find(config.item);
		var cols = config.cols || 8;
		var $filterItems = null; // assign only when apply filter
    var wall = null;

        var init = function init() {
          MK.core.loadDependencies([ MK.core.path.plugins + 'freewall.js' ], onDepLoad);
        };

        var onDepLoad = function onDepLoad() {
          masonry();

        	// Events
	        $window.on('resize', onResize);
            MK.utils.eventManager.subscribe('ajaxLoaded', onPostAddition);
			MK.utils.eventManager.subscribe('staticFilter', resize);
        };

	    var masonry = function masonry() {
	    	// Quit for hidden elements for now.
        if(isHidden(el)) return;

	    	var newCols;
	    	if(window.matchMedia( '(max-width:600px)' ).matches) newCols = 2;
	    	else if(window.matchMedia( '(max-width:850px)' ).matches) newCols = 4;
	    	else newCols = cols;

        var colW = $container.width() / newCols;

        wall = new Freewall( config.container );

	        // We need to pass settings to a plugin via reset method. Strange but works fine.
			wall.reset({
				selector: config.item + ':not(.is-hidden)',
				gutterX: 0, // set default gutter to 0 and again - apply margins to item holders in css
				gutterY: 0,
				cellW: colW,
				cellH: colW
			});

	        wall.fillHoles();
          wall.fitWidth();

	        $masonryItems.each(function() {
	        	$(this).data('loaded', true);
	        });
        };


		// Clear attributes after the plugin. It's API method dosn't handle it properly
		var destroyContainer = function destroyContainer() {
			$container.removeAttr('style')
				 .removeData('wall-height')
				 .removeData('wall-width')
				 .removeData('min-width')
				 .removeData('total-col')
				 .removeData('total-row')
				 .removeAttr('data-wall-height')
				 .removeAttr('data-wall-width')
				 .removeAttr('data-min-width')
				 .removeAttr('data-total-col')
				 .removeAttr('data-total-row');
		};

		var destroyItem = function destroyItem() {
			var $item = $(this);
			$item.removeAttr('style')
				 .removeData('delay')
				 .removeData('height')
				 .removeData('width')
				 .removeData('state')
				 .removeAttr('data-delay')
				 .removeAttr('data-height')
				 .removeAttr('data-width')
				 .removeAttr('data-state');
		};

		var destroyAll = function destroyAll() {
	    	if( !wall ) return;
    		wall.destroy(); // API destroy
    		destroyContainer();
    		$masonryItems.each( destroyItem ); // run our deeper destroy
		};

		var onResize = function onResize() {
			requestAnimationFrame(resize);
		};

        var refresh = function refresh() {
	    	if( !wall ) return;
	    	setTimeout(wall.fitWidth.bind(wall), 5);
        };

        var resize = function resize() {
        	destroyAll();
	    	masonry();
        };

        var onPostAddition = function onPostAddition() {
        	$masonryItems = $container.find(config.item);

        	$masonryItems.each(function() {
        		var $item = $(this),
        			isLoaded = $item.data('loaded');

        		if(!isLoaded) $item.css('visibility', 'hidden');
        	});


        	$container.mk_imagesLoaded().then(function() {
        		destroyAll();
        		masonry();
        	});
        };

        return {
         	init : init
        };
	};

}(jQuery));

/* Milestone Number Shortcode */
/* -------------------------------------------------------------------- */

function mk_milestone() {

  "use strict";

  if( !$.exists('.mk-milestone') ) return;

  $('.mk-milestone').each(function () {
    var $this = $(this),
      stop_number = $this.find('.milestone-number').attr('data-stop'),
      animation_speed = parseInt($this.find('.milestone-number').attr('data-speed'));

    var build = function() {
      if (!$this.hasClass('scroll-animated')) {
        $this.addClass('scroll-animated');

        $({
          countNum: $this.find('.milestone-number').text()
        }).animate({
          countNum: stop_number
        }, {
          duration: animation_speed,
          easing: 'linear',
          step: function () {
            $this.find('.milestone-number').text(Math.floor(this.countNum));
          },
          complete: function () {
            $this.find('.milestone-number').text(this.countNum);
          }
        });
      }
    };

    if ( !MK.utils.isMobile() ) {
      // refactored only :in-viewport logic. rest is to-do
      MK.utils.scrollSpy( this, {
          position: 'bottom',
          after: build
      });
    } else {
      build();
    }

  });

}




(function($) {
	'use strict';

	MK.component.Pagination = function(el) {
		this.el = el;
	};

	MK.component.Pagination.prototype = {
		init: function init() {
			this.cacheElements();
			this.bindEvents();
			this.onInitLoad();
		},

		cacheElements: function cacheElements() {
			this.lastId = 1;
			this.unique = Date.now();
			this.$pagination = $(this.el);
			this.$container = this.$pagination.prev('.js-loop');
			this.$pageLinks = this.$pagination.find('.js-pagination-page');
			this.$nextLink = this.$pagination.find('.js-pagination-next');
			this.$prevLink = this.$pagination.find('.js-pagination-prev');
			this.$current = this.$pagination.find('.js-current-page');
			this.$maxPages = this.$pagination.find('.pagination-max-pages'); // TODO change in DOM and here to js class
			this.containerId = '#' + this.$container.attr('id');
			this.pagePathname = window.location.pathname;
			this.pageSearch = window.location.search;
			this.popState = false;
			this.ajaxLoader = new MK.utils.ajaxLoader('#' + this.$container.attr('id'));
			this.ajaxLoader.init();
		},

		bindEvents: function bindEvents() {
			this.$pageLinks.on('click', this.pageClick.bind(this));
			this.$nextLink.on('click', this.nextClick.bind(this));
			this.$prevLink.on('click', this.prevClick.bind(this));
			MK.utils.eventManager.subscribe('ajaxLoaded', this.onLoad.bind(this));
		},

		pageClick: function pageClick(e) {
			e.preventDefault();
			var $this = $(e.currentTarget);
			var id = parseFloat($this.attr('data-page-id'));

			if(id > this.ajaxLoader.getData('maxPages') || id < 1) return;
			this.load(id, $this);
			this.updatePagedNumUrl( id );
		},

		nextClick: function nextClick(e) {
			e.preventDefault();
			if(this.ajaxLoader.getData('paged') === this.ajaxLoader.getData('maxPages')) return;
			this.load(++this.lastId, $(e.currentTarget));
			this.updatePagedNumUrl( this.lastId );
		},

		prevClick: function prevClick(e) {
			e.preventDefault();
			if(this.ajaxLoader.getData('paged') === 1) return;
			this.load(--this.lastId, $(e.currentTarget));
			this.updatePagedNumUrl( this.lastId );
		},

		load: function load(id, $el) {
			this.lastId = id;
			this.ajaxLoader.setData({paged: id});
			this.ajaxLoader.load(this.unique);
			this.removeIndicator();
			MK.ui.loader.add($el);
		},

    onLoad: function success(e, response) {
      if (typeof response !== 'undefined' && response.id === this.containerId) {
        this.updatePagination();
        this.lastId = this.ajaxLoader.getData('paged');

        if (response.unique === this.unique) {
          this.removeIndicator();
          this.scrollPage();
          this.$container.html(response.content);
        }
      }
    },

        updatePagination: function updatePagination() {
        	var self = this;

        	// Hide / show arrows
        	var isFirst = (this.ajaxLoader.getData('paged') === 1);
        	var isLast = (this.ajaxLoader.getData('paged') === this.ajaxLoader.getData('maxPages'));

        	if(isFirst) this.$prevLink.addClass('is-vis-hidden');
        	else this.$prevLink.removeClass('is-vis-hidden');

        	if(isLast) this.$nextLink.addClass('is-vis-hidden');
        	else this.$nextLink.removeClass('is-vis-hidden');

			// X of Y
			this.$current.html(this.ajaxLoader.getData('paged'));
			this.$maxPages.html(this.ajaxLoader.getData('maxPages'));

			// Move overfloating items
			var displayItems = 10;
			var centerAt = displayItems / 2;

			if(this.ajaxLoader.getData('maxPages') > displayItems) {
				this.$pageLinks.each(function(i) {

					var id = self.lastId - centerAt;
						id = Math.max(id, 1);
						id = Math.min(id, self.ajaxLoader.getData('maxPages') - displayItems + 1);
						id = id + i;

					$(this).html( id ).attr('data-page-id', id).show();

					if(i === 0 && id > 1) $(this).html('...');
					if(i === displayItems - 1 && id < self.ajaxLoader.getData('maxPages')) $(this).html('...');
				});
			} else {
				this.$pageLinks.each(function(i) {
					var $link = $(this);
					var id = i + 1;

					$link.html(id).attr('data-page-id', id);

					if( self.ajaxLoader.getData('maxPages') === 1) {
						self.$pageLinks.hide();
					} else {
						if(i > self.ajaxLoader.getData('maxPages') - 1) $link.hide();
						else $link.show();
					}

				});
			}

        	// Highlight current only
			this.$pageLinks.filter('[data-page-id="' + this.ajaxLoader.getData('paged') + '"]' ).addClass('current-page')
				 .siblings().removeClass('current-page');

        },

    scrollPage: function scrollPage() {
      var containerOffset = this.$container.offset().top;
      var offset = containerOffset - MK.val.offsetHeaderHeight( containerOffset ) - 20;

      MK.utils.scrollTo( offset );
    },

    removeIndicator: function removeIndicator() {
      MK.ui.loader.remove('.js-pagination-page, .js-pagination-next, .js-pagination-prev');
    },

		/**
		 * Set some actions when archive/category page is loaded. Actions list:
		 * - Select the correct paged ID on pagination list.
		 * - Set current paged ID on the label.
		 * - Add event listener onpopstate for handling prev/next button of Browser URL.
		 * - Set info for updatePagedNumUrl() about request comes from popstate.
		 *
		 * @since 5.9.8
		 */
		onInitLoad: function onInitLoad() {
			var initPagedID = this.$pagination.data( 'init-pagination' );
			if ( initPagedID && initPagedID > 1 ) {
				this.$current.html( initPagedID );
				this.$pageLinks.filter( '[data-page-id="' + initPagedID + '"]' ).addClass( 'current-page' ).siblings().removeClass( 'current-page' );
			}

			// Run popstate only if it's supported by the browser.
			if ( 'onpopstate' in window ) {
				var thisPop = this;
				window.onpopstate = function( event ) {
					var id = 1;

					// At start, state is always null. So, we should check it before processing.
					if ( typeof event.state === 'object' && event.state ) {
						var state = event.state;

						// Set paged ID for updating page.
						if ( state.hasOwnProperty( 'MkPagination' ) ) {
							var currentState = state.MkPagination;
							if ( currentState.hasOwnProperty( 'paged' ) ) {
								id = parseFloat( currentState.paged );
							}
						}
					} else {
						id = parseFloat( thisPop.getURLPagedID() );
					}

					// Tell updatePagedNumUrl() if request come from popstate.
					thisPop.popState = true;
					thisPop.$pageLinks.filter( '[data-page-id="' + id + '"]' ).trigger( 'click' );
				}
			}
		},

		/**
		 * Update current pagination browser URL by adding/changing paged number. Only run if
		 * the browser support pushState and the request not coming from popstate.
		 *
		 * WordPress has some ways to set paged number:
		 * 1. page/[number], paged=[number] will be directed here.
		 * 2. page=[number]
		 * So, we should check which one the request is used here.
		 *
		 * @since 5.9.8
		 */
		updatePagedNumUrl: function updatePagedNumUrl( id ) {
			// Check pushState browser support and ignore if request come from popstate.
			if ( 'history' in window && 'pushState' in history && id && ! this.popState ) {
				var fullPage = this.pagePathname + this.pageSearch;
				var isQueryPage = false;

				// Style 1 - /page/[number], as default value.
				var newPage = 'page/' + id + '/';
				var expPage = /page\/\d+\/?/;
				var result = this.pagePathname.match( /\/page\/\d+/ );
				var isPagedExist = ( result ) ? true : false;

				// Style 2 - ?page=[number], only run if /page/ is not exist and URL query var exist.
				if ( ! isPagedExist && this.pageSearch ) {
					isQueryPage = this.pageSearch.match( /page\=\d+/ );
					if ( isQueryPage ) {
						newPage = 'page=' + id;
						expPage = /page\=\d+/;
					}
				}

				// If page number is 1, remove paged number from URL.
				if ( id === 1 ) {
					newPage = '';
					if ( isQueryPage ) {
						expPage = ( this.pageSearch.match( /\&+/ ) ) ? /page\=\d+\&?/ : /\?page\=\d+\&?/;
					}
				}

				// Set new pathname. Do replacement only if the new pathname contains paged number.
				var newURL = this.pagePathname + newPage + this.pageSearch;
				if ( fullPage.match( expPage ) ) {
					newURL = fullPage.replace( expPage, newPage );
				}

				// Set history state and return popstate back to false.
				var historyState = {
					MkPagination: {
						url: newURL,
						paged: id
					}
				}
				this.popState = false;

				// Push new pathname to display/hide the paged number.
				window.history.pushState( historyState, null, newURL );
			}
			this.popState = false;
		},

		/**
		 * Get current URL page ID. Notes:
		 * 1. page/[number], paged=[number] will be directed here.
		 * 2. page=[number]
		 *
		 * @return {integer} Current paged ID. Default 1.
		 */
		getURLPagedID: function getURLPagedID() {
			var pathname = window.location.pathname;
			var search = window.location.search;
			var pagedId = 1;
			var result = '';
			var isPagedExist = false;

			// Search based on style 1.
			result = pathname.match( /\/page\/(\d+)/ );
			if ( result ) {
				isPagedExist = true;
				pagedId = ( result.hasOwnProperty( 1 ) ) ? result[1] : 1;
			}

			// Search based on style 2.
			if ( ! isPagedExist && search ) {
				result = search.match( /page\=(\d+)/ );
				if ( result ) {
					isPagedExist = true;
					pagedId = ( result.hasOwnProperty( 1 ) ) ? result[1] : 1;
				}
			}

			return pagedId;
		}
	};

}(jQuery));

(function( $ ) {
	'use strict';

  var MK = window.MK || {};
  window.MK = MK;
  MK.component = window.MK.component || {};

  var val = MK.val,
    utils = MK.utils;

	MK.component.Parallax = function( el ) {
		var self = this,
			$this = $( el ),
        	obj = $this[0],
			$window = $( window ),
		    container = $('.jupiterx-main')[0],
			config = $this.data( 'parallax-config' ),
			$holder = $( config.holder ),
			headerHeight = null,
			offset = null,
			elHeight = null,
			ticking = false,
			isMobile = null;


		var clientRect = null;

		var update = function() {
			// Clear styles to check for natural styles
			// then apply position and size
			obj.style.transform = null;
			obj.style.top = null;
			obj.style.bottom = null;

			isMobile = MK.utils.isMobile();

			if( isMobile ) {
        		$this.css( 'height', '' );
				return;
			}

			clientRect = $this[ 0 ].getBoundingClientRect();
			offset = clientRect.top;
			elHeight = clientRect.height;
			// headerHeight = val.offsetHeaderHeight( offset );
			headerHeight = 150;
      offset = offset - headerHeight + val.scroll();

			setPosition();
			setSize( );
		};


        var h = 0,
        	winH = 0,
        	proportion = 0,
        	height = 0;

        // Position and background attachement should me moved to CSS but we repair it high specificity here as styles are not reliable currently
        var setSize = function() {
        	$this.css( 'height', '' );
        	winH = $window.height() - headerHeight;
        	h = obj.getBoundingClientRect().height;

        	if( config.speed <= 1 && config.speed > 0 ) {
        		if( offset === 0 ) {
	        		$this.css({
	        			backgroundAttachment: 'scroll',
	        			'will-change': 'transform'
	        		});
        		} else {
	        		$this.css({
						height : h + ( (winH - h) * config.speed ),
	        			backgroundAttachment: 'scroll',
	        			'will-change': 'transform'
	        		});
	        	}

        	} else if ( config.speed > 1 && h <= winH ) {
        		$this.css({
        			// good for full heights - 2 because it's viewable by 2 screen heights
        			height: ( winH  +  ( ( winH * config.speed ) - winH ) * 2 ),
        			top: -( ( winH * config.speed ) - winH ),
        			backgroundAttachment: 'scroll',
        			'will-change': 'transform'
        		});

        	} else if ( config.speed > 1 && h > winH ) {
        		proportion = h / winH;
        		height = ( winH  +  ( ( winH * config.speed ) - winH ) * (1 + proportion) );

        		$this.css({
        			height: height,
        			top: -( height - (winH * config.speed) ),
        			backgroundAttachment: 'scroll',
        			'will-change': 'transform'
        		});

        	} else if ( config.speed < 0 && h >= winH ) {
        		height = h * (1  - config.speed);
        		$this.css({
					height: height + (height - h),
        			top: h - height,
        			backgroundAttachment: 'scroll',
        			'will-change': 'transform'
        		});

        	} else if ( config.speed < 0 && h < winH ) {
        		// candidate to change
        		var display = (winH + h) / winH;
        		height = h * -config.speed * display;
        		$this.css({
					height: h + (height * 2),
        			top: -height,
        			backgroundAttachment: 'scroll',
        			'will-change': 'transform'
        		});
        	}
        };


		var currentPoint = null,
			progressVal = null,
			startPoint = null,
			endPoint = null,
			$opacityLayer = config.opacity ? $this.find( config.opacity ) : null,
			scrollY = null;

		var setPosition = function() {
			startPoint = offset - winH;
			endPoint = offset + elHeight + winH - headerHeight;
			scrollY = val.scroll();

			if( scrollY < startPoint || scrollY > endPoint ) {
				ticking = false;
				return;
			}

			currentPoint = (( -offset + scrollY ) * config.speed);

            $this.css({
              	'-webkit-transform': 'translateY(' + currentPoint + 'px) translateZ(0)',
              	'-moz-transform': 'translateY(' + currentPoint + 'px) translateZ(0)',
              	'-ms-transform': 'translateY(' + currentPoint + 'px) translateZ(0)',
              	'-o-transform': 'translateY(' + currentPoint + 'px) translateZ(0)',
              	'transform': 'translateY(' + currentPoint + 'px) translateZ(0)'
            });

			ticking = false;
		};


		var requestTick = function() {
			if( !ticking && !isMobile ) {
				ticking = true;
				window.requestAnimationFrame( setPosition );
			}
		};


		var init = function() {
			update();
			setTimeout(update, 100);
			$window.on( 'load', update );
			$window.on( 'resize', update );
	        window.addResizeListener( container, update );

			$window.on( 'scroll', requestTick );
		};


		return {
			init : init
		};
	};

})( jQuery );

(function($) {
	'use strict';

  var MK = window.MK || {};
  window.MK = MK;
  MK.component = window.MK.component || {};
  MK.ui = window.MK.ui || {};

	MK.component.Preloader = function(el) {
		this.el = el;
	};

	MK.component.Preloader.prototype = {
		init: function init() {
			this.cacheElements();
			this.bindEvents();
		},

		cacheElements: function cacheElements() {
			this.$preloader = $(this.el);
		},

		bindEvents: function bindEvents() {
			this.onLoad(); // all components inited on page load
		},

		onLoad: function onLoad() {
			setTimeout(this.hidePreloader.bind(this), 300);
		},

		hidePreloader: function hidePreloader() {
			this.$preloader.hide();
		}
	};

}(jQuery));

(function($) {
	'use strict';

	// Image added for proportional scaling
	MK.ui.loader = {
		tpl : function() {
			return '<div class="mk-loading-indicator">' +
						'<div class="mk-loading-indicator__inner">' +
							'<div class="mk-loading-indicator__icon"></div>' +
							'<img style="height:100%; width:auto;" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7">' +
						'</div>' +
					'</div>';
		},

		add : function(item) {
			$(item).append(this.tpl);
		},

		remove : function(item) {
			if(item) $(item).find('.mk-loading-indicator').remove();
			else $('.mk-loading-indicator').remove();
		}
	};

}(jQuery));

var MK = window.MK || {};
window.MK = MK;
MK.component = window.MK.component || {};

MK.component.ResponsiveImageSetter = (function ($) {

	'use strict';

	var module = {};


	/*---------------------------------------------------------------------------------*/
	/* Private Variables
	/*---------------------------------------------------------------------------------*/

	var viewportClass = getViewportClass();
	var isRetina = window.devicePixelRatio >= 2;


	/*---------------------------------------------------------------------------------*/
	/* Private Methods
	/*---------------------------------------------------------------------------------*/

	function run($imgs) {
		$imgs.filter( function() {
			return !this.hasAttribute("mk-img-src-setted");
		}).each(setSrcAttr);
	}

	function setSrcAttr() {
		var $img = $(this);
		var set = $img.data('mk-image-src-set');
		// Set src attribute to img link suitable for our logic. It will load the image.
		if(set['responsive'] === 'false' && isRetina && set['2x']) $img.attr('src', set['2x']);
		else if(set['responsive'] === 'false') $img.attr('src', set.default);
		else if(viewportClass === 1 && isRetina && set['2x']) $img.attr('src', set['2x']); // default x2 for retina
		else if(viewportClass === 0 && set.mobile) $img.attr('src', set.mobile);
    else $img.attr('src', set.default);

    $img.load(function() {
      $(window).trigger('mk-image-loaded')
    })
	}

	function getViewportClass() {
		if(window.matchMedia('(max-width: 736px)').matches) return 0;
		else return 1;
	}

	function handleResize($imgs) {
		if(!$imgs.length) return; // Do not run if empty collection
		var currentViewportClass = getViewportClass();
		// We don't need to reload bigger images when screen size is decreasing as browser already performs resize operation.
		// Run update on for increasing screen size
		if( currentViewportClass > viewportClass) {
			viewportClass = currentViewportClass; // update for further reference
			run($imgs);
		}
	}


	/*---------------------------------------------------------------------------------*/
	/* Public Methods
	/*---------------------------------------------------------------------------------*/

	module.init = function ($imgs) {

		// Do not run if empty collection
		if(!$imgs.length) return;

		// Run and bind to events
		run($imgs);
	    $imgs.attr('mk-img-src-setted', '');

	};

	module.onResize = function ($imgs) {

		$(window).on( 'resize', MK.utils.throttle( 500, function() {
			handleResize($imgs);
		}));


	};


	module.handleAjax = function () {
    	setTimeout(function ajaxDelayedCallback() { // give it a chance to insert content first
	    	var $newImgs = $('img[data-mk-image-src-set]').filter( function() {
				return !this.hasAttribute("mk-lazyload");
			});
			if(!$newImgs.length) return;
	    	run($newImgs);
    	}, 100);
    }


	return module;

}(jQuery));


jQuery(function($) {

	var init = function init() {
		// Get All Responsive Images
		var $allImages = $('img[data-mk-image-src-set]').filter(function(index) {
			var isNotPortfolioImage = !$(this).hasClass('portfolio-image'),
				isNotBlogImage = $(this).closest('.mk-blog-container').length == 0,
				isNotSwiperImage = !$(this).hasClass('swiper-slide-image'),
				isNotGalleryImage = !$(this).hasClass('mk-gallery-image');
			return isNotPortfolioImage && isNotBlogImage && isNotSwiperImage && isNotGalleryImage;
		});;

		// Handle the resize
		MK.component.ResponsiveImageSetter.onResize($allImages);

		MK.component.ResponsiveImageSetter.init($allImages);

		MK.utils.eventManager.subscribe('ajaxLoaded', MK.component.ResponsiveImageSetter.handleAjax ); // ajax loops
		MK.utils.eventManager.subscribe('ajax-preview', MK.component.ResponsiveImageSetter.handleAjax ); // ajax portfolio
		MK.utils.eventManager.subscribe('quickViewOpen', MK.component.ResponsiveImageSetter.handleAjax );
	}
	init();
	$(window).on('vc_reload', init);

});



(function( $ ) {
	'use strict';

  var MK = window.MK || {};
  window.MK = MK;
  MK.utils = window.MK.utils || {};
  MK.val = window.MK.val || {};

	/**
	 * Keep track of top Level sections so we can easly skip to next one.
	 * We must be explicit about DOM level to nested sections.
	 * The list of sections is static. If you'd need to refreh it on ajax etc do it with pub/sub (not really needed now).
	 * We keep track for the same sections in Footer for mutating window location with '!loading' to prevent native anchor behaviour.
	 */
	var $topLevelSections = $('.jupiterx-main > .vc_row, .jupiterx-main > .mk-main-wrapper-holder, .jupiterx-main > .mk-page-section');

  $( document ).on( 'click', '.mk-skip-to-next', function() {
    var $this = $( this ),

    /**
     * Static height of button + the space to the bottom of the container.
     *
     * @TODO Possible to calculate dynamically.
     */
    btnHeight = $this.hasClass( 'edge-skip-slider' ) ? 150 : 76,
    offset = $this.offset().top + btnHeight,
    nextOffset = MK.utils.nextHigherVal( MK.utils.offsets( $topLevelSections ), [offset] );

    MK.utils.scrollTo( nextOffset  );
  });

})( jQuery );


(function($) {

    'use strict';

    var SkillDiagram = function( el ) {
        this.el = el;
    }

    SkillDiagram.prototype = {
        init : function() {
            this.cacheElements();
            this.createDiagram();
            this.$skills.each( this.createSkill.bind( this ) );
        },

        cacheElements : function() {
            this.$el = $( this.el );
            this.$skills = this.$el.find( '.mk-meter-arch');
            this.config  = this.$el.data();
            this.config.radius = this.config.dimension / 2;
        },

        random : function( l, u ) {
            return Math.floor( ( Math.random() * ( u - l + 1 ) ) + l );
        },

        createDiagram : function() {
            var self = this;
            $(this.el).find('svg').remove();

            this.diagram = Raphael( this.el, this.config.dimension, this.config.dimension );

            // Make svg scalable in different screen sizes
            this.diagram.setViewBox(0,0,this.config.dimension,this.config.dimension,true);
            this.diagram.setSize('90%', '90%');

            this.diagram.circle( this.config.radius, this.config.radius, 80 ).attr({
                stroke: 'none',
                fill: this.config.circleColor
            });

            // Export title
            this.title = this.diagram.text( this.config.radius, this.config.radius, this.config.defaultText ).attr({
                font: "22px helvetica",
                fill: this.config.defaultTextColor
            }).toFront();

            this.diagram.customAttributes.arc = function(value, color, rad){
                var v = 3.6 * value,
                    alpha = v == 360 ? 359.99 : v,
                    r  = self.random( 91, 240 ),
                    a  = (r - alpha) * Math.PI/180,
                    b  = r * Math.PI/180,
                    sx = self.config.radius + rad * Math.cos(b),
                    sy = self.config.radius - rad * Math.sin(b),
                    x  = self.config.radius + rad * Math.cos(a),
                    y  = self.config.radius - rad * Math.sin(a),
                    path = [['M', sx, sy], ['A', rad, rad, 0, +(alpha > 180), 1, x, y]];

                return {
                    path: path,
                    stroke: color
                }
            }
        },

        createSkill : function( id, el ) {
            var self   = this,
                $this  = $( el ),
                config = $this.data(),
                radMin = 72,
                radVal = 27,
                newRad = radMin + ( radVal * (id + 1) );

            var $path = this.diagram.path().attr({
                'stroke-width': 28,
                arc: [config.percent, config.color, newRad]
            });

            $path.mouseover( function() {
                self.showSkill( this, config.name, config.percent );
            }).mouseout( function() {
                self.hideSkill( this )
            });
        },

        showSkill : function( self, name, percent ) {
            var $this = self,
                time = 250;

            //solves IE problem
            if(Raphael.type != 'VML') $this.toFront();

            $this.animate({
                'stroke-width': 50,
                'opacity': 0.9,
            }, 800, 'elastic' );

            this.title.stop()
                .animate({ opacity: 0 }, time, '>', function(){
                    this.attr({ text: name + '\n' + percent + '%' }).animate({ opacity: 1 }, time, '<');
                }).toFront();
        },

        hideSkill : function( self ) {
            var $this = self,
                self = this,
                time = 250;

            $this.stop().animate({
                'stroke-width': 28,
                opacity: 1
            }, time * 4, 'elastic' );

            self.title.stop()
                .animate({ opacity: 0 }, time, '>', function(){
                    self.title.attr({ text: self.config.defaultText })
                    .animate({ opacity: 1 }, time, '<');
                });
        }
    }

    var init = function init() {
        if( typeof Raphael === 'undefined' ) return;
        $( '.mk-skill-diagram' ).each( function() {
            var diagram = new SkillDiagram( this );
                diagram.init();
        });
    }

    init();
    $(window).on('vc_reload', init);

})(jQuery);

/* Skill Meter and Charts */
/* -------------------------------------------------------------------- */
function mk_skill_meter() {
  "use strict";
  if ($.exists('.mk-skill-meter')) {
        if (!MK.utils.isMobile()) {
            $(".mk-skill-meter .progress-outer").each(function() {
                var $this = $(this);

                var build = function() {
                    if (!$this.hasClass('scroll-animated')) {
                        $this.addClass('scroll-animated');
                        $this.animate({
                            width: $this.attr("data-width") + '%'
                        }, 2000);
                    }
                };

                MK.utils.scrollSpy( this, {
                    position: 'bottom',
                    after: build
                });
            });
        } else {
            $(".mk-skill-meter .progress-outer").each(function() {
                var $this = $(this);
                if (!$this.hasClass('scroll-animated')) {
                    $this.addClass('scroll-animated');
                    $this.css({
                        width: $(this).attr("data-width") + '%'
                    });
                }
            });
        }
    }
}

// function mk_charts() {
//     "use strict";

//     if( !$.exists('.mk-chart') ) return;

//     MK.core.loadDependencies([ MK.core.path.plugins + 'jquery.easyPieChart.js' ], function() {

//         $('.mk-chart').each(function() {

//             var $this = $(this),
//                 $parent_width = $(this).parent().width(),
//                 $chart_size = parseInt($this.attr('data-barSize'));

//             if ($parent_width < $chart_size) {
//                 $chart_size = $parent_width;
//                 $this.css('line-height', $chart_size);
//                 $this.find('i').css({
//                     'line-height': $chart_size + 'px'
//                 });
//                 $this.css({
//                     'line-height': $chart_size + 'px'
//                 });
//             }

//             var build = function() {
//                 $this.easyPieChart({
//                     animate: 1300,
//                     lineCap: 'butt',
//                     lineWidth: $this.attr('data-lineWidth'),
//                     size: $chart_size,
//                     barColor: $this.attr('data-barColor'),
//                     trackColor: $this.attr('data-trackColor'),
//                     scaleColor: 'transparent',
//                     onStep: function(value) {
//                         this.$el.find('.chart-percent span').text(Math.ceil(value));
//                     }
//                 });
//             };

//             // refactored only :in-viewport logic. rest is to-do
//             MK.utils.scrollSpy( this, {
//                 position: 'bottom',
//                 after: build
//             });


//         });
//     });
// }

(function($) {
  'use strict';

  var MK = window.MK || {};
  window.MK = MK;
  MK.ui = window.MK.ui || {};

	//
	// Constructor
	//
	// /////////////////////////////////////////////////////////

	MK.ui.Slider = function( container, config ) {

		var defaults = {
				slide 				: '.mk-slider-slide',
	            nav 	     		: '.mk-slider-nav',
                effect              : 'roulete',
                ease 				: 'easeOutQuart', // should not be changed, remove
                slidesPerView       : 1,
                slidesToView        : 1,
                transitionTime      : 700,
                displayTime         : 3000,
                autoplay            : true,
                hasNav              : true,
                hasPagination       : true,
                paginationTpl 		: '<span></span>',
                paginationEl 		: '#pagination',
                draggable           : true,
                fluidHeight 		: false,
                pauseOnHover		: false,
                lazyload			: false,
                activeClass 		: 'is-active',
                edgeSlider	 		: false,
                spinnerTpl 			: '<div class="mk-slider-spinner-wrap"><div class="mk-slider-spinner-fallback"></div><svg class="mk-slider-spinner" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg"><circle class="mk-slider-spinner-path" fill="none" stroke-width="4" stroke-linecap="round" cx="33" cy="33" r="30"></circle></svg></div>',
                onInitialize 		: function() {},
                onAfterSlide 		: function( id ) {},
                onBeforeSlide 		: function( id ) {}
		};

		this.state = {
			id 						: 0,
			moveForward 			: true,
			running   				: false,
            zIFlow					: null,
            stop 					: false,
		};

		this.config = $.extend( defaults, config );
		this.container = container;

		this.initPerView = this.config.slidesPerView;

		// Timer holder
		this.activeTimer = null;
		this.autoplay = null;
		this.timer = null;
		this.timerRemaining = parseInt(this.config.displayTime);

		// Boolean 'Em All, Making sure it's not string
		this.config.lazyload = JSON.parse(this.config.lazyload);
		this.config.edgeSlider = JSON.parse(this.config.edgeSlider);

		// Image Loader Instance
		this.imageLoader = null;

		// Add abort command to imagesLoaded, Placing it inside script makes it to work with different versions
		// of imagesLoaded if loaded by other Plugins
		imagesLoaded.prototype.abort = function() {
			this.progress = this.complete = function() { };
		};
	};



	//
	// Shared methods
	//
	// /////////////////////////////////////////////////////////

	MK.ui.Slider.prototype = {

		init : function() {
			this.setPerViewItems();
			this.cacheElements();
			this.getSlideSize();
			this.bindEvents();
            this.setSize();
			this.setPos();

			// Hack for preparing 'prev' on first click if needed
			this.updateId( -1 );
			this.updateId( 1 );

			this.val = this.dynamicVal();
			this.timeline = this.prepareTimeline( this.config.transitionTime );

			this.timeline.build();

			if( this.config.hasPagination ) { this.buildPagination(); }

			if( this.config.autoplay && document.hasFocus() ) { this.setTimer(); }

			if( typeof this.config.onInitialize === 'function' ) {
				this.config.onInitialize( this.slides );
			}

			if( this.config.fluidHeight === true ) {
				$( this.slides ).height( 'auto' );
				$( this.container ).css( 'transition', 'height ' + 200 + 'ms ease-out' );
				this.setHeight( 0 );
			}


			if( this.config.fluidHeight === 'toHighest' ) {
				this.setHeightToHighest();
			}

			// Create timer per slide if required
			$(this.slides).each(this.createTimer);

			// If it's Edge Slider and Lazy Load is enabled
			if ( this.config.lazyload && this.config.edgeSlider ) {

				// If It's not a Video Slide
				if ( $(this.slides[this.state.id]).find('video').length === 0 ) {
					// Set the first slide's BG image
					var $slideImg = $(this.slides[this.state.id]).children('[data-mk-img-set]');
					MK.component.BackgroundImageSetter.init( $slideImg );
				}
				$(this.config.spinnerTpl).prependTo( this.$slides );

			} else {

				// Set all slides's BG images
				MK.component.BackgroundImageSetter.init( $(this.slides).children('[data-mk-img-set]') );

			}



		},


		cacheElements : function () {
			this.container = this.isNode( this.container ) ? this.container
				: document.querySelectorAll( this.container )[0];
			this.slides = this.container.querySelectorAll( this.config.slide );
			this.$slides = $(this.slides);

			if( this.config.hasNav ) { this.$nav = $( this.config.nav ); }
			if( this.config.hasPagination ) { this.$pagination = $( this.config.paginationEl ); }
		},


		bindEvents : function() {
			var $window = $( window );

			if( this.config.slidesPerView > 1 ) { $window.on( 'resize', this.setPerViewItems.bind( this ) ); }
			if( this.config.hasNav ) { this.eventsNav(); }
			if( this.config.hasPagination ) { this.eventsPag(); }
			if( this.config.draggable ) { this.dragHandler(); }
			if( this.config.autoplay ) {
				$window.on( 'focus', this.windowActive.bind( this ) );
				$window.on( 'blur', this.windowInactive.bind( this ) );
			}
			if( this.config.pauseOnHover ) {
				$(this.container).on( 'mouseleave', this.setTimer.bind( this ) );
				$(this.container).on( 'mouseenter', this.unsetTimer.bind( this ) );
			}
			if( this.config.fluidHeight === 'toHighest' ) {
				$window.on( 'resize', this.setHeightToHighest.bind( this ) );
			}
		},


		setPerViewItems: function() {
			if(window.matchMedia( '(max-width: 500px)' ).matches) { this.config.slidesPerView = 1; }
			else if(window.matchMedia( '(max-width: 767px)' ).matches && this.initPerView >= 2 ) { this.config.slidesPerView = 2; }
			else if(window.matchMedia( '(max-width: 1024px)' ).matches && this.initPerView >= 3 ) { this.config.slidesPerView = 3; }
			else { this.config.slidesPerView = this.initPerView; }

        	if( typeof this.slides === 'undefined' ) return;
			this.getSlideSize();
			this.setSize();
			this.setPos();
			this.timeline = this.prepareTimeline( this.config.transitionTime );
			this.timeline.build();
		},


		eventsNav : function() {
			this.$nav.on( 'click', 'a', this.handleNav.bind( this ) );
		},


		eventsPag : function() {
			this.$pagination.on( 'click', 'a', this.handlePagination.bind( this ) );
		},


		handleNav : function( e ) {
			e.preventDefault();

			if( this.state.running ) { return; }
			this.state.running = true;

			var $this = $( e.currentTarget ),
				moveForward = $this.data( 'direction' ) === 'next';


			if( this.config.autoplay ) {
				this.unsetTimer();
				setTimeout( this.setTimer.bind( this ), this.config.transitionTime );
			}

			this.state.moveForward = moveForward;
			this.timeline.build();
			this.timeline.play();

			this.setActive( this.nextId( moveForward ? 1 : -1 ) );
			if( this.config.fluidHeight ) { this.setHeight( this.nextId( moveForward ? 1 : -1 ) ); }
		},


		handlePagination : function( e ) {
			e.preventDefault();

			var $this = $( e.currentTarget ),
				id = $this.index();

			this.goTo( id );
		},


		reset: function() {
			this.state.stop = true;
			this.state.id = 0;
			this.setPos();
			this.unsetTimer();
			this.setTimer();
		},


		goTo : function(id) {
			if( this.state.running ) { return; }
			this.state.running = true;

			var lastId = this.state.id;

			if( lastId === id ) {
				return;
			} else if( lastId < id ) {
				this.state.moveForward = true;
			} else {
				this.state.moveForward = false;
			}

			if( this.config.autoplay ) {
				this.unsetTimer();
				setTimeout( this.setTimer.bind( this ), this.config.transitionTime );
			}

			this.timeline.build( Math.abs( lastId - id ) );
			this.timeline.play();

			this.setActive( id );
			if( this.config.fluidHeight ) { this.setHeight( id ); }
		},


		windowActive : function() {
			this.setTimer(false, true);
			$(this.container).removeClass('is-paused');
		},


		windowInactive : function() {
			this.unsetTimer();
			$(this.container).addClass('is-paused');
		},


		updateId : function( val ) {
			this.state.id = this.nextId(val);
		},

		nextId : function( val ) {
			var len = this.slides.length,
				insertVal = this.state.id + val;
				insertVal = ( insertVal >= 0 ) ? insertVal : len + val;
				insertVal = ( insertVal >= len ) ? 0 : insertVal;

			return insertVal;
		},


		setStyle : function( obj, style ) {
            var hasT = style.transform,
            	t = {
	                x       : ( hasT ) ? style.transform.translateX : null,
	                y       : ( hasT ) ? style.transform.translateY : null,
	                scale   : ( hasT ) ? style.transform.scale 		: null,
	                rotate  : ( hasT ) ? style.transform.rotate 	: null,
	                rotateX : ( hasT ) ? style.transform.rotateX 	: null,
	                rotateY : ( hasT ) ? style.transform.rotateY 	: null
           		},
				z  = 'translateZ(0)',
            	x  = (t.x) ?  'translateX(' + t.x + '%)' 		: 'translateX(0)',
                y  = (t.y) ?  'translateY(' + t.y + '%)' 		: 'translateY(0)',
                s  = (t.scale)  ?  'scale(' + t.scale + ')' 	: 'scale(1)',
                r  = (t.rotate) ? 'rotate(' + t.rotate + 'deg)' : 'rotate(0)',
                rX = (t.rotateX) ? 'rotateX(' + t.rotateX + 'deg)' : '',
                rY = (t.rotateY) ? 'rotateY(' + t.rotateY + 'deg)' : '',

           		o = style.opacity,
           		h = style.height,
           		w = style.width;

            var c = z + x + y  + s + r + rX + rY;

            if( c.length ) {
	            obj.style.webkitTransform 	= c;
	            obj.style.msTransform 		= c;
	            obj.style.transform 		= c;
	        }

            if( typeof o === 'number' ) { obj.style.opacity = o; }
            if( h ) { obj.style.height  = h + '%'; }
            if( w ) { obj.style.width   = w + '%'; }
		},


		setPos : function() {
        	if( typeof this.slides === 'undefined' ) return;
		    var id 			= this.state.id,
		    	i 			= 0,
		    	len 		= this.slides.length,
		    	animation 	= this.animation[ this.config.effect ],
		    	axis 		= animation.axis,
				animNext	= animation.next,
				animActi 	= animation.active,
				animPrev 	= animation.prev,
                perView 	= this.config.slidesPerView,
                slideId 	= null,
                zIFlow 		= null,
                style 		= {};

            style.transform = {};


            for( ; i < len; i += 1 ) {
                if(i < perView) {
                	// Position for visible slides. Apply active styles
                	style = animActi;
                    style.transform[ 'translate' + axis ] = i * 100;
                } else {
                	// Rest slides move after edge based on axis and moveForward. Apply Next / Prev styles
                	style = this.state.moveForward ? animNext : animPrev;
                    style.transform[ 'translate' + axis ] =  this.state.moveForward ? perView * 100 : -100;
                }

                this.slides[ i ].style.zIndex = 0;

                slideId = ( i + id ) % len;
                this.setStyle( this.slides[ slideId ], style );
            }
		},


        // When we're setting animation along Y axis we're going to set up height
        // otherwise width. It is shared amongst all slides
        setSize : function() {
        	if( typeof this.slides === 'undefined' ) return;
        	var i = 0,
		    	len = this.slides.length,
		    	axis = this.animation[ this.config.effect ].axis,
                slideSize = this.slideSize,
        		style = {};

            if( axis === 'Y' ) {
                style.height = slideSize[ axis ];
            } else {
                style.width = slideSize[ axis ];
            }

            for( ; i < len; i += 1 ) {
                this.setStyle( this.slides[ i ], style );
            }
        },


        setHeight : function( id ) {
			var $slides = $( this.slides ),
				$activeSlide = $slides.eq( id );

        	var currentHeight = $activeSlide.height();
        	$( this.container ).height( currentHeight );
        },


        setHeightToHighest : function() {
        	// this is becouse of alliginig woocommrece carousel. Too much DOM
        	// Refactor someday
			var $slides = $( this.slides ),
				height = 0;

        	$slides.each(function() {
        		height = Math.max(height, $(this).find('> div').outerHeight());
        	});

        	$( this.container ).height( height );
        },


        // Little utility inspired by GreenSock.
        // We export this to this.timeline on init.
        prepareTimeline : function( time ) {
			var self 		= this,
				iteration 	= 0,
            	totalIter 	= time / (1000 / 60),
            	animLoop 	= [],
            	aL 			= 0, // animation length
            	loops 		= 1,
				ease 		= this.config.ease,
				currentStyle, timeProg,
				build, move, add, play, reverse, progress, kill;


			// Build constants, run them only once
			// take out possibly
			var len 		= this.slides.length,
				perView   	= this.config.slidesPerView,
				animation 	= this.animation[ this.config.effect ],
				animAxis 	= animation.axis,
				animNext	= animation.next,
				animActi 	= animation.active,
				animPrev 	= animation.prev,
				style 		= {},
				slideId 	= null,
				zIFlow 		= null;

				style.transform = {};


			build = function( repeats ) {
				var currentEase = ease;
				loops = repeats || loops;

				// console.log('build', loops);

				if( !loops ) { return; }
				if( loops > 1 ) {
					currentEase = 'linearEase';
				}

				// clean before running new build
				kill();
				// set new positions
				self.setPos();

				var id = self.state.id,
					moveForward = self.state.moveForward,
					i = 0,
					axisMove = (moveForward) ? -100 : 100;

				for( ; i <= perView; i += 1 ) {
					slideId = ( (moveForward) ? i + id : i + id - 1 ) % len;
					slideId = ( slideId < 0 ) ? len + slideId : slideId;

					if( i === 0 ) {
						style = moveForward ? animPrev : animActi;
					} else if( i === perView ) {
						style = moveForward ? animActi : animNext;
					} else {
						style = animActi;
	            	}

               	 	zIFlow = (self.state.moveForward) ? animNext.zIndex : animPrev.zIndex;
	                if( zIFlow ) {
	                	// console.log( zIFlow );
	                	self.slides[ slideId ].style.zIndex = (zIFlow === '+') ? i + 1 : len - i;
	                }

					style.transform[ 'translate' + animAxis ] = axisMove;
	            	add( self.slides[ slideId ], style, currentEase );
				}
			};

			add = function( slide, toStyles, ease ) {
				if( typeof slide === 'undefined' ) {
					throw 'Add at least one slide';
				}

	            var fromStyles = slide.style,
					style = self.refStyle( toStyles, fromStyles );

				animLoop.push( [slide, style, ease] );
				aL += 1;
			};

			move = function( startProg, mode ) {
				var currentTotalIter = totalIter;

				if( loops > 1 ) {
				 	currentTotalIter = totalIter / 5;
				}

				if( !self.state.running ) { self.state.running = true; }

				if( startProg ) {
					// update iteration val to cached outside var
					// ceil to handle properly play after mouse up / touch end
					iteration = Math.ceil(startProg * currentTotalIter);
				}

				timeProg = iteration / currentTotalIter;
				progress( timeProg );

				// Break loop
				if( iteration >= currentTotalIter && mode === 'play' ||
					iteration <= 0 && mode === 'reverse' ) {

					self.state.running = false;
					iteration = 0;
					kill();
	            	self.updateId( self.state.moveForward ? 1 : -1 );
					// If we're creating multiple animation loop we trigger outside only first pass to start all game.
					// the rest are triggered as callback
					loops -= 1;
					if( loops > 0 ) {
						build();
						play();
					}

					// if we run all loops reset back the default value
					if( !loops ) {
						loops = 1;
						self.timerRemaining = parseInt(self.config.displayTime);
						self.config.onAfterSlide( self.state.id );
					}

					return;
				}

				// Run in given mode
				if( mode === 'play') {
					iteration += 1;
				} else {
					iteration -= 1;
				}

				requestAnimationFrame( function() {
					if(self.state.stop) return;
					move( 0, mode );
				});
			};

			play = function( startProg ) {

				var $nextSlide = $(self.slides[ self.nextId(self.state.moveForward ? 1 : -1) ] );

				// If it's Edge Slider and Lazy Load is enabled and It's not a Video Slide
				if ( self.config.lazyload && self.config.edgeSlider ) {

					// Set the next slide's BG Image
					var $slideImg = $nextSlide.find('[data-mk-img-set]');
					if ( $slideImg.length ) {
						MK.component.BackgroundImageSetter.init( $slideImg );
					}

				}

				self.config.onBeforeSlide( self.nextId(self.state.moveForward ? 1 : -1) );
				var start = startProg || 0;
				iteration = 0;
				self.state.stop = false;
				move( start, 'play' );

			};

			reverse = function( startProg ) {
				var start = startProg || 1;
				move( start, 'reverse' );
			};

			progress = function( progVal ) {
            	var aI = 0,
            		currentStyle;

				for( aI; aI < aL; aI++ ) {
					if( progVal !== 1 && progVal !== 0 ) {
						currentStyle = self.currentStyle( progVal, animLoop[ aI ][ 1 ], animLoop[ aI ][ 2 ] );
					} else if( progVal === 1) {
						currentStyle = self.currentStyle( progVal, animLoop[ aI ][ 1 ], 'linearEase' );
					} else if ( progVal === 0 ) {
						currentStyle = self.currentStyle( progVal, animLoop[ aI ][ 1 ], 'linearEase' );
					}
					self.setStyle( animLoop[ aI ][ 0 ], currentStyle );
				}
			};

			// Clear previous loop
			kill = function() {
				animLoop = [];
            	aL = 0;
			};


			return {
				build 		: build,
				add 		: add,
				play 		: play,
				reverse 	: reverse,
				progress 	: progress
			};
		},


		// Build reference styles.
		// Return object with array containig initial style and change of its value
		// as required for easing functions
		refStyle : function( toStyles, fromStyles ) {
			var axis = this.animation[ this.config.effect ].axis,
            	style = {},
				initVal, changeVal, endVal, dynamicEnd, styleProp, transProp, transform;

			for( styleProp in toStyles ) {

				if( styleProp === 'transform' ) {
					transform = this.getTransforms( fromStyles );
					style.transform = {};

					for( transProp in toStyles.transform ) {
						// don't care about z
						if( transProp === 'translateZ' ) { continue; }

						initVal = transform[ transProp ] || 0; // if it is undefined it means it's 0
						dynamicEnd = ( transProp === 'translate' + axis ) ? initVal : 0;
						endVal  = toStyles.transform[ transProp ] + dynamicEnd; // it is dynamic, based on slide position in current set
						changeVal = endVal - initVal;
						style.transform[ transProp ] = [ initVal, changeVal ];
					}
				} else if( styleProp === 'zIndex' ) {
					// console.log( 'z' );
					continue;
				} else {
					initVal = parseFloat( fromStyles[ styleProp ] ) || 0; // if it is undefined it means it's 0
					endVal  = toStyles[ styleProp ];
					changeVal = endVal - initVal;
					style[ styleProp ] =  [ initVal, changeVal ];
				}
			}

			return style;
		},


		currentStyle : function( progress, style, ease ) {
			var self = this,
				currentStyle = {},
            	currentVals, styleProp, transProp, prog;

			// Redo same loop but construct currentStyle object out of cached values
			for( styleProp in style ) {

				if( styleProp === 'transform' ) {
					currentStyle.transform = {};

					for( transProp in style.transform ) {
						// remove this line. double check first if needed by logging
						if( transProp === 'translateZ' ) { continue; }

						currentVals = style.transform[ transProp ];
						currentStyle.transform[ transProp ] =
							// (currentIteration, startValue, changeInValue, totalIterations)
								self.ease[ ease ]( progress, currentVals[ 0 ], currentVals[ 1 ], 1 );
					}
				} else {
					currentVals = style[ styleProp ];
					currentStyle[ styleProp ] =
						self.ease[ ease ]( progress, currentVals[ 0 ], currentVals[ 1 ], 1 );
				}
			}

			return currentStyle;
		},


		setActive : function( id ) {
			var $slides = $( this.slides ),
				className = this.config.activeClass;

			$slides.removeClass( className );

			if( this.config.hasPagination ) {
				var $pagination = this.$pagination.find( 'a' );
				$pagination.removeClass( className );
				$pagination.eq( id ).addClass( className );
			}

			if( this.activeTimer ) {
				clearTimeout( this.activeTimer );
				if ( this.imageLoader ) {
					this.imageLoader.abort();
				}
			}


			var self = this;

			this.activeTimer = setTimeout( function() {

				var $currentSlide = $slides.eq( id );

				if ( self.config.lazyload && self.config.edgeSlider ) {  // If it's Edge Slider and Lazy Load is enabled

					if ( $currentSlide.find('.mk-section-video').length && $currentSlide.children('.mk-video-section-touch').length ) {  // If it's a Video Slide and has a Preview image

						var imgSet = $currentSlide.children('.mk-video-section-touch').data('mk-img-set');
						var exactImg = MK.component.BackgroundImageSetter.getImage( imgSet );
						var $bgImage = $('<img>').attr('src', exactImg );

						self.imageLoader = imagesLoaded( $bgImage[0], function( instance ) {
							$currentSlide.children('.mk-slider-spinner-wrap').addClass('mk-slider-spinner-wrap-hidden');
							setTimeout( function() {
						 		$currentSlide.children('.mk-slider-spinner-wrap').hide();
						 	}, 200);
							$currentSlide.addClass( className );
					 	});

					} else if ( $currentSlide.find('.mk-section-video').length && $currentSlide.children('.mk-video-section-touch').length === 0 ) { // If it's a Video Slide and has NOT a Preview image

						$currentSlide.children('.mk-slider-spinner-wrap').addClass('mk-slider-spinner-wrap-hidden');
						setTimeout( function() {
					 		$currentSlide.children('.mk-slider-spinner-wrap').hide();
					 	}, 200);
						$currentSlide.addClass( className );

					} else {  // If it's a Image Slide

						if ( $currentSlide.children('[data-mk-img-set]').length ) {
							// Get the matching Image URL to start lazy loading
							var imgSet = $currentSlide.children('[data-mk-img-set]').data('mk-img-set');
							var exactImg = MK.component.BackgroundImageSetter.getImage( imgSet );
							var $bgImage = $('<img>').attr('src', exactImg );

							// Prevent counting time on slide until the image loads
							self.unsetTimer();
							self.imageLoader = imagesLoaded( $bgImage[0], function( instance ) {
								// Hide spinner, Continue counting time on slide and show the content
							 	$currentSlide.children('.mk-slider-spinner-wrap').addClass('mk-slider-spinner-wrap-hidden');
							 	setTimeout( function() {
							 		$currentSlide.children('.mk-slider-spinner-wrap').hide();
							 	}, 200);
								self.setTimer(false, false, $currentSlide.data('timer') || Number(self.config.displayTime) );
								$currentSlide.addClass( className );
							});
						} else {
							$currentSlide.children('.mk-slider-spinner-wrap').addClass('mk-slider-spinner-wrap-hidden');
						 	setTimeout( function() {
						 		$currentSlide.children('.mk-slider-spinner-wrap').hide();
						 	}, 200);
							self.setTimer(false, false, $currentSlide.data('timer') || Number(self.config.displayTime) );
							$currentSlide.addClass( className );
						}

					}

				} else {

					$currentSlide.addClass( className );

				}


			}, this.config.transitionTime );
		},

		createTimer : function() {

			var $slide = $(this),
				video = $slide.find('video').get(0);

			if(video) {
				// A hacky but reliable way to ge the video duration
				var interval = setInterval( function() {
					// If the metadata is ready
					if ( video.readyState > 0 ) {
						$slide.data('timer', (video.duration * 1000));
						$slide.attr('data-timer', (video.duration * 1000));
						clearInterval(interval);
					}
				}, 100);
			}

		},

		setTimer : function( isFirst, isPaused, fixed_time ) {
			// check for custom timer
			var customTimer = this.$slides.eq(this.nextId(this.state.moveForward ? 1 : -1)).data('timer'),
				trans = parseInt( this.config.transitionTime ),
				interval = customTimer ? customTimer : parseInt( this.config.displayTime ),
				timer = interval + trans;

			var self  = this,
				first = isFirst || true,
				fixed_time = fixed_time || 0,
				create, run;

			this.timer = true;
			this.lastSetTimer = Date.now();

			create = function() {

				if( self.autoplay ) { clearTimeout( self.autoplay ); }
				if( !self.timer ) {
					return;
				}
				self.state.moveForward = true;
				self.timeline.build();
				self.timeline.play();
				self.setActive( self.nextId( 1 ) );
				if( self.config.fluidHeight ) { self.setHeight( self.nextId( 1 ) ); }
				first = false;
				self.lastSetTimer = Date.now();

				run();
			};

			run = function(newInterval) {
				// check for custom timer
				customTimer = self.$slides.eq(self.nextId(self.state.moveForward ? 1 : -1)).data('timer');
				interval = customTimer ? customTimer : parseInt( self.config.displayTime );
				timer = interval + trans; // update timer with current val

				var time = newInterval || timer;
				self.autoplay = setTimeout( create, time );
			};

			if ( fixed_time ) {
				run( fixed_time );
			} else if (isPaused) {
				run( this.timerRemaining );
			} else {
				run();
			}
		},


		unsetTimer : function() {
			this.timer = false;
			this.lastUnsetTimer = Date.now();
			this.timerRemaining -= this.lastUnsetTimer - this.lastSetTimer;
			if( this.autoplay ) { clearTimeout( this.autoplay ); }
		},


		buildPagination : function() {
			var i   = 0,
				len = this.slides.length,
				tpl = '';

			for( ; i < len; i += 1 ) {
				tpl += '<a href="javascript:;">' + this.config.paginationTpl + '</a>';
			}

			this.$pagination.html( tpl );
			this.setActive( 0 );
		},


		getSlideSize : function() {
			this.slideSize = {
                X: 100 / this.config.slidesPerView,
                Y: 100 / this.config.slidesPerView
            };
		},


		getTransforms : function( style ) {
			// console.log( style );
		    var transform = style.transform || style.webkitTransform || style.mozTransform,
		    	regex = /(\w+)\(([^)]*)\)/g,
				match,
				T = {};

			if( typeof transform !== 'string' ) {
				throw 'Transform prop is not a string.';
			}

		    if( !transform ) { return; }

			// Run regex assignment
			while( match = regex.exec( transform ) ) {
				T[ match[ 1 ] ] = parseFloat( match[ 2 ] );
			}

		    return T;
		},

		isNode : function( o ) {
			return (
		    	typeof Node === "object" ? o instanceof Node :
		   			o && typeof o === "object" && typeof o.nodeType === "number" && typeof o.nodeName==="string"
		  	);
		},


		dragHandler : function() {
			var self = this,
				$container = $( this.container ),
				prevBuild = false,
				nextBuild = false,
				dragging = false,
				buffor = 5, // helpful for decoupling with click events
				dragStart, dragMove, dragEnd, progress;

			progress = function( moveX ) {
				return moveX / self.val.viewportW();
			};

			dragStart = function( moveX, startX ) {
				// console.log( 'start', moveX, startX );
			};

			dragMove = function( moveX ) {
				// console.log('move');
				if( self.state.running ) return;

				// Don't need to check for existance here

				if( moveX < -buffor ) {

					if( !nextBuild ) {
						self.state.moveForward = true;
						self.timeline.build();
						nextBuild = true;
						prevBuild = false;
						self.unsetTimer();
					} else {
						// turn progress into positive val
						self.timeline.progress( -progress( moveX ) );
					}
					dragging = true;
				} else if( moveX > buffor ) {

					if( !prevBuild ) {
						self.state.moveForward = false;
						self.timeline.build();
						prevBuild = true;
						nextBuild = false;
						self.unsetTimer();
					} else {
						self.timeline.progress( progress( moveX ) );
					}
					dragging = true;
				}
			};

			dragEnd = function( moveX ) {
				if( dragging ) {
					var prog = progress( moveX ),
						absProg = prog < 0 ? -prog : prog;

					if( absProg > 0.1 ) {
						self.timeline.play( absProg );
						self.setActive( self.nextId( prog < 0 ? 1 : -1 ) );
						if( self.config.fluidHeight ) { self.setHeight( self.nextId( prog < 0 ? 1 : -1 ) ); }
					} else {
						self.timeline.reverse( absProg );
						// eventually move this to reverse callbacks
						if(prog < 0) {
							self.updateId( -1 );
						} else {
							self.updateId( 1 );
						}
					}

					prevBuild = false;
					nextBuild = false;
					dragging = false;
					if( self.config.autoplay ) { self.setTimer( false ); }
				}
			};

			this.drag( $container, dragStart, dragMove, dragEnd );
		},


		drag : function( $el, startFn, moveFn, stopFn ) {

		    var touchX, touchY, movX, movY, go, evt,
		   		prevent, start, move, stop;

		    prevent = function( e ) {
		        e.preventDefault();
		    };

		    start = function( e ) {
		        // $el.on("touchmove", prevent);
		        $el.on("mousemove", prevent);
		        $el.on("touchmove", move);
		        $el.on("mousemove", move);

		        evt = (e.type === 'touchstart') ? e.originalEvent.touches[0] : e;
		        touchX = evt.pageX;

		        if(typeof startFn === 'function') {
		        	startFn(movX, touchX);
		        }
		    };

		    move = function( e ) {
		        evt = (e.type === 'touchmove') ? e.originalEvent.touches[0] : e;
		        movX = evt.pageX - touchX;

	        	if(typeof moveFn === 'function') {
		        	moveFn(movX);
		        }
		    };

		    stop = function( e ) {
		        // $el.off("touchmove", prevent);
		        $el.off("mousemove", prevent);
		        $el.off("touchmove", move);
		        $el.off("mousemove", move);

		    	if(typeof stopFn === 'function') {
		        	stopFn(movX);
		        }
		    };

		    $el.on("touchstart", start);
		    $el.on("mousedown", start);
		    $el.on("touchend", stop);
		    $el.on("touchleave", stop);
		    $el.on("touchcancel", stop);
		    $el.on("mouseup", stop);
		    $el.on("mouseleave", stop);
		},


		dynamicVal : function() {
			var $window = $( window ),
				update,
				getViewportW, viewportW;

			update = function() {
 				viewportW = $window.width();
			};

			getViewportW = function() {
				return viewportW;
			};

			update();
			$window.on( 'load', update );
			$window.on( 'resize', update );

			return {
				viewportW : getViewportW
			};
		}
	};



	//
	// Set of default animations
	//
	// /////////////////////////////////////////////////////////

	MK.ui.Slider.prototype.animation = {

        slide : {
        	axis : 'X',
            next : { transform: {} },
            active : { transform: {} },
            prev : { transform: {} }
        },

        vertical_slide : {
        	axis : 'Y',
            next : { transform: {} },
            active : { transform: {} },
            prev : { transform: {} }
        },

        perspective_flip : {
        	axis : 'Y',
            next : {
            	transform: {
            		rotateX : 80
            	}
            },
            active : {
            	transform: {
            		rotateX : 0
            	}
            },
            prev : {
            	transform: {
            		rotateX : 0
            	}
            }
        },

        zoom : {
			axis : 'Z',
            next: {
                opacity	: 0,
                transform : {
	                scale : 0.9
	            }
            },
            active: {
                opacity	: 1,
                transform : {
	                scale : 1
	            }
            },
            prev: {
                opacity	: 0,
                transform : {
	                scale : 1.1
	            }
            }
        },

        fade : {
			axis : 'Z',
            next: {
                opacity	: 0,
                transform : {}
            },
            active: {
                opacity	: 1,
                transform : {}
            },
            prev: {
                opacity	: 0,
                transform : {}
            }
        },

        kenburned : {
			axis : 'Z',
            next: {
                opacity	: 0,
                transform : {}
            },
            active: {
                opacity	: 1,
                transform : {}
            },
            prev: {
                opacity	: 0,
                transform : {}
            }
        },

        zoom_out : {
			axis : 'Z',
            next: {
				zIndex : '+',
                opacity	: 1,
                transform : {
	                translateY : 100,
	                scale : 1
	            }
            },
            active: {
                opacity	: 1,
                transform : {
	                translateY : 0,
	                scale : 1
	            }
            },
            prev: {
				zIndex : '+',
                opacity	: 0,
                transform : {
	                translateY : 0,
	                scale : 0.5
	            }
            }
        },

        // Problem with Z-Flow
        horizontal_curtain : {
			axis : 'Z',
            next: {
				zIndex : '+',
                transform : {
	                translateX : 100,
	            }
            },
            active: {
                transform : {
	                translateX : 0,
	            }
            },
            prev: {
				zIndex : '+',
                transform : {
	                translateX : -70,
	            }
            }
        },

		roulete : {
			axis : 'X',
            next: {
                opacity	: 0.5,
                transform : {
	                scale : 0.5,
	                rotate : 10,
	                translateY : 20
	            }
            },
            active: {
                opacity	: 1,
                transform : {
	                scale : 1,
	                rotate : 0,
	                translateY : 0
	            }
            },
            prev: {
                opacity	: 0.3,
                transform : {
	                scale : 0.5,
	                rotate : -10,
	                translateY : 20
	            }
            }
		}
	};



	//
	// Penner's easing library
	//
	// /////////////////////////////////////////////////////////

	MK.ui.Slider.prototype.ease = {
		/*
		 *
		 * TERMS OF USE - EASING EQUATIONS
		 *
		 * Open source under the BSD License.
		 *
		 * Copyright Â© 2001 Robert Penner
		 * All rights reserved.
		 *
		 * Redistribution and use in source and binary forms, with or without modification,
		 * are permitted provided that the following conditions are met:
		 *
		 * Redistributions of source code must retain the above copyright notice, this list of
		 * conditions and the following disclaimer.
		 * Redistributions in binary form must reproduce the above copyright notice, this list
		 * of conditions and the following disclaimer in the documentation and/or other materials
		 * provided with the distribution.
		 *
		 * Neither the name of the author nor the names of contributors may be used to endorse
		 * or promote products derived from this software without specific prior written permission.
		 *
		 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
		 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
		 * MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
		 * COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
		 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
		 * GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED
		 * AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
		 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED
		 * OF THE POSSIBILITY OF SUCH DAMAGE.
		 *
		 */
		linearEase : function(currentIteration, startValue, changeInValue, totalIterations) {
			return changeInValue * currentIteration / totalIterations + startValue;
		},

		easeInQuad : function(currentIteration, startValue, changeInValue, totalIterations) {
			return changeInValue * (currentIteration /= totalIterations) * currentIteration + startValue;
		},

		easeOutQuad : function(currentIteration, startValue, changeInValue, totalIterations) {
			return -changeInValue * (currentIteration /= totalIterations) * (currentIteration - 2) + startValue;
		},

		easeInOutQuad : function(currentIteration, startValue, changeInValue, totalIterations) {
			if ((currentIteration /= totalIterations / 2) < 1) {
				return changeInValue / 2 * currentIteration * currentIteration + startValue;
			}
			return -changeInValue / 2 * ((--currentIteration) * (currentIteration - 2) - 1) + startValue;
		},

		easeInCubic : function(currentIteration, startValue, changeInValue, totalIterations) {
			return changeInValue * Math.pow(currentIteration / totalIterations, 3) + startValue;
		},

		easeOutCubic : function(currentIteration, startValue, changeInValue, totalIterations) {
			return changeInValue * (Math.pow(currentIteration / totalIterations - 1, 3) + 1) + startValue;
		},

		easeInOutCubic : function(currentIteration, startValue, changeInValue, totalIterations) {
			if ((currentIteration /= totalIterations / 2) < 1) {
				return changeInValue / 2 * Math.pow(currentIteration, 3) + startValue;
			}
			return changeInValue / 2 * (Math.pow(currentIteration - 2, 3) + 2) + startValue;
		},

		easeInQuart : function(currentIteration, startValue, changeInValue, totalIterations) {
			return changeInValue * Math.pow (currentIteration / totalIterations, 4) + startValue;
		},

		easeOutQuart : function(currentIteration, startValue, changeInValue, totalIterations) {
			return -changeInValue * (Math.pow(currentIteration / totalIterations - 1, 4) - 1) + startValue;
		},

		easeInOutQuart : function(currentIteration, startValue, changeInValue, totalIterations) {
			if ((currentIteration /= totalIterations / 2) < 1) {
				return changeInValue / 2 * Math.pow(currentIteration, 4) + startValue;
			}
			return -changeInValue/2 * (Math.pow(currentIteration - 2, 4) - 2) + startValue;
		},

		easeInQuint : function(currentIteration, startValue, changeInValue, totalIterations) {
			return changeInValue * Math.pow (currentIteration / totalIterations, 5) + startValue;
		},

		easeOutQuint : function(currentIteration, startValue, changeInValue, totalIterations) {
			return changeInValue * (Math.pow(currentIteration / totalIterations - 1, 5) + 1) + startValue;
		},

		easeInOutQuint : function(currentIteration, startValue, changeInValue, totalIterations) {
			if ((currentIteration /= totalIterations / 2) < 1) {
				return changeInValue / 2 * Math.pow(currentIteration, 5) + startValue;
			}
			return changeInValue / 2 * (Math.pow(currentIteration - 2, 5) + 2) + startValue;
		},

		easeInSine : function(currentIteration, startValue, changeInValue, totalIterations) {
			return changeInValue * (1 - Math.cos(currentIteration / totalIterations * (Math.PI / 2))) + startValue;
		},

		easeOutSine : function(currentIteration, startValue, changeInValue, totalIterations) {
			return changeInValue * Math.sin(currentIteration / totalIterations * (Math.PI / 2)) + startValue;
		},

		easeInOutSine : function(currentIteration, startValue, changeInValue, totalIterations) {
			return changeInValue / 2 * (1 - Math.cos(Math.PI * currentIteration / totalIterations)) + startValue;
		},

		easeInExpo : function(currentIteration, startValue, changeInValue, totalIterations) {
			return changeInValue * Math.pow(2, 10 * (currentIteration / totalIterations - 1)) + startValue;
		},

		easeOutExpo : function(currentIteration, startValue, changeInValue, totalIterations) {
			return changeInValue * (-Math.pow(2, -10 * currentIteration / totalIterations) + 1) + startValue;
		},

		easeInOutExpo : function(currentIteration, startValue, changeInValue, totalIterations) {
			if ((currentIteration /= totalIterations / 2) < 1) {
				return changeInValue / 2 * Math.pow(2, 10 * (currentIteration - 1)) + startValue;
			}
			return changeInValue / 2 * (-Math.pow(2, -10 * --currentIteration) + 2) + startValue;
		},

		easeInCirc : function(currentIteration, startValue, changeInValue, totalIterations) {
			return changeInValue * (1 - Math.sqrt(1 - (currentIteration /= totalIterations) * currentIteration)) + startValue;
		},

		easeOutCirc : function(currentIteration, startValue, changeInValue, totalIterations) {
			return changeInValue * Math.sqrt(1 - (currentIteration = currentIteration / totalIterations - 1) * currentIteration) + startValue;
		},

		easeInOutCirc : function(currentIteration, startValue, changeInValue, totalIterations) {
			if ((currentIteration /= totalIterations / 2) < 1) {
				return changeInValue / 2 * (1 - Math.sqrt(1 - currentIteration * currentIteration)) + startValue;
			}
			return changeInValue / 2 * (Math.sqrt(1 - (currentIteration -= 2) * currentIteration) + 1) + startValue;
		}
	};

})(jQuery);

(function($) {
	'use strict';
  var MK = window.MK || {};
  window.MK = MK;
  MK.ui = window.MK.ui || {};

	MK.component.Sortable = function(el) {
		this.el = el;
	};

	MK.component.Sortable.prototype = {
		init: function init() {
			this.cacheElements();
			this.bindEvents();
		},

		cacheElements: function cacheElements() {
			this.unique = Date.now();
			this.$filter = $(this.el);
			this.config = this.$filter.data('sortable-config');

			this.ajaxLoader = new MK.utils.ajaxLoader(this.config.container);
			this.ajaxLoader.init();

			this.$container = $( this.config.container );
			this.$navItems = this.$filter.find('a');
			this.$filterItems = this.$container.find(this.config.item);
		},

		bindEvents: function bindEvents() {
			this.$navItems.on('click', this.handleClick.bind(this));
			MK.utils.eventManager.subscribe('ajaxLoaded', this.onLoad.bind(this));
		},

		handleClick: function handleClick(e) {
			e.preventDefault();

			var $item = $(e.currentTarget);
			var term = $item.data('filter');

			this.$navItems.removeClass('current');
			$item.addClass('current');

			if(this.config.mode === 'ajax') this.inDB(term, $item);
	        else this.inPage(term);
		},

		inDB: function inDB(term, $item) {
			// Add load indicator only for long requests
			MK.ui.loader.remove(this.$filter);
			MK.ui.loader.add($item);

			// If mk-ajax-loaded-posts span exists and one of the filter is clicked,
			// clear post ids
			if ( this.$container.siblings('.mk-ajax-loaded-posts').length ) {
				this.$container.siblings('.mk-ajax-loaded-posts').attr('data-loop-loaded-posts', '');
			}

			this.ajaxLoader.setData({
				paged: 1,
				term: term
			});
            this.ajaxLoader.load(this.unique);
		},

		inPage: function inPage(term) {
			var $filterItems = this.$container.find(this.config.item);
			$filterItems.removeClass('is-hidden'); // show all first
			// Replace all ', ' with ', .'. It's used to add '.' as class selector of each category.
			var className = term.replace( /, /g, ", ." );
			if(term !== '*') $filterItems.not( '.' + className ).addClass('is-hidden'); // hide filtered
			MK.utils.eventManager.publish('staticFilter');
		},

		onLoad: function onLoad(e, response) {
			if(this.config.mode === 'static') {
				this.$navItems.removeClass('current').first().addClass('current');
			}
			if( typeof response !== 'undefined' &&  response.id === this.config.container) {
				MK.ui.loader.remove(this.$filter);
				if(response.unique === this.unique) {
		            this.$container.html(response.content);
					this.ajaxLoader.setData({paged: 1});
				}
			}
		}
	};

})(jQuery);

(function($) {
    'use strict';

    MK.component.Tabs = function( el ) {
        var defaults = {
            activeClass : 'is-active'
        };

        this.config = defaults;
        this.el = el;
    };

    MK.component.Tabs.prototype = {

        init : function() {
            this.cacheElements();
            this.bindEvents();
        },

        cacheElements : function() {
            this.$this  = $( this.el );
            this.$tabs  = this.$this.find( '.mk-tabs-tab' );
            this.$panes = this.$this.find( '.mk-tabs-pane' );
            this.currentId = 0;
        },

        bindEvents : function() {
            var self = this;

            this.$tabs.on( 'click', this.switchPane.bind( this ) );
        },

        switchPane : function( evt ) {
            evt.preventDefault();

            var clickedId = $( evt.currentTarget ).index();

            this.hide( this.currentId );
            this.show( clickedId );

            // Update current id
            this.currentId = clickedId;

            // Notify rest of the app
            MK.utils.eventManager.publish('item-expanded');            
        },

        show : function( id ) {
            this.$tabs.eq( id ).addClass( this.config.activeClass );
            this.$panes.eq( id ).addClass( this.config.activeClass );
        },

        hide : function( id ) {
            this.$tabs.eq( id ).removeClass( this.config.activeClass );
            this.$panes.eq( id ).removeClass( this.config.activeClass );
        }
    };

})(jQuery);


/* Tabs */
/* -------------------------------------------------------------------- */

function mk_tabs() {

  // "use strict";

  // if ($.exists('.mk-tabs, .mk-news-tab, .mk-woo-tabs')) {
  //   $(".mk-tabs, .mk-news-tab, .mk-woo-tabs").tabs();

  //    $('.mk-tabs').on('click', function () {
  //      $('.mk-theme-loop').isotope('layout');
  //    });

  //   $('.mk-tabs.vertical-style').each(function () {
  //     $(this).find('.mk-tabs-pane').css('minHeight', $(this).find('.mk-tabs-tabs').height() - 1);
  //   });

  // }
}

function mk_tabs_responsive(){
  // $('.mk-tabs, .mk-news-tab').each(function () {
  //   $this = $(this);
  //   if ($this.hasClass('mobile-true')) {
  //     if (window.matchMedia('(max-width: 767px)').matches)
  //     {
  //         $this.tabs("destroy");
  //     } else {
  //       $this.tabs();
  //     }
  //   }
  // });
  
}


(function($) {
  'use strict';

  $(document).on('click', function(e) {
    $('.mk-toggle-trigger').removeClass('mk-toggle-active');
  });

  function toggle(e) {
      e.preventDefault();
      e.stopPropagation();
      var $this = $(e.currentTarget);

      if (!$this.hasClass('mk-toggle-active')) {

        $('.mk-box-to-trigger').fadeOut(200);
        $this.parent().find('.mk-box-to-trigger').fadeIn(250);
        $('.mk-toggle-trigger').removeClass('mk-toggle-active');
        $this.addClass('mk-toggle-active');

      } else {

        $('.mk-box-to-trigger').fadeOut(200);
        $this.removeClass('mk-toggle-active');

      }
  }

  function assignToggle() {
    // wait for ajax response propagation and insertion
    setTimeout(function() {
      $('.mk-toggle-trigger').off('click', toggle);
      $('.mk-toggle-trigger').on('click', toggle);
    }, 100);
  }

  assignToggle();
  MK.utils.eventManager.subscribe('ajaxLoaded', assignToggle);
  MK.utils.eventManager.subscribe('ajax-preview', assignToggle);

  $(window).on('vc_reload', function(){
    assignToggle();
    MK.utils.eventManager.subscribe('ajaxLoaded', assignToggle);
    MK.utils.eventManager.subscribe('ajax-preview', assignToggle);
  });

}(jQuery));
(function($) {
    'use strict';

    var init = function init() {
        var Toggle = function(el) {
        var that = this,
            $el = $(el);

            this.$el = $el;
            $el.toggle(that.open.bind(that), that.close.bind(that));
        };

        Toggle.prototype.dom = {
            pane   : 'mk-toggle-pane',
            active : 'active-toggle'
        };

        Toggle.prototype.open = function() {
            var $this = this.$el;
            $this.addClass(this.dom.active);
            $this.siblings('.' + this.dom.pane).slideDown(200);
        };

        Toggle.prototype.close = function() {
            var $this = this.$el;
            $this.removeClass(this.dom.active);
            $this.siblings('.' + this.dom.pane).slideUp(200);
        };

        // Apply to.
        var $toggle = $('.mk-toggle-title');

        if(!$toggle.length) return;

        $toggle.each(function() {
            new Toggle(this);
        });
    }
    $(window).on('load vc_reload', init);

})(jQuery);
/**
 * Add class to tag. It's vanilla js instead of jQuery.
 * @param tag
 * @param className
 */
function addClass(tag, className) {
  tag.className += ' ' + className;
}

/**
* Remove class from tag. It's vanilla js instead of jQuery.
* Replacing should be with g for replacing all occurrence.
*
* @param tag
* @param className
*/
function removeClass(tag, className) {
  tag.className = tag.className.replace(new RegExp(className, 'g'), '');
}

/**
 * Validate email address.
 *
 * @param input
 * @param invalidClassName
 * @returns boolean
 */
function validateEmail(input, invalidClassName) {
    var value = input.value.trim();
    if ((input.required || value.length > 0) && !/^([a-z0-9_\.\-\+]+)@([\da-z\.\-]+)\.([a-z\.]{2,63})$/i.test(value)) {
        if (invalidClassName) {
            addClass(input, invalidClassName);
        }
        return false;
    } else {
        if (invalidClassName) {
            removeClass(input, invalidClassName);
        }
        return true;
    }
}
/**
 * Validate text entry.
 *
 * @param input
 * @param invalidClassName
 * @returns boolean
 */
function validateText(input, invalidClassName) {
    var value = input.value.trim();
    if (input.required && value.length === 0) {
        if (invalidClassName) {
            addClass(input, invalidClassName);
        }
        return false;
    } else {
        if (invalidClassName) {
            removeClass(input, invalidClassName);
        }
        return true;
    }
}
/**
 * Validate Checkbox.
 *
 * @param input
 * @param invalidClassName
 * @returns boolean
 */
function validateCheckBox(input, invalidClassName) {
    if (input.required && input.checked == false) {
        if (invalidClassName) {
            addClass(input, invalidClassName);
        }
        return false;
    } else {
        if (invalidClassName) {
            removeClass(input, invalidClassName);
        }
        return true;
    }
}
/**
 * If we're running under Node for testing purpose.
 */
if (typeof exports !== 'undefined') {
    exports.validateEmail = validateEmail;
    exports.validateText = validateText;
}
(function( $ ) {
    'use strict';

    if( MK.utils.isMobile() ) {
        $('.mk-animate-element').removeClass('mk-animate-element');
        return;
    }


    var init = function init() {
      var $rootLevelEls = $('.js-master-row, .widget');
        $rootLevelEls.each( spyViewport );
        $rootLevelEls.each( function rootLevelEl() {
            var $animateEl = $(this).find( '.mk-animate-element' );
            $animateEl.each( spyViewport );

            /**
             * Firefox has known issue where horizontal scrollbar will appear if an
             * element uses animation CSS. The solution should be set the element
             * position as fixed or overflow-x as hidden. Position fixed is not possible
             * to use because it's only cause other big problems. The best way is
             * set overflow-x as hidden in the page content container #theme-page.
             *
             * NOTE: The problem is spotted on Right To Left viewport only. So, it's
             *       limited to '.right-to-left' selector only for now to avoid other
             *       problems. Please extend the functionallity if it's happen in
             *       other viewport animation effect.
             */
            var browserName  = MK.utils.browser.name;
            if ( browserName === 'Firefox' ) {
                var $rightToLeft = $( this ).find( '.right-to-left' );
                if ( $rightToLeft.length > 0 ) {
                    $( '#theme-page' ).css( 'overflow-x', 'hidden' );
                }
            }
        });
    };

    var spyViewport = function spyViewport(i) {
        var self = this;

        MK.utils.scrollSpy( this, {
            position  : 'bottom',
            threshold : 200,
            after     : function() {
                animate.call(self, i);
            }
        });
    };

    var animate = function animate(i) {
        var $this = $(this);

        setTimeout(function() {
            $this.addClass( 'mk-in-viewport' );
        }, 100 * i);
    };


    $(window).on('load vc_reload', init);

}(jQuery));
