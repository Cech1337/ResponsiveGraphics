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

        this._defaults = defaults;
        this._name = pluginName;

        this.maxContentWidth = [];
        //This could be used to keep track of the widest content nodes, so we don't have to scan every cell, just these (plus new ones to compare width when added)
        this.maxContentWidthNodes = [];
        this.columnWidth = [];

        this.isSplit = false;
        this.splitWidth = undefined;
        this.reduceFactor = 0;
        this.fontSize = parseInt($(element).css('font-size'), 10);

        this.scrollBarWidth = scrollbarWidth();

        this.init();
    }

    ResponsiveTable.prototype = {

        init : function(){

            //Enable measurement of table content width and setting column min-width
 			$(this.element).find('td, th').wrapInner('<div><span /></div>');

            //Init calculate max content widths
            this.findMaxColContentWidth(this.element, this.maxContentWidth);

            //Split the table headers off from the table body to enable locked headers (might want to detect this instead of init)
            this.splitTableHeaders(this.element, this.maxContentWidth);

            //Set their column widths
            this.setColMinWidth(this.element, this.maxContentWidth);

            //Attempt to re-calculate positioning until no more changes can be applied
            for (var i = 0; i < 3; i++) {
                this.handleCollisions(this.element, this.options);
            };


            //Attach throttled resize handler
            var cur = this;            
            $(window).on("throttledresize", function(event){
                cur.handleFontSizeChange(cur.element, cur.options);
                //console.time("handleCollisions");
                cur.handleCollisions(cur.element, cur.options);
                //console.timeEnd("handleCollisions");
            });

        },

        //this should return true when we take action, false when we don't
        handleCollisions : function(el, options){

        	var cur = this;

            //If the table is not split
			if(!this.isSplit){

				var changedSettings;
				var minDistance;
                 
                //For each TH in the last row of the header
                $(el).find('thead').find('tr').last().find('th').each(function(i){

                    //Find the current width of the content and compare it with the max content width
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
                        var targetFontSize = cur.fontSize / options.fontRatio;
                        
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
                else if(minDistance > options.maxPadding && this.reduceFactor < 0){
                    this.growFont(el);
                    return true
                }
			}

			//Else the table is split and detect if it's ready to be unsplit
			else{
                //If the table container is larger than the original split table
				if($(el).width() > this.splitWidth){
					this.unsplitTable(el, options);
                    return true;
				}
			}

            //No action
            return false;

        },

        //Is this checking everything?
        findMaxColContentWidth : function(el, maxContentWidth){
            console.time("findMaxColContentWidth");

            var isSplit = this.isSplit;
            var pinnedCols;

            //If the table is split, check pinned cols first
            if(isSplit){
                //For every row
                $(el).find('.pinned').find("tr").each(function(){
                    //For every column
                    var span = $(this).find('span');
                    pinnedCols = span.length;
                    span.each(function(i){
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
                    if(isSplit){
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
            // console.time("setColMinWidth");

            var header = $(el).find('thead');
            var body = $(el).find('tbody');

            var pinnedCols;

            var isSplit = this.isSplit;

            if(isSplit){
                header.eq(0).find('tr').last().find('div').each(function(i){
                    pinnedCols = $(this).length;
                    $(this).css('min-width', maxContentWidth[i]);
                });
                body.eq(0).find('tr').first().find('div').each(function(i){
                    $(this).css('min-width', maxContentWidth[i]);
                });

                header = header.eq(1);
                body = body.eq(1);
            }
            
            //Set header min-widths
            header.find('tr').eq(0).find('div').each(function(i){
                if(isSplit){
                    i += pinnedCols;
                }
                $(this).css('min-width', maxContentWidth[i]);
            });

            //Set body min-widths on the first row (in case headers are wider than content) NEEDS DEBUG?
            body.find('tr').eq(0).find('div').each(function(i){
                if(isSplit){
                    i += pinnedCols;
                }
                $(this).css('min-width', maxContentWidth[i]);
            });

            // console.time("setColMinWidth");
        },

        splitTable : function(el){
            // console.time("splitTable");

            //Set table state to split, set split width               
            var tableContainer = $(el).find('.tableContainer').addClass('split');
            this.isSplit = true;
            this.splitWidth = $(tableContainer).find('table').eq(0).width();
            console.log("New split width: " + this.splitWidth);
            
            //Grab the contents and clone twice
            var pinned = $(tableContainer).clone();
            var scrollable = $(tableContainer).clone();

            //Remove appropriate elements -- this only works for single pinned col tables
            pinned.find("td:not(:first-child), th:not(:first-child)").remove();
            scrollable.find("td:first-child, th:first-child").remove();
    
            //Wrap the contents
            pinned.wrapInner('<div class="pinned" />');
            scrollable.wrapInner('<div class="scrollable" />');

            //Replace contents of the table container with the new content
            $(tableContainer).replaceWith(pinned.append( scrollable.html() ));

            //Set scrollable width
            scrollable = $(el).find('.scrollable');
            $(scrollable).css("margin-left", $(el).find('.pinned').width() + 1);

            //Poor man's substitute
            $(el).children('.tableContainer').addClass("content-hidden-bottom").addClass("content-hidden-right");

            // console.timeEnd("splitTable");

            //Attach scroll handler -- scroll handling should occur before this if we vert scroll...
            this.attachScrollHandler(el);
        },

        unsplitTable : function(el){
            // console.time("unsplitTable");

            this.isSplit = false;
            var origContainer = $(el).find('.tableContainer');
            var tableContainer = $(origContainer).clone();

            $(tableContainer).removeClass('split');

            //Merge pinned tablehead into scrollable table head
            var pinned = $(tableContainer).find('.pinned');
            var scrollable = $(tableContainer).find('.scrollable');

            //Remove scrollable table offset
            scrollable.find('.header-wrapper table').css('left', 0);

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
            $(scrollable).removeClass('scrollable').css('margin-left', 0).children().eq(0).unwrap();

            $(origContainer).replaceWith(tableContainer);

            // console.timeEnd("unsplitTable");
        },        

        reduceFont : function(el){
            console.log("reduceFont");

            $(el).removeClass("reduce" + this.reduceFactor);
            this.reduceFactor--;
            $(el).addClass("reduce" + this.reduceFactor);
            this.handleFontSizeChange(el, this.options);
        },

        growFont : function(el){
            console.log("growFont");

            $(el).removeClass("reduce" + this.reduceFactor);
            this.reduceFactor++;
            $(el).addClass("reduce" + this.reduceFactor);
            this.handleFontSizeChange(el, this.options);
        },

        //Fix selectors here -- attaches to more than just current
        attachScrollHandler : function(el){
            cur = this;

            var tableBodyWrapper = $(el).find('.scrollable .body-wrapper');

            $(tableBodyWrapper).on("scroll", function(e){

                console.time("scrollcheck");
                
                var tableHeader = $(this).prev().children('table');
                var pinnedTableBody = $(this).parent().prev().find('.body-wrapper table');

                var scrollLeft = $(this).scrollLeft();
                var scrollTop = $(this).scrollTop();

                //Ensure header and body are position locked with scrollable content
                $(tableHeader).css("left", -scrollLeft);
                $(pinnedTableBody).css("top", -scrollTop);



                var tableBody = $(this).find('table');

                var containerOuterWidth = $(this).outerWidth();
                var tableOuterWidth = $(tableBody).outerWidth();

                var containerOuterHeight = $(this).outerHeight();
                var tableOuterHeight = $(tableBody).outerHeight();

                // Determine where to show shadows
                var tableContainer = $(el).children('.tableContainer');

                if(scrollTop > 0){
                    tableContainer.addClass("content-hidden-top");
                }
                else{
                    tableContainer.removeClass("content-hidden-top");
                }

                if(tableOuterWidth - containerOuterWidth - scrollLeft + cur.scrollBarWidth > 0){
                    tableContainer.addClass("content-hidden-right");
                }
                else{
                    tableContainer.removeClass("content-hidden-right");
                }

                if(tableOuterHeight - containerOuterHeight - scrollTop + cur.scrollBarWidth > 0){
                    tableContainer.addClass("content-hidden-bottom");
                }
                else{
                    tableContainer.removeClass("content-hidden-bottom");
                }

                if(scrollLeft > 0){
                    tableContainer.addClass("content-hidden-left");
                }
                else{
                    tableContainer.removeClass("content-hidden-left");
                }

                console.timeEnd("scrollcheck");

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
            
            //Wrap the components
            var tableHeader = $(header).wrap('<div class="header-wrapper"><table /></div>').parent().parent();
            var tableBody = $(body).wrap('<div class="body-wrapper"><table /></div>').parent().parent();

            //Merge them
            var mergedTable = $(tableHeader).after(tableBody);

            //Reinsert table header and body content
            $(origTable).replaceWith(mergedTable);

            console.timeEnd("splitTableHeaders");
        },

        handleFontSizeChange : function (el, options){
            //If the font size has changed, reset max content widths
            var currentFontSize = parseInt($(el).css('font-size'), 10);
            var recordedFontSize = this.fontSize;

            if( currentFontSize != recordedFontSize ){


                //If split and below the minimum font size threshold, scale the font back up 
                if(this.isSplit && this.reduceFactor < 0 && currentFontSize < options.minFontSize){
                     this.growFont(el);
                     currentFontSize = parseInt($(el).css('font-size'), 10);
                }

                this.fontSize = currentFontSize;
                console.warn("font size changed from  " + recordedFontSize + " to " + currentFontSize);

                //Reset content widths
                this.maxContentWidth.length = 0;

                //Recalculate max content widths
                this.findMaxColContentWidth(el, this.maxContentWidth);
                
                //Update min-col widths to reflect the new content size  
                console.time("setColMinWidth");             
                this.setColMinWidth(this.element, this.maxContentWidth);
                console.timeEnd("setColMinWidth");

                //Reset margin left
                scrollable = $(el).find('.scrollable');
                $(scrollable).css("margin-left", $(el).find('.pinned').width() + 1);

            }
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