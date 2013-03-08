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

        this.isSplit = false;
        this.splitWidth = undefined;
        this.reduceFactor = 0;
        this.fontSize = parseInt(element.css('font-size'), 10);

        this.columnHeaders;

        this._defaults = defaults;
        this._name = pluginName;

        this.init();
    }

    ResponsiveTable.prototype = {

        init : function(){

            //Enable measurement of table content width and min-width setting
 			$(this.element).find('td, th').wrapInner('<div><span /></div>');

            //Initialize max content widths
            this.findMaxColContentWidth(this.element, this.maxContentWidth);

            //Split the table headers off from the table body to enable locked headers (might want to detect this instead of init)
            this.splitTableHeaders(this.element, this.maxContentWidth);

            //Attempt to re-calculate positioning until no more changes can be applied
            this.handleCollisions(this.element, this.options);

            //Attach throttled resize handler
            var cur = this;            
            $(window).on("throttledresize", function(event){
                cur.handleFontSizeChange(cur.element);
                //console.time("handleCollisions");
                cur.handleCollisions(cur.element, cur.options);
                //console.timeEnd("handleCollisions");
            });

        },

        //this should return true when we take action, false when we don't
        handleCollisions : function(el, options){

        	var cur = this;

			if(!this.isSplit){

				var changedSettings;
				var minDistance;
                 
                //This presumes a single header row... 
                $(el).find("th").each(function(i){

                    var columnWidth = $(this).width();
                    var maxColContent = cur.maxContentWidth[i];
                    var distance = columnWidth - maxColContent;

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

        handleFontSizeChange : function (el){
            //If the font size has changed, reset max content widths
            var currentFontSize = $(el).css("font-size");
            var recordedFontSize = $(el).data('fontSize');

            if( currentFontSize != recordedFontSize ){

                $(el).data('fontSize', currentFontSize);
                console.warn("font size changed from  " + recordedFontSize + " to " + currentFontSize);

                //Reset content widths
                this.maxContentWidth.length = 0;

                //Recalculate max content widths
                this.findMaxColContentWidth(el, this.maxContentWidth);
                
                //Update min-col widths to reflect the new content size  
                console.time("setColMinWidth");             
                this.setColMinWidth(this.element, this.maxContentWidth);
                console.timeEnd("setColMinWidth");
            }
        },

        findMaxColContentWidth : function(el, maxContentWidth){
            console.time("findMaxColContentWidth");

            var split = $(el).data('split');
            var pinnedCols;

            //If the table is split, check pinned cols first
            if(split){
                //For every row
                $(el).find('.pinned').find("tr").each(function(){
                    //For every column
                    var span = $(this).find('span');
                    pinnedCols = span.length;
                    $(span).each(function(i){
                        var width = $(this).width();
                        if(maxContentWidth[i] == undefined || width > maxContentWidth[i]){ 
                            maxContentWidth[i] = width;
                        }
                    });        
                });
                el = $(el).find('.scrollable');
            }

            //For every row
            $(el).find("tr").each(function(){
                //For every column
                $(this).find('span').each(function(i){
                    //If split, skip the number of pinned cols
                    if(split){
                        i += pinnedCols;
                    }
                    var width = $(this).width();
                    if(maxContentWidth[i] == undefined || width > maxContentWidth[i]){ 
                        maxContentWidth[i] = width;
                    }
                });        
            });

            console.log("Max cwidth: " + maxContentWidth);
            console.timeEnd("findMaxColContentWidth");
        },

        //Calculates column widths, whether or not table content is split across multiple tables
        setColMinWidth : function(el, maxContentWidth){

            var header = $(el).find('thead');
            var body = $(el).find('tbody');

            var pinnedCols;

            if(this.isSplit){
                $(header).eq(0).find('div').each(function(i){
                    pinnedCols = this.length;
                    $(this).css('min-width', maxContentWidth[i]);
                });
                $(body).eq(0).find('div').each(function(i){
                    $(this).css('min-width', maxContentWidth[i]);
                });

                header = header.eq(1);
                body = body.eq(1);
            }
            
            //Set header min-widths
            $(header).find('tr').eq(0).find('div').each(function(i){
                if(split){
                    i += pinnedCols;
                }
                $(this).css('min-width', maxContentWidth[i]);
            });

            //Set body min-widths on the first row (in case headers are wider than content) NEEDS DEBUG?
            $(body).find('tr').eq(0).find('div').each(function(i){
                if(split){
                    i += pinnedCols;
                }
                $(this).css('min-width', maxContentWidth[i]);
            });


        },


        //Run once - table headers are always split.
        splitTableHeaders : function(el, maxContentWidth){
            console.time("splitTableHeaders");

            //Store table in memory
            var origTable = $(el).find('table');
            var table = $(origTable).clone();

            //Remove table componenets
            var header = $(table).find('thead').detach();
            var body = $(table).find('tbody').detach();
            
            //Set their column widths
            this.setColMinWidth(el, maxContentWidth);

            //Wrap the components
            var tableHeader = $(header).wrap('<div class="header-wrapper"><table /></div>').parent().parent();
            var tableBody = $(body).wrap('<div class="body-wrapper"><table /></div>').parent().parent();

            //Merge them
            var mergedTable = $(tableHeader).after(tableBody);

            //Reinsert table header and body content
            $(origTable).replaceWith(mergedTable);

            console.timeEnd("splitTableHeaders");
        },

        pinColumn : function (el){

        },

        unpinColumn : function (el){

        },

        //In theory this will pin tables for both vertically split and default tables
        splitTable : function(el, options){
            console.time("splitTable");

            var tableContainer = $(el.tableContainer).addClass('split');

            //Set table state to split, set split width            
            this.isSplit = true;
            this.splitWidth = $(tableContainer).find('table').eq(0).width();
            console.log("New split width: " + this.SplitWidth);
            
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

            //Attach scroll handler -- should detect vert scroll first anyway...
            this.attachScrollHandler(el);

            console.timeEnd("splitTable");
        },

        unsplitTable : function(el, options){
            console.time("unsplitTable");

            $(el).data('split', false);
            var origContainer = $(el).find('.split');
            var tableContainer = $(origContainer).clone();

            $(tableContainer).removeClass('split');

            //Merge pinned tablehead into scrollable table head
            var pinned = $(tableContainer).find('.pinned');
            var scrollable = $(tableContainer).find('.scrollable');

            var pinnedHeadRows = $(pinned).find('thead tr');
            var scrollableHeadRows = $(scrollable).find('thead tr');

            var pinnedBodyRows = $(pinned).find('tbody tr');
            var scrollableBodyRows = $(scrollable).find('tbody tr');

            $(pinnedHeadRows).each(function(i){
                var pinnedHeadContent = $(this).children();
                $(scrollableHeadRows).eq(i).prepend(pinnedHeadContent);
            });

            $(pinnedBodyRows).each(function(i){
                var pinnedBodyContent = $(this).children();
                $(scrollableBodyRows).eq(i).prepend(pinnedBodyContent);
            });

            $(pinned).remove();
            $(scrollable).removeClass('scrollable').css('margin-left', 0).unwrap();

            $(origContainer).replaceWith(tableContainer);

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

        attachScrollHandler : function(el){

            cur = this;

            var tableBodyWrapper = $(el).find('.scrollable .body-wrapper');
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

                //Determine where to show shadows
            });
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