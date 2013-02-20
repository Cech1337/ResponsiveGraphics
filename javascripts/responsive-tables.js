//Enclose all table cells in spans so we can calculate colision distance
 $('td, th').wrapInner('<span />');
 $(".scalable").attr("reduceFactor", 0);


// SOURCE

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
					
					//If reducing the font will shrink it beyond the min font size, go responsive
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