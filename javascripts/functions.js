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
	::  Detect table cell collisions
	----------------------------------------------------------------------------- */

var detectCollisions = function(){

	console.time('resizer');

	//Loop through each scalable table
	$(".scalable").each(function(){

		var scalableContainer = $(this);
		var reduceFactor = $(this).attr("reduceFactor");
		var resized = false;
		var minDistance;

		// Loop through this table's content to detect potential collisions
		$(this).find("table span").each(function(){

			var contentWidth = $(this).width(); 
			var columnWidth = $(this).parent().width();
			var distance = columnWidth - contentWidth;

			if(minDistance == null || distance < minDistance){
				minDistance = distance;
			}

			if(distance < 10){
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
		});

		//If all cells have plenty of breathing room, expand font sizes until back to normal
		if(!resized && minDistance > 30 && reduceFactor < 0){
			//Remove existing reduce class
			$(scalableContainer).removeClass("reduce" + reduceFactor);
			//Set reduce factor one more than current
			reduceFactor++;
			//Set attribute to reflect scale change
			$(scalableContainer).attr("reduceFactor", reduceFactor);
			//Add a class to render scale change
			$(scalableContainer).addClass("reduce" + reduceFactor);
		}

	});
	
	console.timeEnd('resizer');
	
}


