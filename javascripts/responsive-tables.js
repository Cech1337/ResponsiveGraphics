/*  -----------------------------------------------------------------------------
	::  Detect table cell collisions and resize or go responsive
	----------------------------------------------------------------------------- */

;(function ($, window, document, undefined) {

    var pluginName = "responsiveTable",
        defaults = {
            minPadding: 10,
            maxPadding: 30, 
            minFontSize: 10, 
            fontRatio: 1.618,
            maxNumRows: null
        };	

    // The actual plugin constructor 
    function ResponsiveTable(element, options) {
        this.element = element;
        this.options = $.extend( {}, defaults, options );
        this.maxContentWidth = [];

        this._defaults = defaults;
        this._name = pluginName;

        this.init();
    }

    ResponsiveTable.prototype = {

        init : function(){

            var cur = this;
 			
            //Store table state information on the element
            $(this.element).data({
                'split':        false,
                'splitWidth':   null,
                'reduceFactor': 0,
                'fontSize':     $(this.element).css('font-size') 
            });

            //console.log("init font size: " + $(this.element).css('font-size') );

            //Enable measurement of table content width
 			$(this.element).find('td, th').wrapInner('<span />');
            
            //Calculate maximum column widths
            //this.setMaxContentWidth(this.element, this.options);

            //New method for column widths
            this.setMaxContentWidthVert(this.element, this.maxContentWidth);

            this.splitTableHeaders(this.element, this.maxContentWidth);

 		// 	//Attempt to re-calculate positioning until no more changes can be applied
   //          while(this.detectCollisions(this.element, this.options));
 			
			// $(window).on("throttledresize", function(event){

   //              //If the font size has changed, reset max content widths
   //              var currentFontSize = $(cur.element).css("font-size");
   //              var recordedFontSize = $(cur.element).data('fontSize');
   //              if( currentFontSize != recordedFontSize ){
   //                  cur.setMaxContentWidth(cur.element, cur.options);
   //                  $(cur.element).data('fontSize', currentFontSize);
   //                  console.log("font size changed from  " + recordedFontSize + " to " + currentFontSize);
   //              }

   //             // console.time("detectCollisions");
			// 	cur.detectCollisions(cur.element, cur.options);
   //              //console.timeEnd("detectCollisions");
			// });

        },

        //this should return true when we take action, false when we don't
        detectCollisions : function(el, options){

        	var cur = this;

			if(!$(el).data('split')){

				var changedSettings;
				var minDistance;
                    
                 $(el).find("th").each(function(){
                    var columnWidth = $(this).width();
                    var maxContentWidth = $(this).data('maxContentWidth');
                    var distance = columnWidth - maxContentWidth;

                    if(minDistance == null || distance < minDistance){
                        minDistance = distance;
                    }

                    // console.log(
                    //     "columnWidth: " + columnWidth + "\n" +
                    //     "maxContentWidth: " + maxContentWidth + "\n" +
                    //     "distance: " + distance + "\n" +
                    //     "eval: " + (distance < options.minPadding)
                    // );

                    //If this cell has less padding than the minimum padding
                    if(distance < options.minPadding){

                        //Calculate target font size                
                        var currentFontSizeInt = parseInt($(this).css("font-size"), 10);
                        var targetFontSize = currentFontSizeInt / options.fontRatio;
                        
                        //If reducing the font will shrink it beyond the min font size, go responsive
                        if(targetFontSize < options.minFontSize){
                            cur.splitTable(el, options);
                        }
                        //Else targetFontSize is within the accepted range and should be applied
                        else{
                            cur.reduceFont(el, options);
                        }

                        //Indicate that we've taken a change
                        changedSettings = true;

                        //Stop checking for collisions 
                        return false;
                    }
                });

                //If we split table or reduced the font
                if(changedSettings){
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
            var th = $(table).find("th");

            $(th).each(function(i){

                var maxWidth = 0;

                //Add one to index for nth child selector
                i++;

                $(table).find("tr *:nth-child(" +i+ ") span").each(function(){
                    var contentWidth = $(this).width();
                    if(contentWidth > maxWidth){
                        maxWidth = contentWidth;
                    }
                });
                
                //console.log("Column " + i + " maxWidth: " + maxWidth);
                $(this).data('maxContentWidth', maxWidth);
            });
            console.timeEnd("setMaxContentWidth");
        },

        setMaxContentWidthVert : function(el, maxContentWidth){
            console.time("setMaxContentWidth VERT");

            //For every row
            $(el).find("tr").each(function(){
                //For every column
                $(this).find('span').each(function(i){
                    var width = $(this).width();
                    if(maxContentWidth[i] == undefined){  // width > el.maxContentWidth[i] || 
                        maxContentWidth[i] = width;
                    }

                });        
            });

            console.timeEnd("setMaxContentWidth VERT");
        },

        splitTableHeaders : function(el, maxContentWidth){
            console.time("splitTableHeaders");

            //Store table in memory
            var origTable = $(el).find('table');
            var table = $(origTable).clone();

            //Remove table componenets
            var header = $(table).find('thead').detach();
            var body = $(table).find('tbody').detach();
            
            //Set header min-widths
            $(header).find('span').each(function(i){
                $(this).css('min-width', maxContentWidth[i]);
            });

            //Set body min-widths on the first row (in case headers are wider than content) NEEDS DEBUG?
            // $(body).find('tr').get(0).find('span').each(function(i){
            //     $(this).css('min-width', maxContentWidth[i]);
            // });

            //Wrap the components
            var tableHeader = $(header).wrap('<div class="header-wrapper"><table /></div>').parent().parent();
            var tableBody = $(body).wrap('<div class="body-wrapper"><table /></div>').parent().parent();

            //Merge them
            var mergedTable = $(tableHeader).after(tableBody);

            //Reinsert table header and body content
            $(origTable).replaceWith(mergedTable);


            console.timeEnd("splitTableHeaders");
        },

        splitTableVert : function(el, options){
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

            console.log("New split width: " + $(original).width());

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

        unsplitTableVert : function(el, options){
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

            console.log("New split width: " + $(original).width());

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
            console.log("growFont");

            var currentReduce = $(el).data('reduceFactor');
            var newReduce = currentReduce + 1;

            $(el).removeClass("reduce" + currentReduce);
            $(el).data('reduceFactor', newReduce);
            $(el).addClass("reduce" + newReduce);
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