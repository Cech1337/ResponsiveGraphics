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
	detectCollisions();
});


$(window).on("throttledresize", function(event){

	detectCollisions();

});