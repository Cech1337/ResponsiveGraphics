/*  -----------------------------------------------------------------------------
	::  Detect table cell collisions and resize or go responsive
	----------------------------------------------------------------------------- */

;(function ($, window, document, undefined) {

    var pluginName = "responsiveTable",
        defaults = {
            minPadding: 10,
            maxPadding: 30, 
            minFontSize: 10, 
            fontRatio: 1.618
        };	

    // The actual plugin constructor 
    function ResponsiveTable(element, options) {
        this.element = element;
        this.options = $.extend( {}, defaults, options );

        this._defaults = defaults;
        this._name = pluginName;

        this.init();
    }

    ResponsiveTable.prototype = {

        init : function(){

            var cur = this;
 			
            $(this.element).data('split', false);
            $(this.element).data('splitWidth', null);
            $(this.element).data('reduceFactor', 0);
            $(this.element).data('minDistance', null);

            //Enable measurement of table content width
 			$(this.element).find('td, th').wrapInner('<span />');

 			//Update table state on first run
 			this.detectCollisions(this.element, this.options);

            //Bind throttled resize listener
			$(window).on("throttledresize", function(event){
				cur.detectCollisions(cur.element, cur.options);
			});

        },

        detectCollisions : function(el, options){

        	var cur = this;

			if(!$(el).data('split')){

				var resized;
				var minDistance = $(el).data('minDistance');

				// For each table cell, detect potential column collisions
				$(el).find("table span").each(function(){

					var contentWidth = $(this).width(); 
					var columnWidth = $(this).parent().width();
					var distance = columnWidth - contentWidth;

					if(minDistance == null || distance < minDistance){
						minDistance = distance;
					}

					//If this cell has less padding than the minimum padding
					if(distance < options.minPadding){

						//Calculate target font size				
						var currentFontSize = parseInt($(this).css("font-size"), 10);
						var targetFontSize = currentFontSize / options.fontRatio;
						
						//If reducing the font will shrink it beyond the min font size, go responsive
						if(targetFontSize < options.minFontSize){
							resized = true;
							return cur.splitTable(el, options);
						}
						//Else targetFontSize is within the accepted range and should be applied
						else{
							return cur.reduceFont(el, options);
						}
					}
				});

				//If all cells have more than maxPadding distance, expand font size until font-size is not scaled from base
				if(!resized && minDistance > options.maxPadding && $(el).data('reduceFactor') < 0){
					return this.growFont(el, options);
				}
			}

			//Else the table is split and detect if it's ready to be unsplit
			else{
				if($(window).width() > $(el).data('splitWidth')){
					return this.unsplitTable(el, options);
				}
			}

        },

     	reduceFont : function(el, options){
			console.log("reduceFont");

			var currentReduce = $(el).data('reduceFactor');
			var newReduce = currentReduce - 1;

			$(el).removeClass("reduce" + currentReduce);
			$(el).data('reduceFactor', newReduce);
			$(el).addClass("reduce" + newReduce);

			//Don't attempt to increase size on this loop
			resized = true;

			return false;
        },

        growFont : function(el, options){
        	console.log("growFont");

			var currentReduce = $(el).data('reduceFactor');
			var newReduce = currentReduce + 1;

			$(el).removeClass("reduce" + currentReduce);
			$(el).data('reduceFactor', newReduce);
			$(el).addClass("reduce" + newReduce);

			//Don't attempt to increase size on this loop
			resized = true;

        	return false;
        },

        splitTable : function(el, options){
        	console.log("splitTable");

			$(el).data('split', true);
            $(el).data('splitWidth', $(window).width());

            //Grab original table and wrap it in a div split
            var original = $(el).find("table").wrap('<div class="split" />');

            var pinned = $(original).wrap('<div class="pinned" />').parent();
            var scrollable = $(original).clone().wrap('<div class="scrollable" />').parent();

            //Hide non-first child elements from pinned
            $(pinned).find("td:not(:first-child), th:not(:first-child)").hide();

            //Calculate a margin for the scrollable table
            var pinnedWidth = $(pinned).children().width();

            //Insert scrollable table as a sibling to pinned and hide left column
            $(scrollable).insertAfter(pinned).find("td:first-child, th:first-child").hide();
            $(scrollable).css("margin-left", pinnedWidth);

        	return false;
        },

        unsplitTable : function(el, options){
        	console.log("unsplitTable");

			$(el).data('split', false);

            var pinnedTable = $(el).find(".pinned table");

            //Remove scrolling table
            $(pinnedTable).parent().siblings().remove();

            //Return the pinned table to normal
            $(pinnedTable).unwrap().unwrap().find("td:not(:first-child), th:not(:first-child)").show();

        	return false;
        }
    };


    // A really lightweight plugin wrapper around the constructor,
    // preventing against multiple instantiations and allowing any
    // public function (ie. a function whose name doesn't start
    // with an underscore) to be called via the jQuery plugin,
    // e.g. $(element).defaultPluginName('functionName', arg1, arg2)
    $.fn[pluginName] = function ( options ) {
        var args = arguments;
        if (options === undefined || typeof options === 'object') {
            return this.each(function () {
                if (!$.data(this, 'plugin_' + pluginName)) {
                    $.data(this, 'plugin_' + pluginName, new ResponsiveTable( this, options ));
                }
            });
        } else if (typeof options === 'string' && options[0] !== '_' && options !== 'init') {
            return this.each(function () {
                var instance = $.data(this, 'plugin_' + pluginName);
                if (instance instanceof ResponsiveTable && typeof instance[options] === 'function') {
                    instance[options].apply( instance, Array.prototype.slice.call( args, 1 ) );
                }
            });
        }
    }

})( jQuery, window, document );