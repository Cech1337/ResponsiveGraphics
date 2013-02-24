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

            //Enable measurement of table content width
 			$(this.element).find('td, th').wrapInner('<span />');

            this.setMaxContentWidth(this.element, this.options);

 			//Attempt to re-calculate positioning until no more changes can be applied
            while(this.detectCollisions(this.element, this.options));
 			
            //Bind throttled resize listener
			$(window).on("throttledresize", function(event){
                console.time("detectCollisions");
				cur.detectCollisions(cur.element, cur.options);
                console.timeEnd("detectCollisions");
			});

        },

        //this should return true when we take action, false when we don't
        detectCollisions : function(el, options){

        	var cur = this;

			if(!$(el).data('split')){

				var changed;
				var minDistance;
                    
                 $(el).find("th").each(function(){
                    var columnWidth = $(this).width();
                    var maxContentWidth = $(this).data('maxContentWidth');
                    var distance = columnWidth - contentWidth;

                    if(minDistance == null || distance < minDistance){
                        minDistance = distance;
                    }

                    //If this cell has less padding than the minimum padding
                    if(distance < options.minPadding){
                        changed = true;

                        //Calculate target font size                
                        var currentFontSize = parseInt($(this).css("font-size"), 10);
                        var targetFontSize = currentFontSize / options.fontRatio;
                        
                        //If reducing the font will shrink it beyond the min font size, go responsive
                        if(targetFontSize < options.minFontSize){
                            cur.splitTable(el, options);
                        }
                        //Else targetFontSize is within the accepted range and should be applied
                        else{
                            cur.reduceFont(el, options);
                        }

                        return false;
                    }
                });

                //If we split table or reduced the font
                if(changed){
                    return true;
                } 
                //Else if the table has room, grow the font
                else if(minDistance > options.maxPadding && $(el).data('reduceFactor') < 0){
                    this.growFont(el, options);
                    return true
                }
			}

			//Else the table is split and detect if it's ready to be unsplit
			else{
                //If the table container is larger than the original split table
				if($(el).width() > $(el).data('splitWidth')){
					this.unsplitTable(el, options);
                    return true;
				}
			}

            //No action
            return false;

        },

        setMaxContentWidth : function(el, options){
            console.time("setMaxContentWidth");

            var table = $(el).find("table");

            //For every column, find the maximum content width and store it as a data object on the column header
            for (var i = 1; i < $(table).find("th").length + 1; i++) {
                var maxWidth = 0;
                $(table).find("tr *:nth-child(" +i+ ") span").each(function(){
                    contentWidth = $(this).width();
                    if(contentWidth > maxWidth){
                        maxWidth = contentWidth;
                    }
                });
                $(table).find("tr *:nth-child(" +i+ ") th").data('maxContentWidth', maxWidth);
            };
            console.timeEnd("setMaxContentWidth");
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
        },

        growFont : function(el, options){
        	console.time("growFont");

			var currentReduce = $(el).data('reduceFactor');
			var newReduce = currentReduce + 1;

			$(el).removeClass("reduce" + currentReduce);
			$(el).data('reduceFactor', newReduce);
			$(el).addClass("reduce" + newReduce);

            console.timeEnd("growFont");
        },

        splitTable : function(el, options){
        	console.time("splitTable");


            //Grab original table and wrap it in a div split
            //var original = $(el).find("table").wrap('<div class="split" />');
            original = $(el).find("table");
            $(original).parent().addClass("split");

            // console.log(
            //     "el: " + $(el).width() + "\n" +
            //     "table: " + $(original).width() + "\n" +
            //     "window: " + $(window).width() + "\n" +
            //     "document: " + $(document).width()
            // );

            $(el).data('split', true);
            $(el).data('splitWidth', $(original).width());

            var pinned = $(original).wrap('<div class="pinned" />').parent();
            var scrollable = $(original).clone().wrap('<div class="scrollable" />').parent();

            //Hide non-first child elements from pinned
            $(pinned).find("td:not(:first-child), th:not(:first-child)").hide();

            //Calculate a margin for the scrollable table
            var pinnedWidth = $(pinned).children().width();

            //Insert scrollable table as a sibling to pinned and hide left column
            $(scrollable).insertAfter(pinned).find("td:first-child, th:first-child").hide();
            $(scrollable).css("margin-left", pinnedWidth);

            //Check scroll position and attach scroll listener to check for edge scrolls
            var cur = this;
            cur.checkScrollPosition(scrollable);
            $(scrollable).scroll(function(){
                cur.checkScrollPosition(scrollable);
            });

            console.timeEnd("splitTable");
        },

        unsplitTable : function(el, options){
        	console.time("unsplitTable");

            // console.log(
            //     "table: " + $(el).width() + "\n" +
            //     "window: " + $(window).width() + "\n" +
            //     "document: " + $(document).width()
            // );

			$(el).data('split', false);

            var pinnedTable = $(el).find(".pinned table");

            //Remove scrolling table
            $(pinnedTable).parent().siblings().remove();

            //Return the pinned table to normal
            $(pinnedTable).unwrap().parent().removeClass("split").find("td:not(:first-child), th:not(:first-child)").show();

            console.timeEnd("unsplitTable");
        },

        checkScrollPosition : function(scrollable){

                var scrollLeft = $(scrollable).scrollLeft();
                var width = $(scrollable).outerWidth();
                var tableWidth = $(scrollable).find("table").outerWidth();


                if(scrollLeft > 0){
                    $(scrollable).addClass("content-hidden-left");
                } 
                else{
                    $(scrollable).removeClass("content-hidden-left");
                }

                if(scrollLeft < tableWidth - width){
                    $(scrollable).addClass("content-hidden-right");
                }
                else{
                    $(scrollable).removeClass("content-hidden-right");
                }

                // console.log(
                //     "SL: " + scrollLeft +"\n"+
                //     "Width: " + width +"\n"+
                //     "TW: " + tableWidth +"\n"+
                //     "TW - Width: " + (tableWidth - width)
                // );
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