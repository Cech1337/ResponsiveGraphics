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
            maxNumRows: null  //Prob not going to use this --- should I set in CSS or in JS?
        };	

    // The plugin constructor 
    function ResponsiveTable(element, options) {
        this.element = element;
        this.options = $.extend( {}, defaults, options );

        this.maxContentWidth = [];
        this.columnWidth = [];
        this.element.tableContainer = $(element).find('table').parent();

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

            //Enable measurement of table content width and min-width setting
 			$(this.element).find('td, th').wrapInner('<div><span /></div>');

            //Initialize max content widths
            this.setMaxContentWidth(this.element, this.maxContentWidth);

            //Split the table vertically to enable locked headers
            this.splitTableHeaders(this.element, this.maxContentWidth);

            //TEST pin table
            this.splitTable(this.element, this.options);


            //Test attaching resize handler to the table body this should really happen later on....
            var tableBodyWrapper = $(this.element).find('.scrollable .body-wrapper')
            $(tableBodyWrapper).on("scroll", function(e){
                
                var tableBody = $(this).find('table');
                var tableHeader = $(this).prev().children('table');
                var pinnedTableBody = $(cur.element).find('.pinned .body-wrapper table');

                var scrollLeft = $(this).scrollLeft();
                var scrollTop = $(this).scrollTop();

                var containerWidth = $(this).outerWidth();
                var tableWidth = $(tableBody).outerWidth();
                var containerHeight = $(this).outerHeight();
                var tableHeight = $(tableBody).outerHeight();

                $(tableHeader).css("left", -scrollLeft);
                $(pinnedTableBody).css("top", -scrollTop);

                // if(scrollLeft > 0){
                //     $(scrollable).addClass("content-hidden-left");
                // } 
                // else{
                //     $(scrollable).removeClass("content-hidden-left");
                // }

                // if(scrollLeft < tableWidth - width){
                //     $(scrollable).addClass("content-hidden-right");
                // }
                // else{
                //     $(scrollable).removeClass("content-hidden-right");
                // }

                // console.log(
                //     "SL: " + scrollLeft +"\n"+
                //     "Width: " + width +"\n"+
                //     "TW: " + tableWidth +"\n"+
                //     "TW - Width: " + (tableWidth - width)
                // );
            });


 			//Attempt to re-calculate positioning until no more changes can be applied
            //while(this.detectCollisions(this.element, this.options));
 			
			$(window).on("throttledresize", function(event){

                //If the font size has changed, reset max content widths
                var currentFontSize = $(cur.element).css("font-size");
                var recordedFontSize = $(cur.element).data('fontSize');
                if( currentFontSize != recordedFontSize ){
                    //Recalculate max content widths
                    cur.setMaxContentWidth(cur.element, cur.maxContentWidth);
                    $(cur.element).data('fontSize', currentFontSize);
                    console.warn("font size changed from  " + recordedFontSize + " to " + currentFontSize);

                    //Update min-col widths to reflect the new content size  
                    console.time("setColMinWidth");             
                    cur.setColMinWidth(cur.maxContentWidth, $(cur.element).find('thead'), $(cur.element).find('tbody'));
                    console.timeEnd("setColMinWidth");

                }

                //console.time("detectCollisions");
				//cur.detectCollisions(cur.element, cur.options);
                //console.timeEnd("detectCollisions");
			});

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

        setMaxContentWidth : function(el, maxContentWidth){
            console.time("setMaxContentWidth");

            //For every row
            $(el).find("tr").each(function(){
                //For every column
                $(this).find('span').each(function(i){
                    var width = $(this).width();
                    if(maxContentWidth[i] == undefined || width > maxContentWidth[i]){ 
                        maxContentWidth[i] = width;
                    }
                });        
            });

            console.log("Max cwidth: " + maxContentWidth);
            console.timeEnd("setMaxContentWidth");
        },

        setColMinWidth : function(maxContentWidth, header, body){
            //Lock header and body columns (this should update on every font resize)
            //Set header min-widths
            $(header).find('div').each(function(i){
                $(this).css('min-width', maxContentWidth[i]);
            });

            //Set body min-widths on the first row (in case headers are wider than content) NEEDS DEBUG?
            $(body).find('tr').eq(0).find('div').each(function(i){
                $(this).css('min-width', maxContentWidth[i]);
            });
        },

        splitTableHeaders : function(el, maxContentWidth){
            console.time("splitTableHeaders");

            //Store table in memory
            var origTable = $(el).find('table');
            var table = $(origTable).clone();

            //Remove table componenets
            var header = $(table).find('thead').detach();
            var body = $(table).find('tbody').detach();
            
            //Set their column widths
            this.setColMinWidth(maxContentWidth, header, body);

            //Wrap the components
            var tableHeader = $(header).wrap('<div class="header-wrapper"><table /></div>').parent().parent();
            var tableBody = $(body).wrap('<div class="body-wrapper"><table /></div>').parent().parent();

            //Merge them
            var mergedTable = $(tableHeader).after(tableBody);

            //Reinsert table header and body content
            $(origTable).replaceWith(mergedTable);


            console.timeEnd("splitTableHeaders");
        },

        //In theory this will pin tables for both vertically split and default tables
        splitTable : function(el, options){
            console.time("splitTable");

            //Set table state to split, set split width            
            $(el).data('split', true);
            $(el).data('splitWidth', $(el).width());

            console.log("New split width: " + $(el).width());

            var tableContainer = $(el.tableContainer).addClass('split');
            
            //Grab the contents and clone twice
            var pinned = $(tableContainer).clone();
            var scrollable = $(tableContainer).clone();

            //Remove appropriate elements
            $(pinned).find("td:not(:first-child), th:not(:first-child)").remove();
            $(scrollable).find("td:first-child, th:first-child").remove();
    
            //Wrap the contents
            $(pinned).wrapInner('<div class="pinned" />');
            $(scrollable).wrapInner('<div class="scrollable" />');

            //Replace contents of the table container with the new content
            $(el.tableContainer).replaceWith($(pinned).append( $(scrollable).html() ));

            //Set scrollable width -- this should have been based off of existing for performance.
            scrollable = $(el).find('.scrollable');
            $(scrollable).css("margin-left", $(el).find('.pinned').width());

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