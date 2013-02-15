//Molten Leading
(function($) {
	$.fn.moltenLeading = function( config ) {
		var o = $.extend( {
			minline: 1.2,
			maxline: 1.6,
			minwidth: 320,
			maxwidth: 1024
		}, config ),
		hotlead = function( el ) {
			var $el = $( this !== window ? this : el ),
			widthperc = parseInt( ( $el.width() - o.minwidth ) / ( o.maxwidth - o.minwidth ) * 100, 10 ),
			linecalc = o.minline + ( o.maxline - o.minline ) * widthperc / 100;

			if ( widthperc <= 0 || linecalc < o.minline ) {
				linecalc = o.minline;
			} else if ( widthperc >= 100 || linecalc > o.maxline ) {
				linecalc = o.maxline;
			}

			$el.css( "lineHeight", linecalc );

			$( window ).one( "resize", function() {
				hotlead( $el );
			});
		};

		return this.each( hotlead );
	};
})(jQuery);


/*
* throttledresize: special jQuery event that happens at a reduced rate compared to "resize"
*
* latest version and complete README available on Github:
* https://github.com/louisremi/jquery-smartresize
*
* Copyright 2012 @louis_remi
* Licensed under the MIT license.
*
* This saved you an hour of work?
* Send me music http://www.amazon.co.uk/wishlist/HNTU0468LQON
*/
(function($) {

	var $event = $.event,
	$special,
	dummy = {_:0},
	frame = 0,
	wasResized, animRunning;

	$special = $event.special.throttledresize = {
		setup: function() {
			$( this ).on( "resize", $special.handler );
		},
		teardown: function() {
			$( this ).off( "resize", $special.handler );
		},
		handler: function( event, execAsap ) {
			// Save the context
			var context = this,
			args = arguments;

			wasResized = true;

			if ( !animRunning ) {
				setInterval(function(){
					frame++;

					if ( frame > $special.threshold && wasResized || execAsap ) {
			// set correct event type
			event.type = "throttledresize";
			$event.dispatch.apply( context, args );
			wasResized = false;
			frame = 0;
		}
		if ( frame > 9 ) {
			$(dummy).stop();
			animRunning = false;
			frame = 0;
		}
	}, 30);
				animRunning = true;
			}
		},
		threshold: 0
	};
})(jQuery);



/*  -----------------------------------------------------------------------------
	::  Responsive tables
	----------------------------------------------------------------------------- */

function splitTable(original){
	original.wrap("<div class='table-wrapper' />");

	var copy = original.clone();
	copy.find("td:not(:first-child), th:not(:first-child)").css("display", "none");
	copy.removeClass("responsive");

	original.closest(".table-wrapper").append(copy);
	copy.wrap("<div class='pinned' />");
	original.wrap("<div class='scrollable' />");

	setCellHeights(original, copy);
}

function unsplitTable(original) {
	original.closest(".table-wrapper").find(".pinned").remove();
	original.unwrap();
	original.unwrap();
}

function setCellHeights(original, copy) {
	var tr = original.find('tr'),
	tr_copy = copy.find('tr'),
	heights = [];

	tr.each(function (index) {
		var self = $(this),
		tx = self.find('th, td');

		tx.each(function () {
			var height = $(this).outerHeight(true);
			heights[index] = heights[index] || 0;
			if (height > heights[index]) heights[index] = height;
		});

	});

	tr_copy.each(function (index) {
		$(this).height(heights[index]);
	});
}


/*  -----------------------------------------------------------------------------
	::  Detect table cell collisions and resize or go responsive
	----------------------------------------------------------------------------- */

var split = false;
var splitWidth;

var detectCollisions = function(minPadding, maxPadding, minFontSize, fontRatio){

	//console.time('resizer');

	//For each scalable table
	$(".scalable").each(function(){

		var scalableContainer = $(this);
		var reduceFactor = $(this).attr("reduceFactor");
		var resized = false;
		var minDistance;

		//If the current table is not split
		if(!split){

			// For each table cell, detect potential column collisions
			$(this).find("table span").each(function(){

				var contentWidth = $(this).width(); 
				var columnWidth = $(this).parent().width();
				var distance = columnWidth - contentWidth;

				if(minDistance == null || distance < minDistance){
					minDistance = distance;
				}

				//If this cell has less padding than the minimum padding
				if(distance < minPadding){

					//Calculate target font size				
					var currentFontSize = parseInt($(this).css("font-size"), 10);
					var targetFontSize = currentFontSize / fontRatio;
					
					//If reducing the font will shrink it beyond the min font size, go responsive and break
					if(targetFontSize < minFontSize){
						console.log(
							"Unacceptable target Font Size: " + targetFontSize + "\n" +
							"Time to go responsive!"
							);
						splitWidth = $(window).width();
						splitTable($(scalableContainer).find(".responsive"));
						split = true;
						$(scalableContainer).addClass("split");
						return false;
					}
					//Else targetFontSize is within the accepted range and should be applied
					else{
						console.log("Accepted target font size: " + targetFontSize);

						//Remove existing reduce class
						$(scalableContainer).removeClass("reduce" + reduceFactor);
						//Set reduce factor one less than current
						reduceFactor--;
						//Set attribute to reflect scale change
						$(scalableContainer).attr("reduceFactor", reduceFactor);
						//Add a class to render scale change
						$(scalableContainer).addClass("reduce" + reduceFactor);
						//Don't attempt to increase size on this loop
						resized = true;
						//break
						return false;
					}
				}
			});

			//If all cells have more than maxPadding distance, expand font size until font-size is not scaled from base
			if(!resized && minDistance > maxPadding && reduceFactor < 0){
				//Remove existing reduce class
				$(scalableContainer).removeClass("reduce" + reduceFactor);
				//Set reduce factor one more than current
				reduceFactor++;
				//Set attribute to reflect scale change
				$(scalableContainer).attr("reduceFactor", reduceFactor);
				//Add a class to render scale change
				$(scalableContainer).addClass("reduce" + reduceFactor);
			}

		}

		//Else the table is split and detect if it's ready to be unsplit
		else{
			if($(window).width() > splitWidth){
				console.log("Time to go back to normal");
				unsplitTable($(scalableContainer).find(".responsive"));
				split = false;
				$(scalableContainer).removeClass("split");
				//detectCollisions(minPadding, maxPadding, minFontSize, fontRatio);
				return false;
			}
		}

	});

	//console.timeEnd('resizer');
}


