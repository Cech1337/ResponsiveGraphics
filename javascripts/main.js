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

});

$(window).load(function() {

});



var reduceBy = 0;

$(window).on("throttledresize", function(event){

	var resized = false;
	var minDistance;

	$(".scalable table span").each(function(){
		var contentWidth = $(this).width(); 
		var columnWidth = $(this).parent().width();
		var distance = columnWidth - contentWidth;

		if(minDistance == null || distance < minDistance){
			minDistance = distance;
		}

		console.log(
			"Content: " + contentWidth +"\n"+
			"Column: " 	+ columnWidth +"\n"+
			"Distance: "+ distance
		);

		if(distance < 12){
			$(".scalable").removeClass("reduce" + reduceBy);
			reduceBy--;
			$(".scalable").addClass("reduce" + reduceBy);
			resized = true;
			return false;
		}
	});

	//If cells have plenty of breathing room, expand font sizes until back to normal
	if(!resized && minDistance > 40 && reduceBy < 0){

	}

});