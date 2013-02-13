//Inits
$('p, table, .footnote').moltenLeading({
	minline: 1.25,
	maxline: 1.5,
	minwidth: 220,
	maxwidth: 460
});

$('.caption').moltenLeading({
	minline: 1.1,
	maxline: 1.3,
	minwidth: 320,
	maxwidth: 600
});

$(document).ready(function() {
	var myvalues = [10,8,5,7,4,4,1,10,8,5,7,4,4,1,10,8,5,7,4,4,1];
    $('.dynamicsparkline').sparkline(myvalues);

    //Enclose all table cells in spans so we can calculate colision distance
    $('td, th').wrapInner('<span />');
    $(".scalable").attr("reduceFactor", 0);

});

$(window).load(function() {

});


$(window).on("throttledresize", function(event){

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


});